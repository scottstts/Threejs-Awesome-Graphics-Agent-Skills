---
name: threejs-bloom
description: Design and implement bloom in advanced Three.js scenes. Use for HDR emission hierarchy, threshold and soft-knee control, multi-scale downsample and upsample chains, selective bloom, transparent emitters, exposure coupling, halo diagnosis, and bloom that supports rather than replaces authored lighting.
---

# Bloom

Bloom is a camera/display response to bright HDR signal. Establish scene exposure and emissive luminance before tuning blur.

## Workflow

1. Inspect pre-tone-map luminance.
2. Choose which scene values should bloom.
3. Extract with threshold and soft knee.
4. Downsample into multiple scales with an energy-aware filter.
5. Upsample and combine with controlled radius weights.
6. Composite in HDR before exposure/tone mapping.
7. Validate with bloom-only, no-bloom, and threshold views.

Read [references/hdr-bloom-system.md](references/hdr-bloom-system.md).

## Failure conditions

- bloom creates the only visible form of an effect;
- all bright materials share one arbitrary emission multiplier;
- threshold is tuned after tone mapping;
- selective bloom requires mutating scene materials every frame without restoration guarantees;
- transparent particles disappear from extraction because pass ownership is unclear;
- bloom radius changes wildly with resolution;
- highlights become gray because energy is clamped too early.
