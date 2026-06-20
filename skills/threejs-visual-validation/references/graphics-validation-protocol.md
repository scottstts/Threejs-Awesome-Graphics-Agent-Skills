# Graphics validation protocol

## 1. Visual contract

Before tuning, record:

```json
{
  "subject": "what must read",
  "designView": "camera pose and focal length",
  "distanceEnvelope": ["near", "design", "far"],
  "lighting": "fixed environment and key light",
  "motion": "camera/object/effect movement",
  "targetFrameMs": 16.7,
  "targetResolution": [1920, 1080],
  "qualityTier": "high",
  "seed": 18437
}
```

Also record what visual properties are invariant:

- tree species silhouette;
- building bay ownership;
- planet macro continents;
- water horizon stability;
- cloud coverage distribution;
- atmosphere continuity;
- effect timing hierarchy.

## 2. Capture matrix

For each system, capture:

| Axis | Required samples |
| --- | --- |
| camera | near, design, far, grazing/edge case |
| lighting | neutral key, grazing key, production lighting |
| image pipeline | no post, individual pass, final |
| procedural | default seed, sparse seed, dense/stress seed |
| motion | still, slow pan, fast motion/cut |
| quality | low fallback, target tier |

The matrix may be pruned when an axis is irrelevant, but state why.

## 3. Diagnostic mosaic

Provide stable debug IDs or route outputs into labeled tiles:

```text
final | no post | normals | depth
macro | meso    | masks   | roughness
AO    | bloom   | history | overdraw
```

Do not capture diagnostics with different cameras or times. Comparability matters more than presentation.

## 4. No-post baseline

Disable:

- bloom;
- grading;
- vignette;
- chromatic treatment;
- film grain;
- sharpening;
- temporal accumulation where possible.

The baseline should retain:

- silhouette;
- material separation;
- depth order;
- dominant lighting;
- effect timing.

Post-processing may enhance hierarchy; it must not manufacture all of it.

## 5. Seed sweep

Automate deterministic seeds:

```js
for (const seed of representativeSeeds) {
  generator.setSeed(seed)
  generator.rebuild()
  assertTopology()
  capture(seed)
  collectMetrics(seed)
}
```

Track:

- triangle/module/branch/particle counts;
- bounds;
- degenerate triangles or NaNs;
- material slots;
- draw calls;
- build time;
- visual occupancy or coverage statistics.

Select seeds intentionally:

- nominal;
- low-density;
- high-density;
- known adversarial layout;
- previous regression.

## 6. Scale envelope

At each camera distance inspect:

- silhouette continuity;
- field-band transitions;
- normal aliasing;
- shadow texel size and cascade/clipmap seams;
- atmosphere precision;
- depth reconstruction;
- particle size floor;
- cloud temporal history.

Freeze camera distance while toggling each frequency/LOD weight. This exposes whether a transition is gradual and whether bands overlap correctly.

## 7. Temporal stability

Record a short fixed path, not only a live subjective inspection:

```text
static camera, animated effect
slow translation
slow rotation
fast pan
camera cut
resize / DPR change
quality-tier switch
```

Inspect:

- shimmer;
- crawling microdetail;
- history trails;
- disocclusion holes;
- shadow swimming;
- cloud boiling;
- water normal flicker;
- reset flashes.

Use difference frames or temporal variance views where useful.

## 8. Pass isolation

Every significant pass should support:

```text
enabled/disabled
effect only
input signal
output signal
history/confidence
cost
```

For depth-dependent effects, include raw and linearized depth. For temporal effects, show history weight and rejection reason.

## 9. Performance evidence

Record at target resolution:

```text
CPU frame time
GPU frame time when timestamp queries are available
draw calls
triangles/points/lines
active shader programs
texture/render-target memory estimate
pass resolutions and formats
simulation/update cadence
```

Warm shaders and caches before measuring. Separate one-time generation/compilation from steady-state rendering.

For adaptive systems, record the decision state:

```text
current DPR
cloud tier
shadow levels refreshed
effect pool occupancy
temporal resolution
```

## 10. Regression strategy

Use exact pixel comparison only for deterministic, non-temporal outputs. Otherwise:

- freeze time and jitter;
- fix random sequences;
- disable temporal noise;
- compare masks or derived metrics;
- use perceptual thresholds;
- preserve a human-reviewed contact sheet.

Tie each regression to an invariant:

```text
"No clipmap seam at the design camera"
"Crater rim remains brighter than floor under grazing light"
"Water foreground rejection prevents refracting the boat"
"Cloud history rejects after a camera cut"
```

A snapshot without a named invariant becomes stale decoration.

## 11. Sign-off record

Keep:

```text
Three.js version/backend
browser/GPU/device class
capture resolution and DPR
seed and time
camera matrices
quality settings
known compromises
accepted budget
```

This turns “looks good here” into reproducible engineering evidence.
