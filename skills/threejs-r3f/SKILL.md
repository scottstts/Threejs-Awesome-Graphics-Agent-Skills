---
name: threejs-r3f
description: "Build, review, and optimize React Three Fiber applications using @react-three/fiber, Drei, Zustand, Suspense, react-postprocessing, and react-three/rapier. Use when implementing Three.js through React, structuring Canvas and scene components, handling frame updates and transient state, loading assets, managing disposal, or diagnosing rerenders and R3F lifecycle issues."
---

# React Three Fiber

Use React for declarative scene structure and application state; use the frame loop for high-frequency simulation and visual mutation.

## Workflow

1. Inspect React, Fiber, Drei, Three.js, and ecosystem package versions together.
2. Define Canvas ownership, camera, DPR, frameloop, event source, shadows, and fallback.
3. Split scene structure by responsibility, not by every mesh.
4. Keep fast-changing transforms in refs or dedicated transient stores.
5. Use selectors for reactive state and direct reads for per-frame transient values.
6. Load through Suspense-aware helpers with preloading, error boundaries, and visible fallback.
7. Understand auto-disposal before sharing resources or using primitives.
8. Profile React commits separately from Three.js frame cost.

## Rules

- Do not call React state setters every frame for animation.
- Use `delta` for integration and frame-rate-independent damping.
- Avoid creating vectors, colors, geometries, materials, and option objects in hot render or frame paths.
- Prefer visibility changes over frequent mount/unmount for expensive scene objects.
- Do not add a library abstraction when the native Three.js object is clearer and cheaper.
- Keep DOM HUD state updates at human-readable frequencies rather than frame rate.

Read [references/component-architecture.md](references/component-architecture.md), [references/frame-state-loading.md](references/frame-state-loading.md), and [references/ecosystem-decisions.md](references/ecosystem-decisions.md).
