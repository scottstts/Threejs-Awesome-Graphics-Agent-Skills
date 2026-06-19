# Procedural effects

## Frequency design

Build effects in layers:

- macro: silhouette, flow direction, large displacement;
- meso: breakup, lobes, waves, cells;
- micro: sparkle, grain, erosion, fine normals.

Keep each frequency band controllable and avoid equal-amplitude noise at every scale.

## Common patterns

### Dissolve

Combine a stable scalar field, animated threshold, anti-aliased edge width, edge color/emission, and optional geometry-aware direction. Avoid raw discard on large transparent surfaces when alpha test or dither is sufficient.

### Water

Separate geometric waves, normal detail, Fresnel response, depth color, foam, and reflection/refraction strategy. Screen-space refraction requires careful edge and missing-data behavior.

### Fire and smoke

Use directional advection, buoyant shape, value falloff, and temporal coherence. Random particles without a flow field read as confetti.

### Particles

Choose CPU, instanced, transform-feedback-like, or compute updates from particle count and behavior. Minimize transparent overdraw; use size attenuation and bounded screen size.

### Raymarching

Use conservative step logic, a maximum distance, maximum iterations, surface epsilon tied to scale, and early exits. Add bounding geometry so fragments outside the volume do no work.

## Artistic controls

Expose controls in perceptual units:

- speed, scale, contrast, edge width;
- color ramps;
- direction and turbulence;
- density and falloff;
- world-space anchors.

Do not expose dozens of raw constants without grouping them by visual function.
