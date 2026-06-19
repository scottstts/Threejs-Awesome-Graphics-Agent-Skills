# Three.js Agent Skills Mega Pack

A modular, production-oriented skill pack for agents building Three.js scenes, interactive experiences, and browser games.

The pack is intentionally split by task. An agent should load the router first, then only the domain skills needed for the current work. This keeps context focused while covering three equally important outcomes:

- technically correct architecture, renderer setup, lifecycle, and API usage;
- strong visual authorship across modeling, materials, lighting, shaders, and effects;
- responsive interaction, game feel, physics, controls, and playability.

## Skills

| Skill | Responsibility |
| --- | --- |
| `threejs-skill-router` | Select the smallest useful skill set and define execution order. |
| `threejs-project-foundations` | Project structure, renderer choice, render loop, color, resize, lifecycle. |
| `threejs-asset-pipeline` | glTF, textures, compression, loading UX, ownership, disposal. |
| `threejs-visual-design` | Art direction, composition, silhouette, depth, procedural modeling taste. |
| `threejs-materials-lighting` | PBR material roles, environments, lights, shadows, exposure. |
| `threejs-shaders-procedural` | GLSL, procedural patterns, particles, raymarching, shader debugging. |
| `threejs-webgpu-tsl` | WebGPURenderer, TSL, node materials, compute, version-sensitive APIs. |
| `threejs-postprocessing` | Bloom, grading, anti-aliasing, depth effects, pipeline ordering. |
| `threejs-gameplay-interaction` | Input, picking, camera feel, gameplay loop, feedback, accessibility. |
| `threejs-physics-collisions` | Collision strategy, engine choice, fixed stepping, colliders, sensors. |
| `threejs-performance-profiling` | Measurement, budgets, bottleneck isolation, CPU/GPU/memory optimization. |
| `threejs-r3f` | React Three Fiber architecture, frame updates, state, loading, ecosystem use. |
| `threejs-quality-audit` | Technical, visual, performance, accessibility, and playability review. |

## Use

Invoke the router for broad tasks:

```text
Use $threejs-skill-router to plan and build a polished interactive product configurator.
```

Invoke a focused skill directly for narrow work:

```text
Use $threejs-postprocessing to tune bloom without washing out the scene.
```

## Development

Validate the complete pack:

```sh
npm run validate
```

External research inputs are recorded in [`source_materials/README.md`](source_materials/README.md). Downloaded repositories remain ignored under `source_materials/`.

## Current baseline

The first release establishes the production taxonomy, core workflows, detailed reference modules, source provenance, and structural validation. Future work should deepen individual references, add tested starter assets only where they remove repeated work, and forward-test skills against real Three.js projects.
