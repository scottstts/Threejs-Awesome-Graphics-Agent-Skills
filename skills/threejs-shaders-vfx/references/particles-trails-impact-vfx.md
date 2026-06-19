# Particles, trails, ribbons, and impact VFX

## Design the timing envelope

An impact commonly uses:

1. anticipation/telegraph;
2. contact flash;
3. fast primary expansion;
4. slower secondary debris/smoke;
5. residue such as decal, scorch, ripple, or dust;
6. complete cleanup.

Vary duration and scale by gameplay importance. If every event uses the largest flash, hierarchy disappears.

## Particle representation

- Points: cheapest, limited shape/orientation.
- Instanced quads/meshes: flexible per-particle transforms and flipbooks.
- CPU pool: low-to-medium counts and gameplay coupling.
- GPU/compute: high counts and independent simulation.

Keep state in typed arrays/storage buffers. Pool emitters and particles; avoid object-per-particle designs.

## Flipbooks

Store frame index, lifetime, and interpolation policy. Keep atlas padding and premultiplied-alpha assumptions correct. Blend frames only when extra texture reads fit the budget.

## Trails and ribbons

Sample a stable history of positions. Build camera-facing or frame-oriented segments with width, color, and opacity over normalized age. Remove near-duplicate samples and handle sharp turns to avoid ribbon flips.

## Decals and residue

Project marks onto candidate geometry, reject back-facing or distant surfaces, use depth bias, pool geometry, and cap lifetime/count. Residue should communicate material and force: dust, scorch, wet splash, crack, dent, or glow.

## Distortion and shockwaves

Use a mask to offset scene UVs. Fade distortion near screen edges and missing source data. Keep displacement small enough to preserve readability. Shockwaves need a clear radial timing curve and often a secondary color/particle cue.

## Readability

Use color, direction, shape, speed, and timing to encode:

- source;
- damage/type;
- safe versus dangerous;
- success versus failure;
- direction of incoming force.

## Quality ladder

- Cheap: pooled sprites/points, one flash, one debris layer.
- Standard: flipbook, ribbon/trail, decal residue, material-specific particles.
- High-end: GPU simulation, depth collision, volumetric layer, distortion, temporal lighting.
