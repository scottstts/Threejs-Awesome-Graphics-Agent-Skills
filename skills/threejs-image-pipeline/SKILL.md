---
name: threejs-image-pipeline
description: Build a deliberate final-image pipeline for advanced Three.js scenes. Use for depth, normal, albedo, and history ownership; RenderPipeline pass ordering and outputColorTransform contracts; MSAA versus TAA policy; 15-20% screen-space guard bands; veil auditing; GTAO or bent normals; bloom; eye adaptation; tone mapping; 3D LUT grading; effect-local render targets; and pass diagnostics.
---

# Image Pipeline

Use this skill only when composing several image-space systems or defining shared buffers. For one effect, load its atomic skill instead.

Load:

- `$threejs-lighting-and-gi` for direct/IBL lighting, irradiance probes, and reflections;
- `$threejs-screen-space-ambient-occlusion` for GTAO, `builtinAOContext`, bent normals, and denoising;
- `$threejs-bloom` for HDR extraction and veiling glare;
- `$threejs-exposure-color-grading` for exposure, tone mapping, gamut-limited grading, LUTs, and lens traits;
- `$threejs-temporal-stability` for AA, guard bands, amortised passes, and motion stability.

The pipeline must expose its signals, color spaces, and ordering. Do not install a pile of effects and tune the final frame blindly.

## Signal order

```text
scene pass (MSAA + reversed depth + MRT normals/albedo where needed)
  → indirect-only AO (builtinAOContext, sky/water/emissive masked & far-faded)
  → atmosphere / transparency / participating media
  → HDR bloom (veiling glare)
  → exposure + scene-referred contrast
  → single tone map (renderOutput / RenderPipeline transform)
  → display-referred grade (gamut-limited saturation / 3D LUT)
  → subtle lens & sensor traits
  → output conversion
```

Read [references/production-image-pipeline.md](references/production-image-pipeline.md)
for canonical WebGPU `RenderPipeline` and composer pass graphs, `outputColorTransform`
ownership, guard-band and AA contracts, veil auditing, and ownership boundaries.

## Rules

- Tone-map once; keep `RenderPipeline.outputColorTransform` and `renderOutput(...)` unambiguous.
- Keep HDR bloom and scene-referred contrast before tone mapping, and `[0, 1]` display grading after it.
- Prefer MSAA on the scene pass + specular AA in materials; keep TAA light or off so moving edges stay sharp.
- Render a `15–20%` overscan guard band (cropped on output) whenever screen-space refraction, SSR, or wide blurs can step off-frame.
- Meter exposure from a small luminance target or reference surface anchor, not an unmeasured 8-bit frame.
- Apply AO to indirect light only (`builtinAOContext` or reconstructed indirect), never multiplying final scene color.
- Audit the veil whenever blacks lift: toggle fog, height fog, cloud haze, glare bloom, and grade black lift individually.
- Expose per-layer debug taps (albedo, clay lighting, pre-tonemap, pre-grade, final) before tuning.
- UI rendered in the same target needs an explicit protection strategy.
- Do not load all atomic post skills by default. Route only the effects actually requested.

## Routing boundary

Use this skill when multiple image-space systems must share buffers, ordering,
guard bands, or output ownership. For one isolated effect, use its atomic skill
without loading this coordinator.
