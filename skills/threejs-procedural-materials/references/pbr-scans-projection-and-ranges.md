# Physical PBR ranges, scan hygiene, triplanar projection, and derived maps

Use this reference to author physically coherent texture-backed and hybrid PBR materials — keeping albedos and metal reflectances within real physical ranges, verifying texture maps before thresholding, projecting without tiling or slope stretching, deriving missing maps on exported models in shader code, and avoiding thick-media refraction traps.

## Contents

- Physical albedo, metal, dielectric, and roughness ranges
- Texture-backed PBR hygiene and scan measurement
- TSL triplanar projection with whiteout normal blending
- Eliminating repetition, arc-length UVs, and texel density
- Realistic metals, whites, and thick transparent media
- Deriving missing maps for basecolor-only models
- Observed limits and defects
- Diagnostics and failure diagnosis

## Physical albedo, metal, dielectric, and roughness ranges

All albedo and metal reflectance entries below are **linear RGB** values. If a loaded base-color texture's measured linear mean falls outside its material family, verify its `colorSpace` (`THREE.SRGBColorSpace` for base color, `THREE.NoColorSpace` for roughness, normal, metalness, height, AO) before tuning lights.

### Diffuse albedo (linear)

| Material | Linear albedo range |
| --- | --- |
| Fresh snow | `0.80–0.90` |
| White paint / whitewash | `0.70–0.85` |
| Fresh white marble | `0.65–0.85` |
| Weathered limestone / light sand | `0.35–0.50` |
| Sandstone / concrete | `0.25–0.45` |
| Planed wood (light / dark) | `0.30–0.50` / `0.08–0.20` |
| Brick | `0.20–0.35` |
| Granite | `0.15–0.30` |
| Bare soil (dry / wet) | `0.15–0.25` / `0.08–0.15` |
| Bark | `0.10–0.25` |
| Grass / foliage (green dominant) | `0.08–0.20` |
| Asphalt | `0.04–0.12` |
| Charcoal / soot | `0.02–0.04` |

### Metals (metalness = `1`, base color = normal-incidence linear F0)

| Metal | Approximate linear F0 (R, G, B) |
| --- | --- |
| Gold | `1.00, 0.77, 0.34` |
| Silver | `0.97, 0.96, 0.92` |
| Copper | `0.96, 0.64, 0.54` |
| Brass | `0.91, 0.78, 0.42` |
| Polished bronze | `0.80, 0.55, 0.35` |
| Aluminium | `0.91, 0.92, 0.92` |
| Iron / steel | `0.56, 0.57, 0.58` |

Tarnish, oxidation, and cavity grime lower reflectance and raise roughness locally via geometric cavity/exposure masks.

### Dielectrics (`F0 = ((n - 1) / (n + 1))^2`) and perceptual roughness

| Dielectric | IOR (`n`) | F0 | Typical surface | Perceptual roughness |
| --- | ---: | ---: | --- | --- |
| Ice | `1.31` | `0.018` | Polished marble / lacquer | `0.05–0.15` |
| Water | `1.33` | `0.020` | Polished metal | `0.05–0.20` |
| Crown glass | `1.50` | `0.040` | Satin paint / waxed wood | `0.30–0.50` |
| Quartz | `1.54` | `0.046` | Stone / concrete / plaster | `0.60–0.90` |
| Diamond | `2.42` | `0.170` | Dry soil / sand / fabric | `0.80–1.00` |
| Strontium titanate | `2.41` | `0.170` | Wet surface shift | `-0.30` to `-0.60` roughness + darker albedo |

## Texture-backed PBR hygiene and scan measurement

When building realistic architectural, terrain, foliage, or prop surfaces backed by scanned PBR textures (complementing pure procedural/optical shaders where appropriate):

