---
name: threejs-project-foundations
description: "Establish and review production-ready Three.js project foundations: renderer selection, scene and camera setup, color management, animation loop, resize and DPR policy, module boundaries, resource ownership, context lifecycle, and teardown. Use when starting a Three.js project, correcting blank or unstable scenes, modernizing setup, structuring lifecycle code, or diagnosing foundational rendering mistakes."
---

# Three.js Project Foundations

Build the smallest architecture that makes ownership, updates, and teardown explicit.

## Workflow

1. Inspect the installed Three.js version, bundler, entry point, renderer imports, browser targets, and framework.
2. Choose WebGLRenderer by default. Choose WebGPURenderer only for a concrete TSL, compute, or renderer capability requirement.
3. Establish one owner for the canvas, renderer, scene, active camera, animation loop, resize observer, and global listeners.
4. Define update order before adding features.
5. Configure color, tone mapping, shadows, and DPR intentionally.
6. Add teardown at the same time as creation.
7. Verify a visible reference object, resize, background-tab behavior, and repeated mount/unmount.

## Required invariants

- Use one render loop. Prefer the renderer’s animation-loop API where XR or renderer coordination matters.
- Express movement in units per second with delta time. Clamp large deltas; use fixed steps for simulation.
- Size from the canvas container, not assumed window dimensions.
- Cap DPR from a measured quality policy rather than blindly using device DPR.
- Keep color textures in sRGB, data textures untagged, and lighting calculations in the linear working space.
- Avoid `preserveDrawingBuffer` unless a capture requirement justifies its cost.
- Track geometry, material, texture, render-target, control, worker, observer, and listener ownership.
- Never treat `scene.clear()` as GPU resource disposal.

## Boundaries

Prefer these responsibilities when the project grows:

- `app`: startup, shutdown, route/framework integration.
- `rendering`: renderer, scene, camera, resize, quality policy.
- `assets`: loading, cache, cloning, ownership, disposal.
- `systems`: input, animation, simulation, camera, VFX.
- `ui`: DOM state and accessibility.
- `diagnostics`: renderer info, frame timing, debug toggles.

Read [references/renderer-color-loop.md](references/renderer-color-loop.md) for renderer and timing decisions. Read [references/lifecycle-architecture.md](references/lifecycle-architecture.md) for ownership and teardown.
