---
name: threejs-performance-profiling
description: "Measure, diagnose, and optimize Three.js and React Three Fiber CPU, GPU, memory, loading, and interaction performance. Use when frame rate drops, input stutters, mobile overheats, memory grows, context is lost, shader compilation stalls, draw calls or overdraw are high, assets load slowly, or visual changes need performance evidence."
---

# Three.js Performance and Profiling

Measure before optimizing. Preserve the visual and gameplay intent while removing invisible cost.

## Workflow

1. Record device, browser, viewport, DPR, scene state, and reproducible interaction.
2. Capture frame time, not only FPS. Separate CPU, GPU, loading, and memory symptoms.
3. Inspect renderer counts, browser performance traces, and a GPU frame capture where useful.
4. Change one bottleneck class at a time.
5. Compare before and after under the same conditions.
6. Test startup, steady state, stress state, and teardown.
7. Keep a quality ladder rather than one global low-quality switch.

Import
[`scripts/capture-renderer-snapshot.js`](scripts/capture-renderer-snapshot.js)
when repeatable `renderer.info`, renderer configuration, viewport, and
quality-state evidence should be saved before and after a change.

## Optimization order

1. Remove accidental work: duplicate loops, rerenders, allocations, recompiles, unnecessary passes.
2. Reduce submission cost: instancing, batching, merging, shared materials.
3. Reduce pixel cost: DPR, overdraw, transparency, shadows, post-processing resolution.
4. Reduce geometry and texture cost: LOD, compression, culling, streaming.
5. Reduce simulation cost: broadphase, update frequency, sleeping, workers.
6. Consider WebGPU/compute only after identifying a suitable bottleneck.

Read [references/profiling-workflow.md](references/profiling-workflow.md), [references/budgets.md](references/budgets.md), and [references/optimization-patterns.md](references/optimization-patterns.md).
