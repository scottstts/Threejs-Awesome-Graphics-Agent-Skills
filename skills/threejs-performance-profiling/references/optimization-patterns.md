# Optimization patterns

## Submission

- InstancedMesh: repeated geometry and material.
- BatchedMesh: varied geometry with compatible material.
- merge static geometry: truly static compatible objects.
- shared materials: reduce programs and state changes.
- visibility/layers: avoid processing irrelevant objects.

## Pixel cost

- cap DPR;
- reduce transparent overlap;
- tighten shadow cameras;
- lower broad-effect resolution;
- avoid full-screen work with little visible impact;
- use alpha test or dither when blend transparency is unnecessary.

## CPU and allocation

- reuse vectors, matrices, rays, and arrays in hot paths;
- avoid repeated traversal and lookup;
- update distant or decorative systems less often;
- pool short-lived gameplay objects;
- avoid rebuilding geometry/materials;
- keep React out of per-frame transform updates.

## Assets

- use LOD and culling;
- compress textures for GPU use;
- stream deferred content;
- reduce material and primitive count during export;
- reuse skeletons and clips carefully;
- prewarm critical shaders.

## Anti-patterns

- optimizing triangle count while draw calls dominate;
- migrating to WebGPU without a measured bottleneck;
- disabling all quality instead of targeting the expensive pass;
- adding workers when data transfer costs exceed the work;
- trusting one desktop measurement for a mobile audience.
