# BufferGeometry authoring

## Problem

Create meshes whose topology, shading, UVs, and update cost remain predictable.

## Representation contract

Define the logical surface before arrays:

- vertices that may be shared;
- edges that must split for hard normals, UV seams, or material groups;
- triangle winding;
- attribute precision and update frequency;
- bounding volume strategy.

Indexed geometry reuses a complete attribute tuple, not just position. Two corners at the same position require separate vertices when their normals, UVs, colors, skin weights, or tangents differ.

## Construction sequence

1. Generate logical points and connectivity.
2. Emit position and index buffers.
3. Add UVs and other attributes with matching vertex count.
4. Compute or author normals.
5. Generate tangents only when the normal-map path needs them.
6. Add material groups without overlapping or missing triangles.
7. Compute bounding box and sphere.
8. Validate winding, seams, degenerates, and non-finite values.

```js
const geometry = new THREE.BufferGeometry();
geometry.setAttribute(
  "position",
  new THREE.Float32BufferAttribute(positions, 3),
);
geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
geometry.setIndex(indices);
geometry.computeVertexNormals();
geometry.computeBoundingBox();
geometry.computeBoundingSphere();
```

## Shading decisions

- Smooth surface: share vertices and average normals.
- Hard edge: split vertices or author face-oriented normals.
- Beveled edge: create real transitional geometry; a normal trick does not change silhouette.
- Displaced surface: provide enough tessellation and update bounds.
- Mirrored UV islands: verify tangent handedness.

## Failure diagnosis

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| black/missing faces | winding or culling | inspect triangle order and normals |
| lighting crease | unintended vertex split | weld compatible attribute tuples |
| melted hard edge | over-shared vertices | split at intended crease |
| normal map twists | invalid UV/tangent basis | validate UVs and tangents |
| raycast misses | stale bounds/BVH | recompute after deformation |
| random spikes | bad index or NaN | bounds-check every emitted index/value |

## Quality ladder

- Cheap: correct indexed mesh, computed normals, one UV set.
- Standard: authored seams, bevels, tangents, debug modes, stable updates.
- High-end: multiple UVs, custom attributes, meshlet/cluster preparation, offline optimization.

## Source basis

- [Catlike Coding procedural meshes](https://catlikecoding.com/unity/tutorials/procedural-meshes/) for topology-first progression.
- [meshoptimizer](https://meshoptimizer.org/) for indexing, vertex-cache, fetch, overdraw, and quantization order.
- [Three.js BufferGeometry documentation](https://threejs.org/docs/#api/en/core/BufferGeometry) for current API behavior.
