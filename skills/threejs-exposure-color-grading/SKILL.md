---
name: threejs-exposure-color-grading
description: Build scene-referred exposure, tone mapping, and color grading for Three.js. Use for luminance metering, eye adaptation, percentile control, HDR range placement, tone-map selection, white balance, contrast curves, 3D LUTs, gamut handling, output transforms, and avoiding double color conversion.
---

# Exposure and Color Grading

Treat exposure, tone mapping, grading, and output conversion as distinct stages. Tune them from measured HDR signal, not by stacking compensating color operations.

## Order

```text
HDR scene
  → luminance meter
  → adapted exposure
  → tone map
  → creative grade / 3D LUT
  → output gamut and transfer function
  → dither
```

Read [references/scene-referred-color-pipeline.md](references/scene-referred-color-pipeline.md).

## Failure conditions

- tone mapping occurs in both materials and post;
- exposure is used to repair physically inconsistent light ratios;
- average luminance is dominated by the sun or black borders;
- adaptation speed is the same toward light and dark;
- LUT input/output spaces are undocumented;
- sRGB encoding happens twice;
- grading clips HDR before tone mapping.
