# Measured image comparison, per-layer attribution, and cost by redesign

Use this reference to measure visual gaps quantitatively instead of eyeballing screenshots, attribute every discrepancy to its owning rendering layer, verify open-water horizons and visual z-fighting, and optimize expensive effects by architectural redesign rather than blanket quality cuts.

## Contents

- Per-layer isolation views and gap attribution
- Quantitative image metrics (measure.py)
- Visual flicker sweep and single-sided clay checks
- Cost by redesign
- Observed limits and defects
- Diagnostics and failure diagnosis

## Per-layer isolation views and gap attribution

Always fix a visual gap at the **layer that causes it**. Pushing a color grade to compensate for bad lighting, or inflating ambient fill to hide a misplaced key light, breaks every angle outside one hero view.

Capture five standard isolation views at matched camera framing:

| Isolation view | What it reveals | Primary diagnostic question |
| --- | --- | --- |
| Albedo only | Base material hue, value, and scan micro-variation | Does the color or flatness gap live in the material? |
| Clay (uniform neutral matte, **single-sided**), sun only | Silhouette, counts, junctions, key direction, shadows | Is geometry, camera, or sun direction wrong? |
| Clay, sun + sky fill + GI | Lit-to-shade ratio, sky tint in shade, recess occlusion, bounce | Is the lighting ratio, HDRI fill, or probe grid wrong? |
| Pre-grade (after single tone map, before LUT/grade) | Combined lighting + materials + atmosphere prior to grading | Does the gap already exist before grading? |
| Per-term isolation (AO only, reflection only, fog only, bloom only) | Individual subsystem contribution | Which single pass causes a veil, halo, or stripe? |

**Gap-to-layer attribution matrix:**

| Observed gap | Owning layer | Verification check |
| --- | --- | --- |
| Wrong count, proportion, or silhouette position | Geometry or camera (`$threejs-procedural-geometry`, `$threejs-camera-direction`) | Blockout overlay at solved camera; clay view |
| Surface reads flat despite lots of detail | Geometry (detail `< 3 px` footprint, unbroken flat plane) or shadows (relief `< texel + bias`) | Pixel footprint vs relief depth; `8×8` local contrast in clay |
| Wrong color across both lit and shaded areas | Material albedo (`$threejs-procedural-materials`) | Albedo-only region mean against target |
| Wrong brightness in light only or shade only | Lighting ratio (`$threejs-lighting-and-gi`) | Lit-to-shade ratio on one material |
| Recesses and alcoves read too bright | Unoccluded indirect light (`$threejs-lighting-and-gi`, `$threejs-screen-space-ambient-occlusion`) | Probe-grid / AO isolation view |
| Grey veil, washed-out blacks | Atmosphere/post veil or excess fill (`$threejs-atmosphere-aerial-perspective`, `$threejs-bloom`) | Toggle fog, height fog, cloud haze, bloom, black lift; check `p1` |
| Wrong saturation globally vs in one material class | Tone map/grade vs material/bounce (`$threejs-exposure-color-grading`) | Pre-grade vs final saturation per class |
| Glow halo too wide or narrow | Sky Mie aureole vs bloom radius (`$threejs-atmosphere-aerial-perspective`, `$threejs-bloom`) | `measure.py --glow` profile at `10 / 25 / 50 / 90 / 140 px` |
| Grain, trails, shimmer, or popping in motion only | Temporal stability (`$threejs-temporal-stability`) | Stepped fixed-`dt` frames + pass toggles |

**Raycast pixel verification:** before editing a material or light in a mismatching region, cast a ray from the camera through the mismatching pixel coordinates to verify which mesh actually occupies that pixel (preventing wasted edits on a background wall occluded by foliage or transparent glass).

## Quantitative image metrics (measure.py)

Run `python3 scripts/measure.py ref.png render.png ...` (requires Python 3, Pillow, and NumPy; self-test via `--self-test`) to measure region and grid statistics objectively:

```sh
python3 scripts/measure.py ref.png render.png \
  --regions regions.json --grid 4x3 --glow 0.62,0.24 \
  --class gold:20,50,0.35,0.35 --sbs side-by-side.png --diff diff.png

# Open-water horizon barcode detector (normalised Y0,Y1 band 1-3% below horizon, X0,X1 over open water):
python3 scripts/measure.py render.png --stripes 0.48,0.51,0.10,0.65
```