1. **Minimum realistic PBR bundle:** pair base color, tangent normal, and roughness maps (adding AO, height, and metalness whenever the surface benefits). Avoid flat constant roughness on real-world stone, wood, or plaster.
2. **Measure before thresholding or normalizing:** run `python3 scripts/scan-stats.py <maps...>` (requires Pillow + NumPy) on any map used for shader masks, height displacement, or normalization. Normalizing against an assumed mean that differs `2–3x` from the real map silently clamps masks to `0` or `1`.
3. **Check normal-map convention visually:** `scan-stats.py` catches tilted means (wrong color space or encoding), but OpenGL (`+Y` green) vs DirectX (`-Y` green) must be confirmed under raking light so raised ridges are lit on the side facing the light.
4. **Never collapse a scan into a flat tint or two-color ramp:** modulate scans multiplicatively (`baseColor * tint`) and preserve their internal grain, cracks, and roughness variation.
5. **Verify every channel reaches the shader:** inspect per-map debug views (albedo only, roughness only, world normal) before adjusting lighting.

## TSL triplanar projection with whiteout normal blending

Use triplanar projection on steep terrain, cliffs, rock outcrops, and organic forms where planar UVs stretch. Verify exact TSL imports against the project's installed Three.js build (checked against Three.js r187; equivalent math applies in GLSL):

```js
import {
  texture,
  positionWorld,
  normalWorld,
  abs,
  pow,
  vec3,
  float,
  normalize,
  Fn,
  transformNormalToView,
} from "three/tsl";

const triWeights = Fn(([n]) => {
  const w = pow(abs(n), vec3(6)); // sharpness 4-8 reduces blend smear on blocky rock
  return w.div(w.x.add(w.y).add(w.z));
});

const triSample = (map, p, w) =>
  texture(map, p.zy).mul(w.x)
    .add(texture(map, p.xz).mul(w.y))
    .add(texture(map, p.xy).mul(w.z));

// Whiteout normal blend in world space
const triNormal = (map, p, w, n, strength = 1) => {
  const tx = texture(map, p.zy).xyz.mul(2).sub(1);
  const ty = texture(map, p.xz).xyz.mul(2).sub(1);
  const tz = texture(map, p.xy).xyz.mul(2).sub(1);
  const s = float(strength);
  const nx = vec3(tx.xy.mul(s).add(n.zy), abs(tx.z).mul(n.x));
  const ny = vec3(ty.xy.mul(s).add(n.xz), abs(ty.z).mul(n.y));
  const nz = vec3(tz.xy.mul(s).add(n.xy), abs(tz.z).mul(n.z));
  return normalize(nx.zyx.mul(w.x).add(ny.xzy.mul(w.y)).add(nz.xyz.mul(w.z)));
};

// Usage:
// const p = positionWorld.mul(tilesPerMetre);
// const w = triWeights(normalWorld); // flip normalWorld by faceDirection on double-sided materials
// material.colorNode = triSample(maps.basecolor, p, w).rgb;
// material.roughnessNode = triSample(maps.roughness, p, w).r;
// material.normalNode = transformNormalToView(triNormal(maps.normal, p, w, normalWorld, 1.0));
```

- **Displacement parity:** when displacing vertices from a height map, sample the height map with the **exact same** triplanar axes, `tilesPerMetre`, and offset as the shading maps so geometric cracks align with visual cracks (`$threejs-terrain-and-landscapes`).

## Eliminating repetition, arc-length UVs, and texel density

| Anti-tiling mechanism | Where to apply |
| --- | --- |
| Multi-scale blending (`1.0×`, `~0.27×`, `~0.07×` frequencies blended by distance or low-frequency mask) | Cliffs, terrain, large stone walls |
| Per-element UV hash (offset + `90°`/`180°` rotation + slight tone shift per slab/plank/tile) | Paving, stone floors, timber cladding, roof tiles |
| Macro low-frequency tint and roughness modulation | Any continuous large architectural or ground span |
| Geometry-driven weathering masks (cavity grime, ledge run-off, up-facing moss) | Masonry, stone, rock |
| Stochastic / hexagonal tiling | Unstructured natural ground textures |

- **Arc-length UVs:** compute `U` from cumulative path/profile arc length on sweeps, lofts, and lathes — never raw segment index — so textures do not stretch across unevenly spaced segments.
- **Consistent texel density:** anchor `tilesPerMetre` to real physical dimensions (`~75 mm` brick courses, `0.4–0.9 m` paving slabs, true wood grain width) and keep density continuous across adjacent walls, trims, and mouldings.
- **Specular AA:** add normal-derivative variance (`fwidth(normalWorld)`) into roughness alongside anisotropic filtering (`8–16x`) so gold carving, wet stone, and fine mouldings do not shimmer in motion (`$threejs-temporal-stability`).

