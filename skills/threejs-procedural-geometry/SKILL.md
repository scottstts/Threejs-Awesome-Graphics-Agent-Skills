---
name: threejs-procedural-geometry
description: Build robust procedural mesh systems in Three.js. Use for profile sweeps, tubes, rails, frames, transported coordinate frames, seams and caps, semantic mesh writers, custom attributes, UV density, normal generation, material slots, instancing, geometry budgets, and generated shapes that must survive close inspection.
---

# Procedural Geometry

Generate geometry from a semantic plan and an explicit coordinate frame. Triangle emission is the final compilation step, not the design model.

## Build order

1. Define dimensions and semantic segments.
2. Generate a centerline, boundary, profile, or placement plan.
3. Build stable local frames.
4. Emit vertices with intentional seams and material ownership.
5. Generate UVs from real distance.
6. Validate winding, normals, tangents, bounds, and degenerates.
7. Select merging, instancing, or LOD by update and material behavior.

Read [references/profile-sweeps-and-mesh-writers.md](references/profile-sweeps-and-mesh-writers.md).

## Failure conditions

- profile orientation flips along a curve;
- caps reuse side vertices and create averaged edge normals;
- UV scale changes with segment count;
- arbitrary vertex merging destroys hard edges or material boundaries;
- generated dimensions are hidden in magic multipliers;
- instancing is used despite per-instance topology differences;
- triangle count is the only reported complexity metric.
