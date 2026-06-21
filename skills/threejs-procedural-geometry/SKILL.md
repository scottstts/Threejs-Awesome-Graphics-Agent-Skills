---
name: threejs-procedural-geometry
description: Build production procedural mesh systems in Three.js. Use for sculpted rail and frame profiles, oriented branch rings, semantic mesh writers, deliberate skins and caps, UV density, custom normals, material slots, instancing decisions, and close-inspection geometry budgets.
---

# Procedural Geometry

Generate geometry from a semantic plan and an explicit coordinate frame. Triangle emission is the final compilation step, not the design model.

## Build order

1. Define dimensions and semantic segments.
2. Generate a centerline, boundary, profile, or placement plan.
3. Build the mechanism-appropriate local parameterization or branch orientation.
4. Emit vertices with intentional seams and material ownership.
5. Generate UVs from real distance.
6. Validate winding, normals, tangents, bounds, and degenerates.
7. Select merging, instancing, or LOD by update and material behavior.

Read [references/profile-sweeps-and-mesh-writers.md](references/profile-sweeps-and-mesh-writers.md)
for the exact sculpted-frame profile, rail emission, tree rings, semantic mesh
writer, and their observed scaling limits.

Read the
[sculpted gallery frame geometry](examples/sculpted-gallery-frame/frame-geometry.js)
for the profile sweep, miter-like rail mapping, authored PBR surface
bundles, grazing spotlights, selective bloom ownership, and geometry
diagnostics.

Read the
[authored financial tower compiler](../threejs-procedural-architecture/examples/authored-financial-tower/building-system.js)
for semantic placement compilation and material-slot instancing at building
scale.

## Failure conditions

- profile orientation flips along a curve;
- caps reuse side vertices and create averaged edge normals;
- UV scale changes with segment count;
- arbitrary vertex merging destroys hard edges or material boundaries;
- generated dimensions are hidden in magic multipliers;
- instancing is used despite per-instance topology differences;
- triangle count is the only reported complexity metric.

## Routing boundary

This skill owns reusable mesh emission. Use
`$threejs-procedural-architecture` for a building grammar and
`$threejs-procedural-vegetation` for a growth hierarchy; those subject skills
may then apply these geometry mechanisms.
