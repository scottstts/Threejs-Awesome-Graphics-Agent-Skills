# LOD, simplification, and batching

## Visual-error thinking

LOD is not “remove half the triangles.” Preserve:

- silhouette;
- large curvature;
- material boundaries;
- UV seams and normal discontinuities;
- animation deformation;
- recognizable features.

Garland–Heckbert quadric error metrics estimate the geometric cost of collapsing edges by accumulating error planes around vertices. The production lesson is to rank collapses by visible shape error and preserve constraints, not to delete triangles uniformly.

## Representation ladder

- Original mesh: near, focal, interactive.
- Simplified mesh: middle distance.
- Aggressive proxy: far distance.
- Impostor/billboard: distant repeated object.
- Omit: below perceptual value.

Use hysteresis or transition bands to avoid popping. Crossfade only when transparency cost and sorting are acceptable.

## Draw organization

- `InstancedMesh`: same geometry and material, per-instance transform/color/custom data.
- `BatchedMesh`: compatible material with multiple geometries/instances.
- merged geometry: static compatible meshes with stable world transforms.
- separate draws: independent materials, sorting, skeletons, visibility, or update needs.

Do not merge everything: one giant mesh damages culling and update granularity.

## Shipping pipeline

For known assets, prefer offline processing:

1. deduplicate/weld compatible vertices;
2. simplify with attribute preservation;
3. optimize vertex cache;
4. optionally optimize overdraw;
5. optimize vertex fetch;
6. quantize;
7. compress;
8. validate.

`glTF Transform` provides reproducible glTF operations and integrates Draco, Meshopt, texture resizing, WebP, and KTX2 workflows. `meshoptimizer` explicitly documents optimization order and warns that overdraw optimization may not help tiled mobile GPUs.

## Quality ladder

- Cheap: manual near/far meshes and InstancedMesh.
- Standard: measured screen-space LOD, hysteresis, BatchedMesh, offline glTF optimization.
- High-end: hierarchical tiles, impostors, streaming, cluster-aware simplification.

## Source basis

- [Garland–Heckbert QEM](https://www.cs.cmu.edu/~garland/quadrics/quadrics.html)
- [meshoptimizer](https://meshoptimizer.org/)
- [glTF Transform](https://gltf-transform.dev/)
