# Practical, emissive, and subject lighting

Use this reference to couple visible light fixtures and emissive surfaces to their surrounding scene illumination and to light hero subjects and characters cleanly without shadow-breaking hacks.

## Contents

- Practical light fixtures
- Scaling dense light populations
- Emissive surfaces lighting surroundings
- Subject and character lighting
- Observed limits and defects
- Diagnostics and failure diagnosis

## Practical light fixtures

Every visible light fixture (lantern, street lamp, sconce, candle, interior ceiling fixture) must act as a coherent physical source rather than an isolated glowing mesh:

1. **Physical falloff and range:** place a real `PointLight` or `SpotLight` at the fixture with inverse-square decay (`decay = 2`) and a finite `distance` range that fades smoothly to zero without hard cutoffs.
2. **Color temperature anchors:**
   - candle / open flame: `~1900 K` (`#ff9329` linear warm orange);
   - tungsten / incandescent lantern: `~2700 K` (`#ffc58f`);
   - warm halogen / architectural spot: `~3200 K`;
   - high-pressure sodium street lamp: `~2100 K` deep amber-orange;
   - fluorescent / cool daylight tube: `~5000–6500 K`.
3. **Local shadows where geometry is close:** enable shadows on nearby hero fixtures whose brackets, shades, or alcoves visibly shape the light on adjacent walls.
4. **Visible emitter + sub-pixel energy conservation:** render the bulb, filament, or flame as an emissive mesh/disc with HDR luminance matching the scene's brightness hierarchy (`sun > practical fixtures > luminous signs > ambient screens`) so bloom (`$threejs-bloom`) responds naturally. When a tiny bulb shrinks below `1 px` at distance, clamp its apparent radius to a minimum footprint (`~0.75–1.0 px`) while scaling radiance down proportionally by `(trueArea / clampedArea)` so it neither vanishes nor strobes.
5. **Lit windows:** back glowing windows with interior-mapped parallax rooms or real recessed interior geometry plus room light — never flat uniformly emissive planes glued to a facade.

### Practical fixture contract and sub-pixel energy scaling

```js
// Energy-conserving apparent radius and radiance for distant bulbs/lanterns
export function conserveSubPixelBulb({
  trueRadiusM,
  distanceM,
  verticalFovRad,
  viewportHeightPx,
  baseRadiance,
  minRadiusPx = 0.85,
}) {
  const pxPerMetre = viewportHeightPx / (2 * Math.max(distanceM, 0.1) * Math.tan(verticalFovRad * 0.5));
  const trueRadiusPx = trueRadiusM * pxPerMetre;
  if (trueRadiusPx >= minRadiusPx) {
    return { radiusM: trueRadiusM, radiance: baseRadiance };
  }
  const clampedRadiusM = minRadiusPx / pxPerMetre;
  const areaScale = (trueRadiusPx / minRadiusPx) ** 2;
  return { radiusM: clampedRadiusM, radiance: baseRadiance * areaScale };
}
```

### Physical temperature and luminous hierarchy table

| Emitter class | Typical color temperature | Relative linear HDR hierarchy | Local scene light strategy |
| --- | --- | --- | --- |
| Direct solar disc | `5500–6000 K` (high) / `2800–4000 K` (low) | `100–1000+` | Primary shadow-casting `DirectionalLight` |
| Street / courtyard lantern | `2100–2700 K` | `8–25` | Live inverse-square `PointLight` (nearest `2–8`) + probe/vertex bake for distant fixtures |
| Interior lit window | `2700–3400 K` | `3–10` | Interior-mapped or modelled room + subtle outward spill light / probe bounce |
| Neon sign / hologram | Saturated artistic hue | `4–15` | Real-extent reflection mesh + area/local bounce light illuminating adjacent masonry |
| Screen / monitor | `6000–6500 K` | `1.5–4` | Soft low-radius local spill light; never outshines lamps or sunlight |

## Scaling dense light populations

Scenes with dozens or hundreds of lanterns, street lamps, or illuminated windows cannot evaluate live shadow-casting lights for every fixture:

```text
near hero fixtures (top 2-8 closest/largest)   -> live PointLight/SpotLight (shadows where brackets/alcoves read)
mid/far static fixtures                        -> baked into LightProbeGrid, vertex colors, or per-instance light attributes at load
moving practicals (vehicles, torches)          -> live non-overlapping local lights updated every frame
```

Baking static practical illumination into a `LightProbeGrid` (`references/irradiance-probes-and-reflections.md`) or vertex irradiance at startup delivers both direct falloff and colored wall bounce at negligible runtime cost.

### Live-versus-baked fixture partitioning

Partition dense lamp arrays deterministically by camera distance and luminous importance so dynamic lights stay within budget (`<= 6–8` live local lights, `<= 2–3` shadow-casting) without popping:

```js
// Deterministic split between live local lights and probe-baked practicals
export function partitionFixtureLights(fixtures, cameraPos, {
  maxLive = 6,
  maxShadowCasters = 2,
  fadeRadiusM = 28,
} = {}) {
  const scored = fixtures.map((f) => {
    const dist = f.position.distanceTo(cameraPos);
    const weight = (f.luminousFlux ?? 1) / Math.max(dist * dist, 1.0);
    return { fixture: f, dist, weight };
  }).sort((a, b) => b.weight - a.weight);

  const live = scored.slice(0, maxLive).filter((entry) => entry.dist < fadeRadiusM);
  return {
    shadowLive: live.slice(0, maxShadowCasters).map((e) => e.fixture),
    unshadowedLive: live.slice(maxShadowCasters).map((e) => e.fixture),
    bakedOnly: scored.slice(live.length).map((e) => e.fixture),
  };
}
```

