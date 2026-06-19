# Pipeline design

## Choose one pipeline family

- Three.js EffectComposer for established WebGL add-ons.
- `postprocessing` for optimized WebGL effect composition.
- React postprocessing for R3F integration.
- Three.js `RenderPipeline` for version-verified TSL/WebGPU post-processing.

Do not mix families without understanding render targets, color spaces, depth ownership, and lifecycle.

In Three.js r184, `PostProcessing` is a backward-compatibility wrapper that was
deprecated in r183 after being renamed to `RenderPipeline`. Use the installed
version's official documentation and prefer `RenderPipeline` for new code.

## Ordering model

Typical conceptual order:

1. scene color plus depth/normal/velocity data;
2. ambient occlusion, reflections, lighting-related effects;
3. bloom and glow;
4. compositing and color grading;
5. tone mapping/output conversion;
6. presentation effects and anti-aliasing.

The exact implementation depends on whether individual effects expect HDR linear input or display-referred input.

## Resolution

Use independent resolution scales for expensive broad effects. Blur, AO, bloom, and some reflection effects often tolerate lower resolution with depth-aware upsampling or careful filtering.

## Diagnostics

Provide toggles for:

- each pass;
- source color;
- depth, normal, and velocity buffers;
- effect-only output;
- pre/post tone mapping;
- reduced resolution.

Profile pass cost one at a time.

## UI

Prefer DOM UI after the canvas when possible. If UI is rendered into the 3D pipeline, explicitly protect it from bloom, DOF, motion blur, and grading where required.
