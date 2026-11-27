# Horizon safety, slope-integrated optics, and breaking-wave physics

Use this reference to prevent horizon-barcode stripes on open oceans by construction, integrate sky and object reflections across the pixel's wave-slope distribution with Cox–Munk roughness hand-off, validate FFT cascades against a CPU reference, and model volumetric breaking surf.

## Contents

- Horizon-safe by construction (three-cause barcode elimination)
- Slope-integrated sky and planar object reflections
- Cox-Munk slope variance and roughness hand-off
- CPU cascade validation tool
- Breaking-wave volumetric body and life cycle
- Observed limits and defects
- Diagnostics and failure diagnosis

## Horizon-safe by construction (three-cause barcode elimination)

Open oceans rendered to the horizon suffer from a recurring defect: dark or bright vertical **"barcode" stripes** in the first `1–3%` of image height below the horizon. **Three independent mechanisms** each produce that exact barcode, so all three must be closed when the ocean is first built — fixing only one leaves the next change to re-expose another:

1. **Ambient occlusion on quantized far depth (`$threejs-screen-space-ambient-occlusion`):** exclude water, sky, and emissives from the AO pre-pass/composite from day one, fade AO cleanly to `1.0` with distance, and enable `reversedDepthBuffer: true` on `WebGPURenderer`.
2. **Single sky-map texels stretched at grazing angles:** near the horizon, the pixel footprint stretches vertically by `1 / cos(viewAngle)`, squeezing sky lookups into vertical slivers that stretch single environment texels into stripes. Always read the sky environment map at a **mip level matched to the sample's solid-angle footprint**.
3. **Depth-buffer water terms quantizing at distance:** screen-space refraction, depth-difference absorption, and depth-difference contact foam lose depth precision toward the horizon and quantize into vertical columns. Smoothly fade **all three depth-buffer terms** out by distance well before precision degrades, transitioning cleanly into deep-water analytic body color + sky reflection.

Additionally, **ban static per-pixel dither or jitter patterns on far water**; a fixed screen pattern stretched at grazing angles reads directly as vertical stripes.

| Water shading term | Near water | Far / horizon water |
| --- | --- | --- |
| Ambient occlusion | Never applied to water | Never applied to water |
| Screen-space refraction | Active with `15–20%` guard band | Smoothly faded to analytic body color before depth precision fails |
| Depth-buffer absorption | True water depth path | Smoothly faded to deep-water body color |
| Depth-difference contact foam | Active near coasts/hulls | Smoothly faded over same distance band |
| Sky reflection | Slope-integrated, footprint-matched mips | Same, footprint stretched by `1 / cos(viewAngle)` along view |
| Static dither / jitter | Varies per frame or none | Strictly none |

## Slope-integrated sky and planar object reflections

Evaluating one single reflection ray `reflect(-V, N)` per pixel leaves wide ocean surfaces dark outside a narrow vertical glint strip under the sun.

- **Stratified slope integration:** draw `4` to `16` stratified slope offsets from the pixel's wave-slope distribution (resolved cascade slope variance + unresolved roughness hand-off), evaluate Fresnel (`F0 = 0.02` for IOR `1.33`, rising to `~0.60` at `85°` and `1.0` at `90°`) and mip-matched sky radiance per sample, and sum. This produces a natural glowing sunset sea across the entire wave field rather than a single clipped column.
- **Planar mirror reflection of scene objects:** render scene geometry above the waterline through a camera mirrored across the mean water plane, strictly clipped at `y = waterLevel` so submerged hulls or terrain never leak into reflections. Sample the mirror render (half-resolution with mip chain, blurred by slope variance) using the same slope offsets so ships, cliffs, piers, and towers reflect physically rather than as painted tints.
- **Sun glitter from real solar irradiance:** compute glitter from the probability that a micro-facet normal bisects sun and view directions under total slope variance `sigma^2` multiplied by Fresnel and true solar irradiance (strip the sun disc from the sky reflection map so it is not double-counted).
- **Cloud shadows and wind slicks:** modulate direct sun glitter and scatter by the scene's cloud-shadow field (`$threejs-volumetric-clouds`), and optionally attenuate short-wave energy along wind-aligned slick masks to create natural glassy bands inside the glitter path.
- **Clean object-waterline contacts:** prevent bright outlines where hulls or rocks pierce water by excluding the piercing object from its own refraction lookup and depth-testing refraction samples cleanly.

## Cox-Munk slope variance and roughness hand-off

Real wind-driven seas follow the Cox–Munk clean-surface mean-square slope relation:

