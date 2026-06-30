---
name: threejs-precipitation-surfaces
description: Build coupled precipitation and affected surfaces in Three.js. Use for falling snow, snow accumulation, model snow caps, wet asphalt puddles, procedural ripple normals, splash flipbooks, rain streaks, shared weather envelopes, and surface wetness or coverage transitions.
---

# Precipitation Surfaces

Treat weather as a coupled event, particle, and surface-response system. Do not
add rain or snow particles that are visually disconnected from the ground.

## Build order

```text
weather envelope
  -> falling precipitation volume
  -> world/object surface mask
  -> displaced or optical surface response
  -> impact residue and splashes
  -> shared lighting/post presentation
```

Read [references/precipitation-surface-systems.md](references/precipitation-surface-systems.md)
for snow accumulation, object capping, wrapped precipitation volumes, wet
puddle masks, procedural ripple normals, splash placement, debug outputs, and
licensing boundaries.

Read the
[snow accumulation implementation](examples/snow-accumulation/snow-system.js)
for camera-wrapped snowfall, shared wind/time uniforms, world-space snow masks,
single-source snow height and normals, model snow capping, and optional ice
surface composition.

Read the
[wet puddle rain implementation](examples/wet-puddle-rain/rain-puddle-system.js)
for rain-progress wetness, asphalt puddle masks, procedural ripple normals,
instanced rain streaks, upward-surface splash sampling, and flipbook splashes.
This example includes GPL-licensed source material;
preserve its license boundary when copying or publishing it.

## Required controls

- precipitation density and speed;
- wind direction and strength;
- shared weather progress or coverage;
- wetness, snow, or puddle mask threshold and softness;
- ripple or drift normal strength;
- surface roughness response;
- particle/splash opacity;
- debug modes for masks, normals, particles, and event progress.

## Failure conditions

- falling precipitation ignores the wind or timing used by surface response;
- snow height and snow normals come from different fields;
- model snow sticks to vertical faces without an upward-facing filter;
- puddles only lower roughness without a mask, normal response, or ripples;
- splashes appear on downward or hidden faces;
- rain streaks allocate per drop or fail to wrap around the camera;
- temporal wetness is faked with unrelated time noise;
- the license boundary for GPL-derived rain code is removed or obscured.

## Routing boundary

Use `$threejs-water-optics` for bounded pool simulation, caustics, Fresnel,
refraction, and Beer-Lambert water volumes. Use `$threejs-procedural-vfx` for
general sparks, plasma, trails, and non-weather particles. Use
`$threejs-temporal-surfaces` for screen-space touch history or frost clearing.
This skill owns precipitation events and the surfaces they visibly alter.
