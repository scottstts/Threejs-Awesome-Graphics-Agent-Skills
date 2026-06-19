# SDFs and raymarching

## Use cases

Use signed-distance fields for procedural shapes, smooth blends, repeated structures, volumes, masks, and effects that are difficult to mesh. Do not raymarch ordinary opaque props that can be rendered more cheaply as meshes.

## SDF composition

- union: `min(a, b)`;
- intersection: `max(a, b)`;
- subtraction: `max(a, -b)`;
- smooth union: controlled blend that changes shape and distance accuracy;
- repetition: transform coordinates before evaluating;
- deformation: twist, bend, mirror, elongate, or displace coordinates.

Keep transformations reversible and track scale. Nonuniform scaling invalidates simple distance assumptions unless compensated.

## Bounded raymarch

1. Intersect a cheap bounding mesh/volume.
2. Start at the entry distance.
3. Step by a conservative distance estimate.
4. Stop on surface epsilon, exit distance, or maximum steps.
5. Compute normal from SDF derivatives/finite differences.

```glsl
for (int i = 0; i < MAX_STEPS; i++) {
  vec3 p = rayOrigin + rayDirection * distanceTravelled;
  float distanceToScene = map(p);
  if (distanceToScene < epsilon) { hit = true; break; }
  distanceTravelled += distanceToScene * safety;
  if (distanceTravelled > maxDistance) break;
}
```

## Stability

- scale epsilon with scene/ray distance;
- clamp or bound displacement that breaks distance guarantees;
- use a safety factor for approximate fields;
- avoid NaNs in normals;
- handle camera-inside-volume cases;
- add shadow/AO steps only after primary tracing is stable.

## Quality ladder

- Cheap: bounded object-space SDF, 32–48 steps, simple normal/light.
- Standard: 64–96 steps, soft shadows, AO, material IDs, adaptive epsilon.
- High-end: temporal accumulation, volumetrics, multiple scattering approximations, denoising.

## Diagnosis

- banding: low precision or too few steps;
- missing thin parts: epsilon/step too large;
- slow empty frame: no bounding geometry;
- surface acne: normal epsilon or self-shadow bias;
- melted shapes: smooth-min radius too large;
- temporal crawl: high-frequency displacement without filtering.
