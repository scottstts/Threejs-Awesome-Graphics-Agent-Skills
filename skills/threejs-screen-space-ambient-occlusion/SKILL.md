---
name: threejs-screen-space-ambient-occlusion
description: Implement a production GTAO path in Three.js. Use for native WebGPU/TSL GTAONode wired through builtinAOContext, half-resolution horizon sampling, reversed-depth reconstruction, bent-normal encoding, full-resolution bilateral reconstruction, masking sky and water to prevent horizon barcodes, contact grounding, and halo diagnosis.
---

# Screen-Space Ambient Occlusion

AO estimates local ambient contact visibility. It must modulate **indirect lighting only** — never direct sun, practical lights, sky, water, or emissive surfaces.

## Workflow

1. Enable reversed depth (`reversedDepthBuffer: true` on `WebGPURenderer`) and verify linear depth and view-space normals.
2. Exclude sky, water, and emissive surfaces from AO from day one, and fade AO smoothly to `1.0` before far depth quantizes.
3. Choose the integration tier:
   - **Native WebGPU/TSL (preferred):** opaque depth + `normalView` pre-pass → `GTAONode` (`ao()`) → `scenePass.contextNode = builtinAOContext(...)` modulating indirect/ambient light directly.
   - **Custom half-res + bent normals:** custom horizon gather, bent-normal encoding, 8-neighbour bilateral upsample, and indirect-only composite.
4. Size `radius` and `thickness` in world metres to actual contact features (`0.4–2.5 m`) — never crank radius to fake room-scale GI.
5. Verify in AO-only, horizon-grazing, and moving-camera views for zero halos, zero grain, and zero horizon barcodes.

Read [references/tsl-gtao-and-horizon-safety.md](references/tsl-gtao-and-horizon-safety.md) for the native WebGPU/TSL `GTAONode` + `builtinAOContext` setup, horizon-barcode prevention, world-scale sizing, and AO-vs-GI boundaries.

Read [references/gtao-bent-normal-pipeline.md](references/gtao-bent-normal-pipeline.md) for the custom half-resolution horizon-sampling math, bent-normal heuristic validation, bilateral upsample kernel, and indirect-reconstruction composite.

## Failure conditions

- direct light, sky, water, or emissive surfaces are darkened by AO;
- vertical dark "barcode" stripes appear near the horizon from unmasked or unfaded far depth;
- radius is specified only in pixels, or inflated to multi-metre values to fake missing GI;
- foreground silhouettes cast thick screen-space halos across depth discontinuities;
- half-resolution gather is grainy during camera motion because it lacks bilateral spatial denoising;
- bent normals are treated as ordinary geometric normals without verifying hemisphere sign;
- the implementation claims temporal accumulation even though the path has none.

## Routing boundary

This skill owns small-scale contact GTAO, bent normals, bilateral denoising, horizon-safe distance fading, and indirect-only AO application. Use `$threejs-lighting-and-gi` for room/alcove-scale occluded indirect light (`LightProbeGrid`) and reflections; `$threejs-spectral-ocean` for water-side horizon barcode checks; `$threejs-temporal-stability` for motion-grain audits; and `$threejs-image-pipeline` only when depth/normal buffers or pass order must be coordinated across multiple image-space systems.