Match the baked probe radiance at `fadeRadiusM` to the smooth distance attenuation of the promoted live light so approaching or leaving a street lantern never produces an abrupt brightness jump on adjacent masonry.

## Emissive surfaces lighting surroundings

No luminous surface should sit inside an unlit void. Glowing water, molten lava, crystal clusters, neon signs, projection screens, and volumetric holograms must cast light onto adjacent stone, floors, and props:

- **Point/area/probe coupling:** attach a bounded local light, `RectAreaLight` (or area approximation), or probe contribution matching the emitter's color and spatial extent.
- **Extent-accurate reflections:** glossy floors and wet ground below an emissive sign, window, or hologram must reflect the emitter's actual shape via a planar mirror render (`reflector`) or area-light specular term — never a single point-light highlight standing in for a `4 m` neon strip.
- **Holographic and projected light:** keep projected holograms additive and emissive while casting matching colored bounce onto the plinth/floor beneath them; avoid moiré or harsh strobing scanlines, and add world-space scattering media (`$threejs-atmosphere-aerial-perspective`) when the projection beam passes through dusty air at architectural scale.

## Subject and character lighting

Light characters, statues, and hero subjects using cinematographic three-point discipline integrated with the physical scene:

1. **Key from above and to the side:** usually the scene's primary sun or overhead practical (`25°–55°` elevation, `30°–60°` off camera axis); models facial planes and silhouettes cleanly.
2. **Soft, lower-intensity fill:** derived from sky fill, floor bounce, or an explicit motivated bounce surface (`15–35%` of key intensity depending on mood).
3. **Rim light for figure-ground separation:** positioned behind/obliquely (`120°–160°` azimuth from camera) to separate dark silhouettes from dark backgrounds.
4. **Avoid accidental under-lighting:** placing a key light below eye level reads as horror unless a real floor emitter, campfire, or glowing water below the subject motivates it.
5. **Honor scene shadows:** characters and hero props **must receive cast shadows** from architecture and canopies. A figure crossing a shadow boundary must show the shadow edge moving across its surface.
6. **Ban self-lit fill cheats:** never lift a dark character by adding constant emissive or unshadowed per-material ambient fill. If a subject reads too dark in shade, add a motivated physical bounce (bright paving, nearby window, subtle local fill light with finite falloff) and verify it holds across orbit views.

```js
// Motivated local bounce rig for a shaded hero statue or figure (no self-lit cheat)
export function createMotivatedBounceLight({
  bounceOrigin,
  subjectCenter,
  surfaceAlbedoHex = 0xd8cdb8,
  intensity = 0.8,
  distance = 8.0,
}) {
  const bounce = new THREE.PointLight(surfaceAlbedoHex, intensity, distance, 2.0);
  bounce.position.copy(bounceOrigin);
  bounce.castShadow = false; // subtle secondary fill; primary sun retains cast shadows
  bounce.userData.motivatedBy = "sunlit-ground-bounce";
  bounce.userData.target = subjectCenter.clone();
  return bounce;
}
```

### Checklist for practical and emissive coherence

- Toggle all practical lights off and back on: adjacent walls, plinths, and floors must change brightness and hue clearly.
- Orbit `360°` around every illuminated statue or character: confirm no hero-only floating fill light clips into geometry or creates unnatural rim flashes from behind.
- Inspect every glowing liquid, hologram, or window at grazing floor angle: confirm its reflection matches its true geometric shape rather than collapsing to a tiny specular dot.

## Observed limits and defects

- **`RectAreaLight` shadow limitation:** Three.js `RectAreaLight` does not cast native shadow maps; pair it with baked probe occlusion or a matching shadow-casting proxy only where occlusion is visually critical.
- **Excessive dynamic `PointLight` count:** each shadow-casting `PointLight` renders `6` cube shadow faces; cap dynamic shadow-casting point lights strictly and bake static fixtures whenever possible.
- **Unbounded emissive multipliers:** arbitrary `emissiveIntensity = 50` values on ordinary screens blow out HDR bloom and invert the scene's luminance hierarchy.

## Diagnostics and failure diagnosis

Inspect every practical and emissive setup with:

```text
emissive-only isolation      verifies brightness hierarchy (sun > lamps > signs > screens) before bloom
surroundings close-up        checks floor/wall illumination and real-extent reflection beside every emitter
shadow-boundary walk         moves subject across a cast-shadow edge to confirm shadow reception (no self-lit cheat)
distance sweep               verifies sub-pixel bulbs conserve energy without twinkling or disappearing
```

Failure diagnosis:

- **Glowing lantern or neon sign sits in dark stone:** emissive material has no accompanying light or probe contribution; add a local inverse-square light or bake its radiance into the probe grid.
- **Polished floor reflects one round dot beneath a wide luminous wall:** area emitter is represented only by a `PointLight`; render the emitter mesh in the planar reflection pass or use an area-light specular model.
- **Statue or character face looks eerie/inverted:** primary light originates below head height without a visible lower source; raise key above and to the side.
- **Character stays uniformly bright inside deep shadow:** material carries constant emissive or unshadowed custom ambient fill; remove the self-lit term and use scene lights plus probe bounce.
