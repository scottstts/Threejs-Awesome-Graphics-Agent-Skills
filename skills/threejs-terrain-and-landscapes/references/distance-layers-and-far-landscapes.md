# Distance layers and far landscapes

Use this reference to construct continuous worlds out to the horizon with projected-size detail tiers, coherent backlit and front-lit far mountain ranges, and zero voids, sky leaks, or popping.

## Contents

- Projected-size distance layer matrix
- Tier handover and continuity rules
- Ground and horizon closure
- Reading and shading far landforms
- Cost-effective real methods versus banned proxies
- Observed limits and defects
- Diagnostics and failure diagnosis

## Projected-size distance layer matrix

Assign detail tiers by **projected pixel footprint** (`footprint ≈ 2 * d * tan(fov/2) / H_px`) rather than arbitrary fixed metre cutoffs. Typical open-world extents (`near ~0–100 m`, `mid ~0.1–2 km`, `far ~2–30 km`, `horizon > 30 km`) scale with camera height and lens:

| Content class | Near (full build) | Mid tier | Far tier | Horizon tier |
| --- | --- | --- | --- | --- |
| Terrain / ground | Full PBR + projection-matched displacement + contact detail | Same material, coarser mesh + normal map | Displaced landform + baked normal & terrain shadow map + macro albedo | Continuous terrain under aerial perspective |
| Vegetation / woods | Full botanical hierarchy (`$threejs-procedural-vegetation`) | Same tree skeleton, thinned twigs, area-conserved larger leaves | Instanced low-tier real trees | Terrain canopy shading only where one tree covers `< 2–3 px` |
| Architecture / towns | Full constructed walls, openings, trims, ornament | Same massing; fine ornament reduced to relief normals | True massing with real openings, roofs, and material splits | Lit/shaded massing silhouettes |
| Ocean / sea | Displaced FFT cascades + full shading (`$threejs-spectral-ocean`) | FFT normals faded by slanted footprint | Lost slope variance transferred to roughness + sky reflection | Continuous roughness/sky reflection with zero horizon seam |
| Clouds | Volumetric raymarch (`$threejs-volumetric-clouds`) | Volumetric raymarch | Bounded march handing smoothly into baked far layer/panorama | Layer extends past visible horizon with density fade |
| Crop fields | Individual stalk/leaf/head rows | Fewer, wider plants preserving row rhythm | Geometric furrow ridges + row material | Row-striped macro terrain material |

## Tier handover and continuity rules

1. **Same structure, reduced complexity:** every far tier reduces the same underlying generator (thinned branches, coarser massing, lower-octave terrain) — never swapping a tree for a sphere or a town for plain boxes.
2. **Measure the handover band:** render a strip at the transition distance twice — once using tier `k` alone, once using tier `k+1` alone — and compare mean color, value, and coverage (`$threejs-visual-validation`). Fix any step at its root cause (missing translucency, different normal weighting, lost leaf area, or shadow cutoff).
3. **Frustum culling only — never in-view distance culling:** popping hills, buildings, or forests into existence as the camera translates is a defect. Keep far landforms permanently resident in memory using coarse geometric tiers.
4. **Silhouette tessellation:** normal maps cannot smooth a polygonal ridge against the sky; allocate vertex density along ridge crests or use screen-space-error tessellation so far silhouettes remain crisp.

### Projected-size tier selector and horizon extent calculator

```js
// Choose distance tier by projected screen pixels rather than fixed metres
export function selectTierByProjectedPixels({
  objectSpanM,
  distanceM,
  verticalFovDeg,
  viewportHeightPx,
  previousTier = 0,
  hysteresis = 0.12, // 12% deadband prevents oscillating near a boundary
}) {
  const footprintM = (2 * Math.max(distanceM, 0.1) * Math.tan(((verticalFovDeg * Math.PI) / 180) * 0.5)) / viewportHeightPx;
  const projectedPx = objectSpanM / footprintM;
  const cutNear = previousTier === 0 ? 48 * (1 - hysteresis) : 48 * (1 + hysteresis);
  const cutMid  = previousTier <= 1 ? 12 * (1 - hysteresis) : 12 * (1 + hysteresis);
  const cutFar  = previousTier <= 2 ? 2.5 * (1 - hysteresis) : 2.5 * (1 + hysteresis);
  if (projectedPx >= cutNear) return 0; // near (full build)
  if (projectedPx >= cutMid)  return 1; // mid (reduced real structure)
  if (projectedPx >= cutFar)  return 2; // far (instanced low-tier real silhouette)
  return 3;                             // horizon (terrain canopy / macro shading)
}

// Minimum continuous ground/sea radius to close the visible horizon from eyeHeightM
export function minimumHorizonRadiusM(eyeHeightM, safetyFactor = 1.35) {
  const earthRadiusM = 6371e3;
  const geometricHorizonM = Math.sqrt(2 * earthRadiusM * Math.max(eyeHeightM, 1.5));
  return Math.ceil(geometricHorizonM * safetyFactor);
}
```

