# Geometry rubric

Score each dimension 0–3 and record evidence.

| Dimension | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| silhouette | primitive/default | recognizable but generic | authored and distance-readable | distinctive across angles |
| construction | arbitrary intersections | basic assembly | plausible joints/thickness | coherent manufacturing/growth logic |
| topology | invalid/unknown | renders with defects | intentional seams and indices | robust under deformation/processing |
| shading | broken normals | acceptable diffuse | clean normals/tangents/bevel response | controlled hard/soft transitions |
| UV/detail scale | absent/stretched | inconsistent | scale-correct and stable | multi-channel/detail strategy |
| variation/reuse | duplicated unique meshes | uncontrolled random | parameterized families | efficient authored variation system |
| interaction geometry | visual mesh only | rough proxy | clear render/collision separation | BVH/navigation/debug-ready |
| LOD/budget | none | arbitrary distance swap | measured continuity and batching | streaming/impostor strategy |

## Automatic failures

- non-finite attributes or invalid indices;
- visible winding holes;
- severe normal/tangent errors;
- collision proxy materially disagrees with gameplay;
- repeated objects implemented as unnecessary unique draw calls;
- high-detail procedural output with no deterministic seed or budget.

## Review checklist

- inspect wireframe and vertex normals;
- inspect UV density and seams;
- orbit under grazing light;
- test near/far transitions;
- test raycasting/collision debug;
- record triangles, vertices, groups, draw calls, and build time;
- verify disposal and regeneration behavior.