```text
coxMunkMss(U) = 0.003 + 0.00512 * U      (U = wind speed in m/s at ~10-12.5 m)
```

Use incommensurate cascade patch sizes (e.g., `233 m`, `41 m`, `7.3 m` — non-integer multiples so repeats never align visually) with strictly disjoint wavenumber bands `[k_min, k_max)`.

As each cascade's wavelength approaches the slanted pixel footprint (`footprint_slant = footprint / cos(viewAngle)`):
1. Smoothly fade that cascade's displacement and slope contribution to zero before it aliases.
2. **Hand its lost slope variance (`mss_lost`) directly to the surface roughness / GGX micro-facet variance term** (plus the unresolved sub-grid remainder `max(0, coxMunkMss(U) - sum(resolvedMss))`).

Without roughness hand-off, fading distant cascades flattens the horizon into a muddy, overly mirror-like band.

## CPU cascade validation tool

Run `node scripts/ocean-spectrum-check.mjs [windSpeed=8] [fetchKm=200]` (or `--self-test`) before wiring GPU FFT cascades to verify:

- JONSWAP with dimensionless fetch cap (`X_FULL = 2.17e4`) preventing runaway sea growth at huge fetches;
- Hermitian conjugate symmetry (`heightImag` near `0`);
- Parseval energy conservation (`spatialVariance == spectralVariance`);
- significant wave height (`Hs = 4 * sqrt(variance)`) against Pierson–Moskowitz full development;
- resolved total slope variance vs `coxMunkMss(U)` and exact remainder handed to roughness.

Compare one frame of the GPU inverse FFT against the CPU reference using the same seed and wind speed (max height/variance error `< 1e-3`) before tuning shading.

## Breaking-wave volumetric body and life cycle

Coastal surf and breaking waves must read as **thick volumes of water**, never thin curved sheets masked by particle spray:

- **Volumetric cross-section:** thick, dark absorbing base; steep face textured by smaller waves and flow lines running up the curl; thin backlit crest transmitting bright cyan/green subsurface light; thrown forward lip.
- **Convex sightline for elevated surf:** when viewing a giant wave run from above, keep the upper-to-lower slope convex so the entire run down to the base stays visible.
- **Physical 5-stage life cycle:**
  1. **Form:** incoming swell steepens;
  2. **Throw:** lip pitches forward cleanly;
  3. **Crash:** curl impacts the base rapidly (`< 1 s` for small coastal waves — never freezing as a lingering stone arch);
  4. **Subside:** turbulent whitewater bore flattens over `1–2 s` into decaying lace foam;
  5. **Rise:** next swell builds cleanly from settled water.
- **Periodic wrap consistency:** when looping an endless surf wave, wrap shape, displacement, foam, texture, and shadow lookups on the identical spatial/temporal period (`$threejs-temporal-stability`).

## Observed limits and defects

- **Planar mirror cost on complex coastlines:** a second scene pass doubles draw calls if unfiltered; render only above-waterline layers into a half-resolution mip-mapped mirror target updated every frame.
- **Absorption calibration:** clear open-ocean seawater absorbs approximately `R: 0.45 / G: 0.07 / B: 0.02` per metre (`1/m`); coastal water is more turbid and greener — adjust coefficients rather than painting flat turquoise diffuse albedo.

## Diagnostics and failure diagnosis

Run the horizon check **immediately** after the first shaded ocean render and again after every AO, depth, or reflection edit:

```text
horizon stripe check       grazing captures from 3+ camera heights (low, eye/deck, high), toward & away from sun;
                           verify with measure.py --stripes ($threejs-visual-validation)
per-term isolation         sky reflection only, planar mirror only, glitter only, body/refraction only, foam only
CPU vs GPU FFT parity      match Hs and slope variance against scripts/ocean-spectrum-check.mjs
high-altitude check        confirms incommensurate cascades produce zero repeating tile grid
```

Failure diagnosis:

- **Vertical dark or bright barcode stripes below the horizon:** bisect in strict order — toggle AO off, toggle depth-based water terms off, toggle reflection off — then close **all three** horizon mechanisms (AO mask/fade, depth-term fade, footprint-matched sky mips).
- **Sea stays dark except one thin bright glint strip:** single reflection direction or display-clamped sun radiance; switch to `4–16` stratified slope samples and true solar irradiance glitter.
- **Muddy, flat horizon with no wave sheen:** cascade slopes faded without transferring lost slope variance into roughness, or footprint ignored `1 / cos(viewAngle)` slant.
- **Bright outline where ships or piers meet the water:** refraction/depth lookup is sampling the object's own pixels; exclude foreground objects from refraction lookups and depth-test cleanly.
