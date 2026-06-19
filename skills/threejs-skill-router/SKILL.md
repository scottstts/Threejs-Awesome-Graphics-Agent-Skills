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
| GLSL, procedural patterns, particles, raymarching | `$threejs-shaders-procedural` |
| WebGPURenderer, TSL, node materials, compute | `$threejs-webgpu-tsl` |
| bloom, grading, AA, DOF, AO, pipeline order | `$threejs-postprocessing` |
| input, picking, controls, camera feel, game loop | `$threejs-gameplay-interaction` |
| collision, rigid bodies, Rapier, fixed stepping | `$threejs-physics-collisions` |
| profiling, draw calls, frame time, GPU, memory | `$threejs-performance-profiling` |
| React Three Fiber, Drei, Zustand, Suspense | `$threejs-r3f` |
| review, score, verify, prioritize defects | `$threejs-quality-audit` |

## Common combinations

- New polished scene: foundations → visual design → materials/lighting → quality audit.
- Asset-heavy product viewer: foundations → asset pipeline → materials/lighting → performance → quality audit.
- Custom visual effect: foundations → shaders or WebGPU/TSL → post-processing → performance.
- Browser game: foundations → gameplay → physics when justified → visual design → performance → quality audit.
- R3F experience: R3F first, then the same domain skills as vanilla Three.js.

## Routing rules

- Do not select WebGPU merely because it is newer. Require a TSL, compute, renderer, or measurable capability benefit.
- Do not select physics for simple triggers or arcade overlap checks.
- Do not use post-processing as a substitute for authored geometry, material response, lighting, or composition.
- For version-sensitive APIs, inspect `package.json`, lockfiles, imports, and official docs before proposing exact code.
- For “make it better” requests, load quality audit first to identify the limiting layer.

See [references/task-decomposition.md](references/task-decomposition.md) for detailed decomposition patterns.
