---
name: threejs-postprocessing
description: "Design, implement, tune, and optimize Three.js post-processing pipelines across EffectComposer, pmndrs postprocessing, React postprocessing, and TSL/WebGPU pipelines. Use for bloom, tone mapping, color grading, anti-aliasing, depth of field, motion blur, ambient occlusion, outlines, selective effects, resolution scaling, or diagnosing washed-out and overprocessed scenes."
---

# Three.js Post-processing

Start from a correct scene. Add effects one at a time with a visible purpose and a removable cost.

## Workflow

1. Identify renderer family, installed versions, antialiasing path, output color space, and tone-mapping location.
2. Capture a no-effects baseline.
3. Define the visual job of each pass.
4. Order passes by signal dependency: scene data, lighting/depth effects, bloom, grading/tone mapping, presentation effects, anti-aliasing.
5. Tune at final viewport sizes and DPRs.
6. Profile each pass independently and test reduced resolutions.
7. Verify transparent content, UI composition, resize, screenshots, and mobile.

## Rules

- Keep output conversion and tone mapping exactly once.
- Bloom should isolate exceptional luminance, not soften the whole frame.
- Depth of field and motion blur must preserve gameplay and UI readability.
- Screen-space effects need explicit behavior for missing depth, normals, offscreen data, and disocclusion.
- Prefer half-resolution or selective effects before globally lowering scene quality.
- Avoid stacking multiple effects that solve the same contrast problem.

Read [references/pipeline-design.md](references/pipeline-design.md), [references/bloom.md](references/bloom.md), and [references/depth-effects.md](references/depth-effects.md).
