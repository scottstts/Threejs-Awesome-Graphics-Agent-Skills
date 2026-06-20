---
name: threejs-image-pipeline
description: Build a deliberate final-image pipeline for advanced Three.js scenes. Use for depth/normal/velocity ownership, GTAO or bent normals, bilateral reconstruction, bloom, eye adaptation, tone mapping, 3D LUT grading, lens effects, dithering, and pass-level diagnostics.
---

# Image Pipeline

Use this skill only when composing several image-space systems or defining shared buffers. For one effect, load its atomic skill instead.

Load:

- `$threejs-screen-space-ambient-occlusion` for GTAO, bent normals, denoising, or AO application;
- `$threejs-bloom` for HDR extraction and bloom;
- `$threejs-exposure-color-grading` for metering, adaptation, tone mapping, LUTs, and output conversion.

The pipeline must expose its signals and ordering. Do not install a pile of effects and tune the final frame blindly.

## Signal order

```text
scene HDR color + depth + normals + velocity
  → lighting-related screen effects
  → atmosphere/transparency composition
  → bloom
  → exposure
  → tone mapping
  → grading
  → lens/presentation effects
  → dithering/output
```

Read [references/production-image-pipeline.md](references/production-image-pipeline.md).

## Rules

- Tone-map once.
- Keep HDR bloom before tone mapping.
- Meter exposure from a small luminance target, not the final 8-bit screen.
- Separate direct and indirect light before applying bent-normal ambient tint when possible.
- Upsample low-resolution effects with depth/normal-aware weights.
- Build pass toggles and effect-only views before tuning.
- UI rendered in the same target needs an explicit protection strategy.
- Do not load all atomic post skills by default. Route only the effects actually requested.
