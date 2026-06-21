---
name: threejs-volumetric-clouds
description: Implement volumetric cloud systems in Three.js. Use for weather-driven density, bounded raymarching, shape/detail erosion, vertical profiles, lighting cones, silver lining, temporal reconstruction, cloud shadows, multiple layers, and scalable quality modes.
---

# Volumetric Clouds

Cloud quality comes from density organization, lighting, and temporal stability—not from increasing march steps over unstructured noise.

## System order

1. Define the cloud volume and layer bounds.
2. Generate or source weather, base-shape, detail, and turbulence fields.
3. Build a density function with vertical and weather profiles.
4. Raymarch only the bounded occupied segment.
5. Integrate transmittance and lighting front-to-back.
6. Reconstruct low-resolution output temporally.
7. Project a separate low-cost cloud-shadow solution.

Read [references/weather-volume-and-reconstruction.md](references/weather-volume-and-reconstruction.md) before implementing or auditing the cloud system.

Read the [weather volume cloud shader](examples/weather-volume-clouds/cloud-system.js)
and [temporal effect wrapper](examples/weather-volume-clouds/cloud-effect.js)
for weather-layer ownership, spherical shell bounds, authored shape/detail
sampling, directional optical depth, low-resolution rendering, and history
diagnostics.

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
- shadows use the full beauty raymarch;
- every cloud layer shares the same wind and density profile.

## Routing boundary

Use `$threejs-atmosphere-aerial-perspective` for molecular/aerosol scattering
without weather density. This skill owns weather-shaped cloud volumes,
reconstruction, cloud lighting, and cloud shadows.
