---
name: threejs-shadow-systems
description: Implement stable, scalable directional-shadow systems for Three.js. Use for large procedural worlds, city scenes, terrain, moving cameras, WebGPU/TSL shadow nodes, cascades, cached clipmaps, texel stabilization, update budgets, and targeted invalidation.
---

# Shadow Systems

Use a single shadow map only when its receiver region is genuinely bounded. For large moving views, make shadow coverage an explicit spatial hierarchy.

## Cached clipmap workflow

1. Define concentric light-space square levels.
2. Snap each level center to its own texel grid.
3. Cross-fade adjacent levels in shader space.
4. Refresh near levels continuously.
5. Cache coarse levels and update them under a frame budget.
6. Invalidate intersecting levels when important casters or streamed terrain change.
7. Scale normal bias by world-space texel width.

Read [references/cached-clipmap-shadows.md](references/cached-clipmap-shadows.md) before implementing a large-world directional light.

Read the
[cached shadow clipmaps](../threejs-procedural-architecture/examples/authored-financial-tower/shadow-clipmaps.js)
for three light-space square levels, per-level texel snapping, containment
cross-fades, cached coarse updates, scaled bias, and unshadowed outside weight.

## Failure conditions

- projection centers move by fractions of a texel;
- shader containment does not match the map's committed center;
- all cascades refresh every frame without evidence;
- coarse levels freeze moving casters indefinitely;
- depth texture samples occur in divergent fragment control flow;
- the same normal bias is used across radically different texel sizes;
- level boundaries become visible under camera motion.

## Routing boundary

Use this skill for light-space directional shadow maps. Use
`$threejs-screen-space-ambient-occlusion` for view-dependent ambient
visibility; AO is not a replacement for cast shadows.