## Realistic metals, whites, and thick transparent media

- **Pale stone and whites:** a uniform flat white reads as over-exposed/blown out even when pixel values sit below `0.85`. Retain fine high-frequency albedo and roughness variation (`8×8` local contrast) inside white walls, marble, and snow.
- **Metals that read as metal:** set `metalness = 1`, use physical linear F0 reflectance, keep roughness varied from a scan, and provide a rich environment with dark/bright contrast (`$threejs-lighting-and-gi`). Smooth wide bands of gold reflecting a uniform mid-grey environment read as flat yellow paint.
- **Thick transparent bodies:** Beer–Lambert transmittance (`exp(-sigma * pathLength)`) compounds exponentially across metres of glass, crystal, or ice. Calibrate `sigma` at the object's real thickness rather than a `1 cm` swatch so thick glass does not collapse to black or navy.
- **Guard-band refraction & gem fire:** screen-space refraction needs a `15–20%` overscan guard band (`$threejs-temporal-stability`) and fallback toward the pixel's own UV (never sampling an unrelated sky probe through the bottom of a glass floor). Keep reflections on dedicated probes/planar passes rather than the refraction buffer; include the solar aureole so faceted gems catch real dispersion fire.
- **Backlit foliage and petals:** add a thin-surface back-face translucency term tinted by leaf albedo so backlit canopies glow naturally instead of turning opaque black.

## Deriving missing maps for basecolor-only models

When placing exported third-party models that ship only a base-color texture (causing matte painted shading), leave the asset file byte-identical and derive missing PBR channels in the shader:

1. **Smooth HSV class segmentation:** build `smoothstep` masks over hue distance, saturation, and value to separate material regions (e.g., saturated warm yellow-orange → metalness `1` + gold F0 + low roughness; saturated red lacquer → dielectric + low roughness + clearcoat; pale low-saturation fur/cloth → high roughness + soft sheen; stone → rough matte).
2. **High-pass luminance micro-relief:** derive a tangent bump term from the high-pass luminance of the base color weighted per material class so painted scales, stitching, and seams catch raking light.
3. **Bump-coupled roughness:** polish raised ridges slightly while roughening and darkening recessed crevices.
4. **Anisotropic filtering:** enable high anisotropy on base-color maps so grazing surfaces stay crisp.

## Observed limits and defects

- **`scan-stats.py` runtime dependency:** requires Python 3 with Pillow and NumPy; inspect seam score (`> 1.5` warns of visible tiling seam) and linear luminance warnings before shipping textures.
- **Triplanar cost:** sampling `3` projections per map triples texture fetches; pack roughness/AO/height into one ORM texture (`R/G/B`) to cut triplanar taps by two-thirds.
- **Hue segmentation bleed:** hard threshold cuts on base-color-only models produce jagged metallic fringes; keep transition ramps smooth and verify under grazing specular light.

## Diagnostics and failure diagnosis

Inspect every material bundle with:

```text
per-map debug views         albedo-only, roughness-only, metalness-only, world-normal views
scan-stats.py JSON report   linear mean, percentiles, seam score, normal XY tilt, roughness variance
close / grazing / overhead  checks UV stretching on steep slopes and macro tiling from height
motion specular sweep       confirms zero shimmer on dense metal/stone micro-detail
```

Failure diagnosis:

- **Surface looks plastic or painted:** roughness is constant, normal map is absent, or data map loaded as sRGB; verify per-map debug views and linear color space.
- **Shader mask does nothing or saturates to `1.0` everywhere:** threshold assumed a `[0, 1]` full-range map while actual texture spans `[0.65, 0.80]`; run `scan-stats.py` and normalize against measured percentiles.
- **Gold reads as yellow paint:** smooth low-contrast geometry reflecting a uniform HDRI or `metalness < 1`; set `metalness = 1`, vary environment contrast, and bevel/facet edges.
- **Thick glass/crystal turns black:** Beer–Lambert `sigma` tuned for centimetres applied over metres; recompute `sigma = -ln(targetTransmission) / realThicknessMetres`.
