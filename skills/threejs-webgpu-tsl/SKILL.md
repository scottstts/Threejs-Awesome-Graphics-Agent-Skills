---
name: threejs-webgpu-tsl
description: "Build and review Three.js WebGPURenderer and TSL features including node materials, shader graphs, storage buffers, compute shaders, render pipelines, WGSL interop, renderer fallback, capability checks, and device loss. Use when a project imports from three/webgpu or three/tsl, migrates GLSL to TSL, needs GPU compute, or uses version-sensitive WebGPU and node APIs."
---

# Three.js WebGPU and TSL

Treat this module as version-sensitive. Verify installed Three.js exports and current official examples before writing exact APIs.

## Workflow

1. Inspect the installed `three` version, imports, renderer, browser targets, and fallback policy.
2. Prove why WebGPU/TSL is required: node materials, compute, renderer unification, or a measured bottleneck.
3. Build the smallest renderer initialization and fallback test.
4. Express material logic with standard node-material slots before overriding full vertex or fragment output.
5. Separate stable uniforms, per-frame values, per-object values, and storage data.
6. Validate compute buffer size, workgroup assumptions, bounds checks, synchronization, and CPU/GPU ownership.
7. Test fallback rendering, resize, context/device failure, and representative low-end hardware.
8. Record the exact Three.js version used by any code example.

## Guardrails

- Do not copy TSL names from old examples without checking current exports.
- Do not assume WebGPU support means equal feature behavior across browsers and GPUs.
- Do not read back GPU data each frame unless the design requires it.
- Do not move ordinary game logic to compute merely to use compute.
- Keep a WebGL path when audience requirements exceed current WebGPU coverage.
- Consider device and context loss in long-running applications.

Read [references/version-gates.md](references/version-gates.md), [references/tsl-material-patterns.md](references/tsl-material-patterns.md), and [references/compute-pipelines.md](references/compute-pipelines.md).
