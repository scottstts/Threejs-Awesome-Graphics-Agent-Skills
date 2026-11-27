---
name: threejs-procedural-vegetation
description: Generate authored procedural trees, grass, ivy, flowers, and vegetation in Three.js or raw WebGPU. Use for surface-following vines, painted ivy paths, stylized or GPU grass, GPU-culled virtual flower fields, trunks, recursive branches, roots, canopies, leaf cards, species presets, deterministic growth, distance-tiered plant geometry, and rooted blade, stem, or petiole-hinge wind.
---

# Procedural Vegetation

Represent a plant as a growth hierarchy plus rendering adaptations. Do not model it as randomly scattered cylinders.

This skill contains exemplary examples and assets beyond descriptive guidance,
they're worth studying, referencing, or even copying. Use them sufficiently
when relevant and do NOT blindly skip them.

## Build sequence

1. Define a per-level species table: length, radius, taper, child count, emergence range, angle, twist, gnarliness, sections, radial segments.
2. Grow branches iteratively from a queue so recursion depth and budgets remain inspectable.
3. Emit each branch as oriented rings with an intentional UV seam.
4. Update section orientation from:
   - inherited direction;
   - stochastic curvature;
   - tropism or external force;
   - optional attraction constraints.
5. Spawn children with stratified longitudinal slots and independently permuted angular slots.
6. Generate leaves only after branch topology is stable.
7. Build foliage normals from both card orientation and local crown volume.
8. Choose wind scope explicitly. Leaf-root deformation, branch hierarchy deformation, and whole-tree sway are separate systems.

Read [references/structured-ash-growth-system.md](references/structured-ash-growth-system.md) and preserve its preset, continuation, child-placement, leaf, material, wind, and composition contracts before tuning.

Read [references/botanical-archetypes-lod-and-wind.md](references/botanical-archetypes-lod-and-wind.md) for the universal species archetype table (broadleaf, flowering, conifer, pine, cypress, palm, shrub, topiary, grass, crops), pipe-model rooting and build-time solid clearance against buildings, banned stand-ins, area-conserving structural LOD, and physical wind/shadow rules.

Read the [Ash Growth System implementation](examples/structured-ash-growth/tree-system.js)
with its [authored preset](examples/structured-ash-growth/ash-preset.js) for a
contract-accurate implementation and its diagnostic attributes.

Read the
[stylized meadow grass implementation](examples/stylized-meadow-grass/grass-system.js)
for authored blade-cluster geometry with a procedural fallback, image-driven
path masking, per-instance origin/facing attributes, circular-arc rooted wind,
gust fronts, tip flutter, color clumps, macro variation, translucency, and rim
diagnostics.

Read the
[GPU-computed grass implementation](examples/gpu-computed-grass/gpu-grass-system.js)
for MRT blade-parameter generation, deterministic terrain-conforming placement,
Voronoi clumps, Bezier blade folding, wind-facing yaw, distance LOD/culling,
normal/color fading, translucency, and field diagnostics.

Read [references/gpu-culled-flower-field.md](references/gpu-culled-flower-field.md)
for the exact virtual-address, ecology, hierarchical-compaction, indirect-draw,
distance-tier, atlas, wind, contact, resource, and diagnostic contracts.

Read the
[GPU-culled flower-field entry](examples/gpu-culled-flower-field/gpu-culled-flower-field.js)
and its complete
[raw WebGPU implementation](examples/gpu-culled-flower-field/source/gpu-culled-flower-field.ts)
for zero-record integer candidate reconstruction, 32 by 32 tile culling,
three visible-ID streams, indirect near/middle/far draws, curved textured
petals, identity-preserving horizon heads, and rooted moving-contact response.

Read the
[procedural surface ivy entry](examples/procedural-surface-ivy/ivy-effect.js)
and its complete
[TypeScript implementation](examples/procedural-surface-ivy/source/ivy.ts)
for seeded spline-following stems, repeated mesh reprojection, tangent-plane
creep and droop, parallel-transport tube rings, growth reveal, instanced leaves
and umbels, and rigid petiole-hinge wind. Treat the TypeScript modules as the
only implementation; the entry file only re-exports them.

## Visual failure conditions

- branches form visible helices;
- dense grass ignores terrain height or clump-level variation;
- every child emerges at the same relative height;
- bark texture scale changes with branch radius;
- leaves reveal flat card normals under rotation;
- leaf wind moves card roots instead of remaining anchored;
- branch wind is claimed to match a reference whose branches are static;
- different seeds change species identity rather than controlled variation;
- geometry cost grows without a per-level budget;
- surface-following stems are offset from the host or flip normals across seams;
- ivy branches ignore the tangent plane while attached;
- leaf wind rotates around the card center instead of the petiole.
- a million-flower field allocates CPU transforms or per-candidate records;
- distant flower LOD replaces species identity with one generic sprite;
- compaction and direct rendering reconstruct different roots or acceptance;
- flower heads stay world-up after their stems bend.

## Routing boundary

Use `$threejs-procedural-geometry` for generic branch-ring emission and scene-wide `auditGroupClearance` (`['plant', 'solid']`) checks. Use `$threejs-terrain-and-landscapes` for multi-kilometre forest/horizon terrain layers. This skill owns species tables, botanical archetypes, vine and branch topology, surface-following growth, rooting, area-conserving LOD, foliage, grass fields, and physical wind.