### World-closure directional plan

Before authoring far layers, record what extends past all six boundaries of the hero scene:

```text
north / ahead     next landform, valley, sea, or district out to minimumHorizonRadiusM()
south / behind    plausible continuation visible on 180-deg orbit (never empty void)
east / west       continuous ridges, coast, or urban fabric matching hero density
overhead          sky scattering model + clouds extending past visible horizon
straight down     continuous terrain/seabed/cloud sea with zero floating slabs
```

## Ground and horizon closure

Every direction the viewer can orbit — including `360°` along the horizon, high overhead, and straight down — must show a coherent world:

- **Continuous substrate:** extend terrain, ocean, or cloud-sea layers well beyond the furthest mountain rim or island (`horizonDistance ≈ 3.57 * sqrt(eyeHeightMetres) km` over open sea, or past `far` clip with atmospheric merge) so no gap of sky ever shows underneath distant massifs.
- **No terminating cloud or field edges:** fade cloud density and extend cloud shells far past the visible horizon so no glowing orange/blue sky slit appears beneath the deck edge.
- **Place-coherent surroundings:** extend off-frame regions logically for the setting (coastline into open sea, urban district into outlying quarters, mountain valley into stepped massif chains) rather than enclosing every scene in a generic ring of cones.
- **Sky-realm or elevated scenes:** when a scene sits high above the earth, supply a continuous volumetric/baked cloud sea, mist depth, or distant ground landscape far below — never empty background clear color.

## Reading and shading far landforms

Build distant mountain ranges as **massifs** — connected chains of multiple summits joined by ridges, saddles, spurs, and erosion gullies — never isolated cones or symmetric noise spikes.

Apply aerial perspective from the **exact same atmosphere model** as the visible sky (`$threejs-atmosphere-aerial-perspective`):

```text
L_seen = L_landform * T(d) + L_inscatter(d, viewDir)
```

How far landforms read depends strictly on sun-to-camera geometry:

| Lighting geometry | Correct visual behavior | Common failure |
| --- | --- | --- |
| **Backlit** (low sun ahead of camera) | Faces toward viewer sit in sky-lit shade, always **darker than the sky behind them**; each more distant range steps smoothly lighter as sunlit haze builds; haze hue tracks horizon sky per azimuth (warm gold toward sun, cool violet/grey away); sun-facing crests catch thin warm rims | Fixed-color beige fog or artificial front fill turning ranges into flat paper cut-outs equal in luminance to the sky |
| **Front-lit** (sun behind camera) | Near ranges carry real sunlit albedo with distinct dark shadowed gullies; distance cools and lifts shadows until haze merges far ridges | Over-hazy near ranges losing local ridge/gully contrast |
| **Side-lit** (cross sun) | Crisp warm/cool terminator runs down every ridge spine; lit flanks warm, shaded flanks lifted cool by sky fill | Excessive ambient fill flattening ridge relief |

### Backlit value-stepping and haze consistency check

Verify numerically that each successively more distant ridge steps smoothly toward horizon sky radiance without ever exceeding it when backlit:

```js
// Aerial-perspective transmittance and azimuthal horizon inscatter check
export function evaluateRidgeRadiance({
  shadedSurfaceRgb,
  horizonSkyAtAzimuthRgb,
  distanceM,
  extinctionPerMetre = 6.5e-5, // ~15 km characteristic haze length
}) {
  const transmittance = Math.exp(-extinctionPerMetre * Math.max(distanceM, 0));
  return [
    shadedSurfaceRgb[0] * transmittance + horizonSkyAtAzimuthRgb[0] * (1 - transmittance),
    shadedSurfaceRgb[1] * transmittance + horizonSkyAtAzimuthRgb[1] * (1 - transmittance),
    shadedSurfaceRgb[2] * transmittance + horizonSkyAtAzimuthRgb[2] * (1 - transmittance),
  ];
}
```

