# CSG, BVHs, and decals

## Browser CSG

Use constructive solid geometry for editor-like tools, parametric products, cutaways, destructible preparation, and occasional procedural forms. Do not use repeated booleans every frame.

CSG input quality matters:

- closed, consistently wound meshes;
- nondegenerate triangles;
- stable transforms;
- sufficient but not excessive tessellation;
- material-group expectations.

`three-bvh-csg` is useful but still identifies itself as experimental. Pin compatible versions and validate output topology, groups, normals, and UV expectations.

## BVH acceleration

Use `three-mesh-bvh` when triangle raycasting, closest-point tests, shapecasts, or static collision become material bottlenecks.

Good uses:

- large static environment picking;
- camera collision;
- projectile and ground queries;
- decal projection candidate filtering;
- geometry analysis;
- path-tracing acceleration.

Rebuild after topology changes. Refit only when deformation remains compatible with the BVH structure and the library path supports it.

## Decal projection

A decal is clipped projection geometry, not merely a coplanar plane:

1. Build projector transform and volume.
2. Query candidate triangles.
3. Transform candidates to projector space.
4. Clip polygons against the projector box.
5. Generate positions, normals, and projected UVs.
6. Offset or bias to control z-fighting.

Pool transient impact decals. Cap count, fade by age, and release geometry/material resources. Prevent decals from projecting through thin walls by controlling depth and normal angle.

## Failure diagnosis

| Symptom | Cause |
| --- | --- |
| CSG holes | nonmanifold/degenerate input or tolerance issue |
| wrong CSG materials | group consolidation assumptions |
| BVH ray misses | stale bounds/BVH or transformed-space mismatch |
| decal on back wall | projector depth too large or no normal rejection |
| decal flicker | insufficient depth bias |
| impact memory growth | no pooling/lifespan/disposal |

## Source basis

- [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh), reviewed with current direct-query, shapecast, worker, serialization, and shader-BVH capabilities.
- [three-bvh-csg](https://github.com/gkjohnson/three-bvh-csg), reviewed as an experimental MIT-licensed CSG implementation.
- [Three.js DecalGeometry](https://threejs.org/docs/#examples/en/geometries/DecalGeometry) for the maintained add-on API.
