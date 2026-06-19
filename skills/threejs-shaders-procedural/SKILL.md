---
name: threejs-shaders-procedural
description: "Design, implement, debug, and optimize Three.js GLSL shaders and procedural effects including custom materials, noise, signed-distance fields, particles, dissolve, water, fire, atmosphere, raymarching, vertex deformation, and screen-space effects. Use when work requires ShaderMaterial, RawShaderMaterial, shader injection, GPU-authored motion, procedural texture logic, or custom visual effects outside standard materials."
---

# Three.js Shaders and Procedural FX

Design the effect from inputs, coordinate spaces, frequency bands, and failure modes before writing shader code.

## Workflow

1. Decide whether a standard material, material hook, TSL node material, or custom GLSL material is the least fragile solution.
2. Define vertex and fragment responsibilities.
3. List coordinate spaces for every input: object, world, view, clip, screen, tangent, or UV.
4. Prototype one visual idea with debug colors and static parameters.
5. Add time only after the static field is correct.
6. Separate large, medium, and fine frequency detail.
7. Guard numerical hazards: zero-length normalization, divisions, invalid powers, precision loss, and unbounded loops.
8. Profile overdraw, texture reads, branches, loop counts, and mobile precision.
9. Provide a reduced-quality path when the effect is central to the experience.

## Rules

- Use elapsed time for periodic functions and delta for integration.
- Avoid allocating or rebuilding materials and uniforms per frame.
- Keep shader defines stable; changing them recompiles programs.
- Prefer derivatives, smooth thresholds, and anti-aliased edges for procedural shapes.
- Make transparency and blending an explicit performance decision.
- Do not raymarch where a mesh or impostor provides the same visible result.

Read [references/shader-workflow.md](references/shader-workflow.md) and [references/procedural-effects.md](references/procedural-effects.md).