Confirm across three ridge ranges (`2 km`, `8 km`, `20 km`) that backlit luminance strictly satisfies `L(2 km) < L(8 km) < L(20 km) < L_horizonSky(azimuth)` and that the haze tint shifts smoothly from warm golden near the sun azimuth to cool slate/violet `90°–180°` away.

## Cost-effective real methods versus banned proxies

When far layers strain frame budgets, redesign the representation rather than inserting fake proxies:

| World-scale need | Accepted real low-cost method | Banned stand-in |
| --- | --- | --- |
| Distant forest | Instanced low-tier real trees + coverage-matched terrain canopy shading | Lumpy green blobs or crossing billboards |
| Distant skyline / town | Instanced building massing with real recessed/interior-mapped openings | Flat-textured boxes with zero depth |
| Far mountain ranges | Multi-scale ridged/eroded heightfield mesh + baked normal and terrain shadow maps | Cones, flat alpha cards, noise spikes |
| Cloud floor below elevated world | Volumetric field transitioning smoothly into a matched baked panorama | Flat white plane or uniform fog color |
| Horizon ocean | Footprint-faded FFT cascades handing lost slope variance to roughness | Flat plane with scrolling normal map |

## Observed limits and defects

- **Precision at tens of kilometres:** rendering near `1 cm` details and `50 km` ranges in one standard depth buffer causes severe Z-fighting on far hills; enable `reversedDepthBuffer: true` on `WebGPURenderer` and avoid needlessly tiny `camera.near` (`< 0.1 m`) in multi-kilometre worlds.
- **Baked terrain shadow staleness:** baked large-scale terrain self-shadowing assumes a fixed or slowly changing sun; re-bake or cross-fade when time-of-day shifts substantially.
- **Unmatched far-panorama exposure:** a baked distant cloud or horizon panorama rendered under a different tone-map or sun intensity creates a bright/dark seam at the handover distance; keep baked far layers in shared linear scene-referred HDR units.
- **Fixed-distance camera clipping:** setting `camera.far` shorter than `minimumHorizonRadiusM(eyeHeightM)` slices distant mountain silhouettes into straight horizontal lines; pair `reversedDepthBuffer: true` with a `far` plane past the outermost landform.

## Diagnostics and failure diagnosis

Mandatory whole-world verification sweep:

```text
high overhead + straight-down   confirms continuous ground, zero void, and zero floating bases
360-deg horizon sweep           taken from hero view + 2 alternate positions; zero layer ends or sky slits
fast fly-toward far layers      confirms smooth LOD transitions with zero popping or piece-by-piece streaming
handover-band A/B render        compares tier k vs tier k+1 mean color and coverage at transition distance
distant-range crop              checks value stepping relative to sky and directional horizon haze color
```

Failure diagnosis:

- **Distant mountains look like flat paper cutouts matching sky brightness:** artificial front fill is brightening backlit slopes or haze uses one static color; remove front fill, sample directional horizon inscatter from the sky model, and thin near haze so near ridges keep dark contrast.
- **All mountain layers share one flat grey value:** aerial perspective is constant rather than integrated by ray distance; compute transmittance `T(d)` and inscatter along distance from the shared atmosphere model.
- **Orange/bright band appears beneath cloud deck near horizon:** cloud shell ends inside the visible horizon; extend shell radii past horizon and smoothly fade outer density.
- **Sky leaks beneath distant islands or ranges:** base ground/sea plane stops at the mountain rim; extend continuous substrate underneath and beyond every landform.
- **Far hills appear piece by piece during flight:** distance culling or late chunk streaming is active in view; keep coarse far-tier geometry always resident and switch only by projected pixel size with hysteresis.
- **Low-detail buildings become visible up close:** detail was permanently omitted beyond an assumed hero camera boundary; generate full detail everywhere and let runtime projected-size LOD simplify invisibly.
