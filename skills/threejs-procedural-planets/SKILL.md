---
name: threejs-procedural-planets
description: Author procedural planetary bodies in Three.js. Use for spherical terrain, continents, ridges, craters, biome masks, coastlines, material variation, analytic normals, altitude LOD, and bodies that must hold up from orbit through close approach.
---

# Procedural Planets

Build a planet as a coupled field system evaluated on a unit direction. The same geological causes must drive geometry, color, roughness, normal, atmosphere handoff, and distance filtering.

## Required build order

1. Establish planet-space direction, radius, sea level, and world-unit scale.
2. Build macro silhouette fields before any surface material.
3. Add named geological structures: continents, basins, ridges, craters, lava fields, or ice.
4. Derive slope, cavity, altitude, latitude, exposure, and shoreline fields.
5. Classify broad biomes from those causes.
6. Derive displacement, color, roughness, and normal from the shared field bundle.
7. Filter bands by represented mesh scale and camera altitude.
8. Couple the material to atmosphere and lighting using the same planet transform.

Read [references/planet-field-and-atmosphere-systems.md](references/planet-field-and-atmosphere-systems.md) for terrain, biome, gas-giant, material, altitude-LOD, and atmosphere-handoff mechanisms, including a known CPU/GPU field-parity failure mode.

Read the [procedural planet surface implementation](examples/procedural-planet-surface/planet-system.js)
and its [shared terrain field](examples/procedural-planet-surface/terrain-field.js)
for undeformed sphere coordinates, shared CPU/GLSL terrain, coupled biome and
material causes, derivative bump, and altitude-filtered detail.

## Non-negotiable constraints

- Domain-warp tangentially and renormalize; do not distort the sphere radially.
- Craters need floor, wall, rim, and optional ejecta—not dark circles.
- Continents and biomes must be region fields, not isolated threshold bubbles.
- Geometry displacement and shader normals must describe the same height function.
- Close detail may disappear with altitude; the macro silhouette may not.
- Expose individual field views and a displacement exaggeration mode.

## Completion test

The body must remain intentional in:

- unlit silhouette;
- flat albedo with no atmosphere;
- grazing directional light;
- orbit view;
- close approach;
- biome-mask and normal-only views;
- at least three seeds without losing the chosen planetary identity.

## Routing boundary

Use `$threejs-procedural-fields` for a reusable field bundle without a complete
body, and `$threejs-atmosphere-aerial-perspective` for scattering independent
of planet generation. This skill owns the coupled planetary surface.
