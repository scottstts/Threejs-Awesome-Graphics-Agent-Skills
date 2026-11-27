---
name: threejs-shadow-systems
description: Implement stable, scalable directional-shadow systems for Three.js. Use for large procedural worlds, city scenes, terrain, moving cameras, WebGPU/TSL shadow nodes, CSMShadowNode cascades, cached clipmaps, texel stabilization, tight depth-range bias and peter-panning fixes, static versus dynamic update budgets, matte test-plane isolation, and targeted invalidation.
---

# Shadow Systems

Use a single tightly fitted shadow map only when its receiver region is genuinely bounded. For open scenes and large moving views, choose an explicit cascade or cached-clipmap hierarchy with tight depth ranges, world-texel-scaled bias, and per-frame dynamic caster updates.

## Coverage and build workflow

1. Choose the coverage tier: single tightly fitted map (compact bounded scene), built-in `CSMShadowNode` (`3–4` cascades for open worlds), or custom cached clipmaps + long-range/baked terrain shadows (multi-kilometre streamed worlds).
2. Fit shadow-camera near/far tightly to actual casters so normalized depth bias never produces decimetres of peter-panning.
3. Snap cascade/clipmap centers to each level's world-space texel grid and cross-fade adjacent levels cleanly.
4. Start bias at `0`, raise `normalBias` scaled by world texel width to clear grazing acne, and confirm thin-post contacts and small-relief casting (`reliefDepth > texelWidth + bias`).
5. Separate update policies: bake static architecture/terrain (`autoUpdate = false`), update moving casters (wind-blown vegetation, characters, vehicles) **every frame**, and invalidate cached coarse levels spatially.
6. Verify with a matte test plane, grazing stick shadows, slow pans, and near-to-far camera dollies.

Read [references/shadow-cascades-bias-and-updates.md](references/shadow-cascades-bias-and-updates.md) for tier selection, WebGPU `CSMShadowNode` setup, depth-range bias calibration, small-relief casting thresholds, static vs dynamic update policies, and matte test-plane isolation.

Read [references/cached-clipmap-shadows.md](references/cached-clipmap-shadows.md) for custom concentric light-space cached clipmaps, committed-center state, update budgets, and targeted invalidation.

Read the
[cached shadow clipmaps](../threejs-procedural-architecture/examples/procedural-financial-tower/shadow-clipmaps.js)
for three light-space square levels, per-level texel snapping, containment
cross-fades, cached coarse updates, scaled bias, and unshadowed outside weight.

## Failure conditions

- projection centers move by fractions of a texel, causing swimming edges;
- shadow-camera depth range is left overly wide, turning small depth bias into peter-panning;
- small architectural or rock relief casts nothing because texel width plus bias exceeds relief depth;
- shader containment does not match the map's committed center;
- moving foliage, characters, or vehicles cast stepped every-N-frame or static proxy shadows;
- coarse levels freeze moving casters indefinitely without invalidation;
- depth texture samples occur in divergent fragment control flow;
- the same normal bias is used across radically different texel sizes;
- level boundaries become visible or shadows clip abruptly at mid-distance under camera motion;
- a fill light casts conflicting shadows alongside the primary sun.

## Routing boundary

This skill owns light-space directional shadow coverage, cascades, clipmaps, bias, and caster update policies. Use `$threejs-lighting-and-gi` for sun direction coherence, sun-to-sky ratios, irradiance-probe GI, and reflections; `$threejs-screen-space-ambient-occlusion` for view-dependent contact AO (AO never replaces cast shadows); and `$threejs-temporal-stability` for general frame-to-frame motion audits.
