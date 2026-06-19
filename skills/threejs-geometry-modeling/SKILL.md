---
name: threejs-geometry-modeling
description: "Author, diagnose, and optimize production Three.js geometry: indexed BufferGeometry, normals, tangents, UVs, curve sweeps, tubes, roads, rails, terrain, procedural props, CSG, decals, BVH acceleration, LOD, simplification, instancing, batching, and geometry debugging. Use when primitives are visually insufficient, meshes must be generated or modified at runtime, worlds need procedural structure, or geometry quality and cost must be designed together."
---

# Three.js Geometry Modeling

Treat geometry as a visual, shading, interaction, and performance system.

## Workflow

1. Define silhouette, viewing distance, deformation, material, collision, and reuse requirements.
2. Choose imported, parametric, procedural, CSG, instanced, batched, merged, or impostor representation.
3. Design vertex sharing and intentional seams before writing attributes.
4. Generate positions, indices, normals, UVs, tangents, groups, and bounds as one contract.
5. Validate topology and shading with debug views.
6. Add collision/picking acceleration only after geometry is stable.
7. Establish LOD and batching strategy from visible error, not triangle count alone.

## Load focused references

- Custom meshes and attribute correctness: [buffer-geometry-authoring.md](references/buffer-geometry-authoring.md)
- Roads, rails, pipes, cables, and profiles along paths: [curves-sweeps-lofts-tubes.md](references/curves-sweeps-lofts-tubes.md)
- Terrain, biomes, roads, and procedural worlds: [terrain-roads-world-generation.md](references/terrain-roads-world-generation.md)
- Browser CSG, BVHs, decals, and surface projection: [csg-bvh-decals.md](references/csg-bvh-decals.md)
- LOD, simplification, instancing, batching, and shipping assets: [lod-simplification-batching.md](references/lod-simplification-batching.md)
- Geometry quality gate: [geometry-rubric.md](references/geometry-rubric.md)

Use the runnable [road curve sweep example](examples/road-curve-sweep/index.html) as a compact indexed-mesh reference.

## Guardrails

- Prefer indexed geometry unless hard edges, UV seams, material boundaries, or independent attributes require splits.
- Treat bevels and edge profiles as lighting features.
- Recompute bounds after deformation; recompute normals only when the intended surface requires it.
- Keep render, collision, navigation, and picking geometry independently tunable.
- Use `three-bvh-csg` as an advanced, version-checked tool—not a default modeling pipeline.
- Perform expensive simplification and glTF optimization offline when the asset is known ahead of time.