| Metric | What it measures | Blind spot to watch |
| --- | --- | --- |
| `pct` (`p1, p5, p25, p50, p75, p95, p99`) | Luminance distribution; `p1` tracks black level / veil; `p95 - p5` tracks tonal range | Global spread can match while individual surfaces look flat |
| `local` (`8×8` window median luma std) | **Surface micro-contrast / flatness** — exposes flat or over-graded surfaces even when mean colors match | Sensitive to high-frequency render noise; compare at matched resolution |
| `mean` / `sat` | Region average sRGB and HSV saturation | Mixed regions (sky + building) distort means; crop clean single-material patches |
| `classes` | Fraction of pixels matching an HSV class range (e.g., gold, foliage, water) | Coverage can match while geometry/silhouette is wrong |
| `clipped` | Fraction of pixels with any channel `>= 250/255` | Inspect individual RGB means near `255` for single-channel saturation clipping |
| `--glow X,Y` | Mean luminance on concentric rings at `10 / 25 / 50 / 90 / 140 px` around a bright emitter | Requires matched emitter position and radius |
| `--stripes Y0,Y1[,X0,X1]` | Row-averaged high-pass X coherence over open water just below horizon (flags `coherence > max(0.3, 3/rows)` and `amplitude > 0.5`; clean water typically `0.03–0.16`, real barcodes `0.36–0.64`) | Exclude hulls, towers, and cliffs whose real vertical edges raise column coherence |

When a metric agrees while the eye still sees an obvious discrepancy, the metric is blind to that gap — switch to a sharper metric (such as `local` contrast, percentile spread, or structural overlay) rather than declaring victory.

## Visual flicker sweep and single-sided clay checks

- **Sub-pixel flicker sweep:** capture `8–24` views (hero, multi-height orbits, junction close-ups) with post-processing and temporal accumulation off. Render frame A, nudge camera position by `~0.3 px` of screen motion, render frame B, and inspect `|A - B|`. Isolated pixels flipping sharply between two surface colors along edges or rims confirm visible z-fighting; raycast the cluster and fix the geometry class at its generator (`$threejs-procedural-geometry`).
- **Single-sided clay sign-off:** inspect structural geometry with `THREE.FrontSide` uniform clay material from hero + `4+` orbit angles and both sides of thin walls/openings; `THREE.DoubleSide` hides inverted faces and missing wall backs.

## Cost by redesign

When profiling shows a feature exceeds the target frame budget, optimize by **architectural redesign** that preserves the real phenomenon — never by slashing resolution/detail across the board, deleting required physics, or substituting fake stand-ins:

- **Bake static transport:** bake static shadows (`autoUpdate = false`), static terrain self-shadowing, irradiance probe grids (`LightProbeGrid`), and slowly changing sky/far-cloud panoramas.
- **Structural real-time LOD:** reduce the same generator cleanly by projected pixel size (`$threejs-procedural-vegetation`, `$threejs-terrain-and-landscapes`).
- **Clean reduced-resolution / amortised passes:** only when paired with bilateral upsampling, direction-correct disocclusion fallbacks, and a full-quality path for stills (`$threejs-temporal-stability`).

## Observed limits and defects

- **Cross-resolution `local` distortion:** downsampling or upsampling images by large ratios changes `8×8` block statistics; `measure.py` resizes render to reference dimensions first, so capture at matching aspect and resolution whenever possible.
- **Tuning a wrong physical model:** if two consecutive parameter passes fail to narrow the measured delta, stop tweaking numbers and verify whether a missing physical mechanism (e.g., dispersive caustics, slope-integrated water reflection, or real geometric relief) is responsible.

## Diagnostics and failure diagnosis

Record a concise quantitative pass log for every major iteration:

```text
pass log entry     discrepancy description | attributed layer | root-cause fix | before -> after metrics
horizon check      measure.py --stripes coherence/amplitude across 3 camera heights (clean = barcode: false)
flicker sweep      view count checked, pixel clusters found, generator classes repaired
```

Failure diagnosis:

- **Means and class coverage match, yet render still looks much flatter:** metric is blind to surface texture; compare `local` (`8×8` std) and `(p95 - p5)` per region in clay and pre-grade views.
- **Fixing one region regresses another:** a global shared control (fill intensity, exposure, tone curve) was adjusted instead of the local owning cause; isolate the shared term and measure all regions after every edit.
- **Pass numbers oscillate without converging:** tuning parameters in the wrong layer (e.g., grading to fight bad lighting); inspect per-layer isolation views and restart at the lowest mismatched layer.
