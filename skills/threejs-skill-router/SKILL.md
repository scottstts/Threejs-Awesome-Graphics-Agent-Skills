---
name: threejs-skill-router
description: "Route broad Three.js, WebGL, WebGPU, React Three Fiber, 3D product, visualization, and browser-game tasks to the smallest useful set of skills in this pack. Use when a request crosses multiple concerns, starts a new Three.js project, asks for a polished or production-ready result, or does not clearly identify the required rendering, visual, gameplay, performance, or QA specialty."
---

# Three.js Skill Router

Select focused skills before implementation. Avoid loading the whole pack.

## Route the task

1. Inspect the project stack, installed package versions, runtime targets, existing architecture, and acceptance criteria.
2. Identify the primary user outcome: scene, application, visualization, configurator, effect, game, audit, or optimization.
3. Select one primary skill and only the supporting skills required by concrete scope.
4. State the execution order when more than two skills are needed.
5. Re-route if evidence reveals a different bottleneck.

| Need | Load |
| --- | --- |
| setup, renderer, loop, resize, color, cleanup | `$threejs-project-foundations` |
| models, textures, loading, compression, disposal | `$threejs-asset-pipeline` |
| composition, art direction, silhouette, world building | `$threejs-visual-design` |
| PBR, environments, lights, shadows, exposure | `$threejs-materials-lighting` |
| shader construction, coordinate spaces, uniforms, procedural fields | `$threejs-shaders-procedural` |
| custom meshes, sweeps, roads, terrain, CSG, BVH, LOD | `$threejs-geometry-modeling` |
| reference-driven surfaces, glass, coatings, wear, lookdev | `$threejs-material-lookdev` |
| authored water, atmosphere, volumetrics, trails, impact VFX | `$threejs-shaders-vfx` |
| camera taste, framing, focal hierarchy, cinematic light | `$threejs-cinematic-lighting-composition` |
| evaluate verbs, fairness, challenge, pacing, UI, accessibility | `$threejs-game-design-playability` |
| clip blending, springs, procedural motion, IK, contact | `$threejs-animation-motion` |
| WebGPURenderer, TSL, node materials, compute | `$threejs-webgpu-tsl` |
| bloom, grading, AA, DOF, AO, pipeline order | `$threejs-postprocessing` |
| implement input, picking, controls, camera rigs, gameplay state | `$threejs-gameplay-interaction` |
| collision, rigid bodies, Rapier, fixed stepping | `$threejs-physics-collisions` |
| profiling, draw calls, frame time, GPU, memory | `$threejs-performance-profiling` |
| React Three Fiber, Drei, Zustand, Suspense | `$threejs-r3f` |
| review, score, verify, prioritize defects | `$threejs-quality-audit` |

## Common combinations

- New polished scene: foundations → visual design → cinematic composition → material lookdev → quality audit.
- Asset-heavy product viewer: foundations → asset pipeline → material lookdev → cinematic composition → performance → quality audit.
- Procedural environment: foundations → geometry modeling → visual design → material lookdev → performance.
- Custom visual effect: foundations → shaders/VFX or WebGPU/TSL → post-processing → performance.
- Browser game: foundations → game design/playability → gameplay implementation → physics when justified → animation → visual design → performance → quality audit.
- R3F experience: R3F first, then the same domain skills as vanilla Three.js.

## Routing rules

- Use broad foundation skills for architecture and API contracts; use specialist skills when the task requires authored quality, diagnosis, or advanced techniques.
- Load `$threejs-materials-lighting` for scene-lighting fundamentals; add `$threejs-material-lookdev` when a specific surface must be believable.
- Load `$threejs-shaders-procedural` for shader construction fundamentals; add `$threejs-shaders-vfx` when timing, integration, temporal stability, or quality tiers define the effect.
- Load `$threejs-gameplay-interaction` to implement input and state; add `$threejs-game-design-playability` to determine whether the game is readable, fair, and satisfying.
- Load `$threejs-visual-design` for art direction across the whole scene; add `$threejs-cinematic-lighting-composition` for shot-level camera and image diagnosis.
- Do not select WebGPU merely because it is newer. Require a TSL, compute, renderer, or measurable capability benefit.
- Do not select physics for simple triggers or arcade overlap checks.
- Do not use post-processing as a substitute for authored geometry, material response, lighting, or composition.
- For version-sensitive APIs, inspect `package.json`, lockfiles, imports, and official docs before proposing exact code.
- For “make it better” requests, load quality audit first to identify the limiting layer.

See [references/task-decomposition.md](references/task-decomposition.md) for detailed decomposition patterns.
