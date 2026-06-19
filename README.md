# Three.js Agent Skills Mega Pack

A modular, production-oriented skill pack for agents building Three.js scenes, interactive experiences, and browser games.

The pack is intentionally split by task. An agent should load the router first, then only the domain skills needed for the current work. The objective is not to reproduce API documentation. It is to help an agent make and implement defensible technical, visual, and game-design decisions:

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
| `threejs-geometry-modeling` | Production mesh authoring, sweeps, terrain, CSG, BVH, LOD, batching. |
| `threejs-material-lookdev` | Reference-driven PBR, advanced surfaces, layering, and material diagnosis. |
| `threejs-shaders-vfx` | Advanced shader fields, water, atmosphere, temporal effects, and impact VFX. |
| `threejs-cinematic-lighting-composition` | Taste-to-implementation camera, framing, light, exposure, and depth decisions. |
| `threejs-game-design-playability` | Verbs, core loops, feel, fairness, pacing, UI, and accessibility. |
| `threejs-animation-motion` | Clip blending, springs, procedural motion, IK, contact, and readability. |
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

Use a deep specialist when the problem is about authored quality rather than setup:

```text
Use $threejs-cinematic-lighting-composition to diagnose why this scene feels flat,
then translate the critique into camera, lighting, atmosphere, and exposure changes.
```

## Development

Validate the complete pack:

```sh
npm run validate
```

External research inputs are recorded in [`source_materials/README.md`](source_materials/README.md). Downloaded repositories remain ignored under `source_materials/`.

## Development direction

The pack has two layers:

- foundation skills for correct architecture and common Three.js workflows;
- specialist skills for authored geometry, look development, VFX, cinematography, game design, and motion.

Specialist references include quality ladders, diagnosis tables, implementation choices, failure modes, and runnable calibration labs. Future development should continue forward-testing those judgments against real scenes and games, then strengthen asset/performance tooling where repeated project work justifies automation.
