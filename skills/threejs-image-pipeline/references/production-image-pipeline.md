# Production image pipeline

## Buffer contract

Document each pass:

| Signal | Space/range | Producer | Consumers |
| --- | --- | --- | --- |
| scene color | linear HDR | scene pass | AO composite, atmosphere, bloom |
| depth | hardware or packed | scene pass | AO, atmosphere, outlines |
| normal | view or world | geometry pass | AO, reflections |
| velocity | screen delta | scene pass | temporal resolve |

Do not infer spaces while writing effects.

## GTAO/bent-normal pattern

At reduced resolution:

1. reconstruct view position;
2. rotate slice azimuth with stable per-pixel noise;
3. search horizons in several directions;
4. accumulate scalar occlusion and an average unoccluded direction;
5. store AO plus encoded bent normal.

At full resolution:

1. gather neighboring low-resolution samples;
2. weight by full-resolution depth and normal similarity;
3. reconstruct indirect environment lighting along the bent normal;
4. darken/tint indirect light, not specular and direct sun indiscriminately.

## Bloom

Bloom input must be linear HDR. Tune in this order:

```text
threshold → smooth width → radius → strength
```

If ordinary white surfaces bloom, fix exposure/material luminance or selection. Use separate masks only when luminance cannot express the art direction.

## Eye adaptation

Render a small luminance target, for example 64×36. Encode high dynamic range if the readback format is limited:

```text
encoded = Y / (Y + 1)
Y = encoded / (1 - encoded)
```

Use log-average luminance and asymmetric adaptation:

```js
const speed = target > current ? brightenSpeed : darkenSpeed
const alpha = 1 - Math.exp(-dt * speed)
current += (target - current) * alpha
```

Read back infrequently. Smooth between readings.

## 3D LUT grading

Generate a small 3D LUT when the grade is procedural or preset-driven. Apply:

1. range normalization;
2. contrast/curve;
3. shadow, midtone, and highlight tint by luminance weights;
4. per-channel gamma;
5. saturation/vibrance;
6. clamp.

Use a neutral LUT bypass for comparison.

## Lens treatment

Lens flare needs a visible source and occlusion signal. Build:

- source halo;
- directional streak;
- ghosts along source-to-center axis;
- edge fade;
- spectral tint used sparingly.

Do not add flare as constant decoration.

## Diagnostics

Required views:

```text
HDR scene
depth
normals
velocity
AO
bent normal
atmosphere only
bloom only
pre/post exposure
pre/post tone map
LUT identity difference
```

Record GPU cost per pass and resolution scale.
