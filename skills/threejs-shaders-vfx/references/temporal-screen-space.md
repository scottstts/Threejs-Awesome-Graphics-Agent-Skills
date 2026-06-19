# Temporal stability and screen-space effects

## Why effects shimmer or ghost

The image is discretely sampled in space and time. Problems arise when:

- procedural frequency exceeds pixel resolution;
- sample positions change without stable reconstruction;
- previous-frame history is reused across disocclusion;
- motion vectors or camera matrices are wrong;
- screen-space rays leave the viewport;
- transparent objects lack useful depth/velocity.

## Spatial antialiasing

Use `dFdx`, `dFdy`, and `fwidth` for analytic transition widths:

```glsl
float width = fwidth(value);
float mask = smoothstep(edge - width, edge + width, value);
```

This is essential for procedural lines, grids, SDF edges, and high-frequency thresholds.

## Temporal accumulation

A temporal pipeline generally needs:

1. jittered sampling;
2. previous color/history;
3. motion/reprojection;
4. neighborhood or variance clamping;
5. disocclusion rejection;
6. responsive weighting for animated detail.

History is evidence, not truth. Reject it when depth, normal, material, or motion disagree.

Blue-noise or spatiotemporal masks distribute error more pleasantly, but they do not replace reconstruction.

## Screen-space AO/reflections/GI

Screen-space effects cannot see:

- offscreen geometry;
- hidden backfaces;
- missing or transparent depth;
- fine geometry below buffer resolution.

Provide environment/baked fallbacks and edge fading. Tune radius in world or view-space units when possible.

## Package judgment

- `postprocessing`: established composable WebGL effect pipeline.
- N8AO: actively maintained AO with half-resolution, accumulation, transparency, debug modes, and WebGPU notes.
- `realism-effects`: useful SSGI/HBAO/TRAA concepts, but reviewed repository is older and targets an older Three.js peer range; treat as a conceptual/candidate source.

## Quality ladder

- Cheap: FXAA/SMAA, static AO, no temporal history.
- Standard: half-resolution AO/reflection, stable jitter, selective accumulation.
- High-end: velocity/depth/normal history, TAA/TRAA, SSGI/SSR with robust rejection.

## Source basis

- [Scalar Spatiotemporal Blue Noise Masks](https://arxiv.org/abs/2112.09629)
- [Playdead temporal reprojection](https://github.com/playdeadgames/temporal)
- [Temporal AA and the Quest for the Holy Trail](https://www.elopezr.com/temporal-aa-and-the-quest-for-the-holy-trail/)
