# Profile sweeps and mesh writers

## 1. Semantic plan

Keep a plan above raw buffers:

```ts
type SweepPlan = {
  path: THREE.Vector3[]
  profile: Array<{ x: number; y: number; semantic: string }>
  closedProfile: boolean
  capStart: boolean
  capEnd: boolean
  materialForSegment: (semantic: string) => number
  uvMetersPerTile: THREE.Vector2
}
```

For architecture, add anchors such as `front`, `back`, `sill`, `reveal`, `corniceTop`. For vegetation, add branch level and longitudinal fraction.

## 2. Parallel-transport frame

Frenet frames can flip around low curvature or inflection points. Transport the previous normal with the tangent change:

```js
const tangent = next.clone().sub(previous).normalize()
const axis = previousTangent.clone().cross(tangent)

if (axis.lengthSq() > epsilon) {
  axis.normalize()
  const angle = Math.acos(
    THREE.MathUtils.clamp(previousTangent.dot(tangent), -1, 1),
  )
  normal.applyAxisAngle(axis, angle)
}

const binormal = tangent.clone().cross(normal).normalize()
normal.copy(binormal).cross(tangent).normalize()
```

Choose the initial normal from a preferred up vector projected perpendicular to the tangent. If nearly parallel, choose a fallback axis.

For closed paths, measure accumulated twist and distribute the correction around all rings.

## 3. Ring emission

For path sample `i` and profile vertex `j`:

```js
position = center
  + frame.normal * profile[j].x
  + frame.binormal * profile[j].y
```

Duplicate the first profile vertex at the seam when UVs or normals require discontinuity.

Index each quad consistently:

```text
a = ring(i, j)
b = ring(i + 1, j)
c = ring(i + 1, j + 1)
d = ring(i, j + 1)
triangles: a,b,d and b,c,d
```

Verify winding in the chosen coordinate convention with a normal debug material.

## 4. Hard edges

Split vertices when any of these differ:

- face normal discontinuity;
- UV discontinuity;
- material group;
- tangent discontinuity;
- semantic attribute that cannot interpolate.

Do not call a global weld after emission unless the weld key includes all relevant attributes.

## 5. Caps

Caps usually need their own vertices:

- planar normal;
- planar UV mapping;
- separate material slot;
- hard edge against the side wall.

Triangulate concave profiles with a validated polygon triangulator. A center fan only works for star-shaped profiles and can create skinny triangles.

## 6. UVs from distance

For a sweep:

```text
u = cumulativePathDistance / metersPerTileU
v = cumulativeProfileDistance / metersPerTileV
```

For branch bark, longitudinal texture scale should follow branch length while circumference uses actual radius. Do not normalize every branch to `[0,1]` if texture density must remain consistent.

For profiles with semantic faces, allow separate UV axes and offsets per segment.

## 7. Normal strategies

Choose:

- analytic profile normal transformed by frame;
- face-weighted normals for hard-surface modules;
- angle-weighted vertex normals for smooth irregular meshes;
- canopy or volume normals for leaf cards;
- custom bent normals for stylized lighting.

`computeVertexNormals()` is a fallback, not a design decision. It cannot infer intended hard edges after vertices have been shared.

## 8. Mesh writer

A useful writer:

```ts
type Vertex = {
  position: [number, number, number]
  normal: [number, number, number]
  uv: [number, number]
  color?: [number, number, number, number]
  semantic?: number
}

interface MeshWriter {
  addVertex(vertex: Vertex): number
  addTriangle(a: number, b: number, c: number, materialSlot: number): void
  addQuad(a: Vertex, b: Vertex, c: Vertex, d: Vertex, materialSlot: number): void
  build(): THREE.BufferGeometry[]
}
```

Collect indices by material slot, then produce groups or separate geometries based on draw/update needs.

Track:

```text
triangle count
vertex count
material groups
module/branch count
bounds
attribute bytes
degenerate triangles
non-manifold edge count where relevant
```

## 9. Merging versus instancing

Merge when:

- geometry is static;
- materials are shared;
- individual culling/interaction is unnecessary;
- topology varies but final batching matters.

Instance when:

- topology is identical;
- transforms or a small attribute set vary;
- individual culling/LOD matters;
- updates are frequent.

Use multi-draw or indirect approaches only when the target backend and complexity justify them.

## 10. LOD

Create LOD from semantic simplification:

- reduce radial/path subdivisions;
- remove small profile notches;
- replace leaf clusters with cards;
- collapse façade ornaments into relief or normal detail;
- preserve silhouette vertices longer than hidden interior detail.

Generic decimation can destroy authored profile rhythm. Build lower-detail modules where identity depends on structure.

## 11. Numerical robustness

Guard:

- zero-length path segments;
- duplicate profile points;
- parallel up/tangent vectors;
- near-zero triangle area;
- huge coordinates;
- inconsistent closed-loop endpoint duplication;
- NaN attributes.

Run validation before constructing GPU buffers and report the semantic segment that failed.

## 12. Debug views

Provide:

```text
path and frames
ring/profile IDs
face normals
vertex normals
UV checker with real scale
material groups
hard-edge splits
LOD comparison
degenerate/non-manifold highlights
```
