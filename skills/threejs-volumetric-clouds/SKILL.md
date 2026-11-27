---
name: threejs-volumetric-clouds
description: Implement volumetric cloud systems in Three.js. Use for weather-driven density, bounded raymarching, shape/detail erosion, vertical profiles, lighting cones, silver lining, temporal reconstruction, cloud shadows, multiple layers, and scalable quality modes.
---

# Volumetric Clouds

Cloud quality comes from density organization, lighting, and temporal stability—not from increasing march steps over unstructured noise.

This skill contains exemplary examples and assets beyond descriptive guidance,
they're worth studying, referencing, or even copying. Use them sufficiently
when relevant and do NOT blindly skip them.

## System order

1. Define the cloud volume and layer bounds.
2. Generate or source weather, base-shape, detail, and turbulence fields.
3. Build a density function with vertical and weather profiles.
4. Raymarch only the bounded occupied segment.
5. Integrate transmittance and lighting front-to-back.
6. Reconstruct low-resolution output temporally.
7. Project a separate low-cost cloud-shadow solution.

Read [references/weather-volume-and-reconstruction.md](references/weather-volume-and-reconstruction.md) before implementing or auditing the cloud system, and run [scripts/march-plan.mjs](scripts/march-plan.mjs) before authoring the march loop to verify spherical-shell step lengths against target feature size across view elevations (`90°` down to `0.5°`).

Read the [weather volume cloud entry](examples/weather-volume-clouds/cloud-effect.js)
and its `source/` modules for weather-layer ownership, spherical shell bounds,
authored shape/detail sampling, cloud shadow maps, temporal upscale,
atmospheric composition, and package-owned diagnostics.

## Required controls

- coverage, cloud type, precipitation, and anvil bias;
- base/top altitude and vertical density profile;
- shape/detail scales and erosion;
- wind for each field;
- primary step count, light step count, and empty-space policy;
- history weight and disocclusion threshold;
- cloud-shadow extent, resolution, and update rate.

## Failure conditions

- density is only `fbm(position)`;
- the raymarch traverses the full camera range;
- detail noise adds density instead of eroding shaped masses;
- temporal history is accepted across disocclusion;
- amortised tracing fills untraced pixels from a stale/mismatched fallback (dark checkerboard grid) or leaves slanted turn stripes instead of falling back to a direction-correct baked sky cube;
- no full-quality non-amortised path exists for stills and offline captures;
- geometric step growth blows past feature size near the horizon (stair-step banding), or a cloud deck clips flat against a ceiling plateau;
- shadows use the full beauty raymarch;
- every cloud layer shares the same wind and density profile.

## Routing boundary

Use `$threejs-atmosphere-aerial-perspective` for molecular/aerosol scattering
without weather density; `$threejs-temporal-stability` for general amortised-pass
and motion-stability contracts; and `$threejs-procedural-vfx` for emissive aurora
curtain slabs or bounded interactive voxel fire and smoke with velocity,
pressure, emitter, and collision fields. This skill owns weather-shaped cloud
volumes, raymarch planning, reconstruction, cloud lighting, and cloud shadows.
