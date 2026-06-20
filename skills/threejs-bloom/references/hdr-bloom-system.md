# HDR bloom system

## 1. Signal contract

Bloom input must be linear HDR scene color before tone mapping:

```text
opaque/transparency/atmosphere HDR
  → bloom extraction and pyramid
  → bloom composite
  → exposure
  → tone mapping
```

If the renderer or pipeline applies exposure during material shading, verify what numeric range reaches extraction. Avoid applying exposure twice.

## 2. Luminance extraction

Use luminance:

```glsl
float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
```

Soft knee:

```glsl
float soft = clamp(luma - threshold + knee, 0.0, 2.0 * knee);
soft = soft * soft / max(4.0 * knee, 1e-4);
float contribution = max(luma - threshold, soft) / max(luma, 1e-4);
vec3 bright = color * contribution;
```

Expose threshold in the same HDR units used by scene lighting.

## 3. Multi-scale pyramid

Build levels at decreasing resolution. Each downsample should combine filtering and reduction. Then upsample from coarse to fine:

```text
L0 half resolution
L1 quarter
L2 eighth
L3 sixteenth
L4 thirty-second
```

Combine:

```text
bloom = Σ level_i * weight_i
```

Fine levels create glow around details; coarse levels create broad atmosphere. Tune weights by visual role, not one global radius.

Use resolution-relative kernels so output remains stable across viewport sizes.

## 4. Energy and color

Avoid repeated unnormalized blur that grows energy unpredictably. Track kernel normalization and final intensity explicitly.

Preserve HDR color ratios where possible. If saturated emitters turn white too early, inspect:

- extraction;
- texture format;
- clamping;
- upsample addition;
- tone mapping;
- gamut conversion.

## 5. Selective bloom strategies

Prefer, in order:

1. emissive values naturally above threshold;
2. explicit bloom mask or contribution target;
3. layer-based secondary render;
4. temporary material substitution only with robust traversal and restoration.

An explicit target can contain:

```text
RGB bloom contribution
A contribution confidence/mask
```

For material substitution:

- cache original material by object;
- account for arrays of materials;
- exclude background and protected UI;
- restore in `finally`;
- handle newly added objects;
- avoid compiling a unique black material per object.

## 6. Transparent emitters

Ensure the bloom input includes the intended transparent composition. Options:

- render emitters into the main HDR target before extraction;
- output additive emission to a separate buffer;
- include them in a dedicated contribution pass.

Depth sorting and premultiplied alpha affect extracted color. Inspect the raw contribution buffer.

## 7. Exposure coupling

Bloom threshold and exposure are related:

- physical approach: threshold in scene-referred units; exposure changes display brightness but not which scene radiance blooms;
- stylized approach: threshold may track exposure partially to maintain a look.

Choose and document one. Hidden reciprocal tuning causes unstable day/night transitions.

## 8. Temporal behavior

Bloom itself usually does not need history. If the source is temporally noisy:

- stabilize the source;
- filter subpixel emissive features;
- accumulate the source pass with valid motion/history;
- avoid simply blurring more.

## 9. Debug views

Expose:

```text
pre-bloom HDR with false-color luminance
threshold contribution
each pyramid level
combined bloom only
final without bloom
final with bloom
protected UI mask
```

Bloom is accepted only if the no-bloom frame still has intentional hierarchy.
