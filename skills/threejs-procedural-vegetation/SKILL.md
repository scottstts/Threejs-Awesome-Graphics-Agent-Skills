---
name: threejs-procedural-vegetation
description: Generate authored procedural trees and vegetation in Three.js. Use for trunks, recursive branches, roots, canopies, leaf cards, species presets, growth forces, trellises, deterministic variation, and wind deformation.
---

# Procedural Vegetation

Represent a plant as a growth hierarchy plus rendering adaptations. Do not model it as randomly scattered cylinders.

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

Read the [Ash Growth System implementation](examples/structured-ash-growth/tree-system.js)
with its [authored preset](examples/structured-ash-growth/ash-preset.js) for a
contract-accurate implementation and its diagnostic attributes.

## Visual failure conditions

- branches form visible helices;
- every child emerges at the same relative height;
- bark texture scale changes with branch radius;
- leaves reveal flat card normals under rotation;
- leaf wind moves card roots instead of remaining anchored;
- branch wind is claimed to match a reference whose branches are static;
- different seeds change species identity rather than controlled variation;
- geometry cost grows without a per-level budget.

## Routing boundary

Use `$threejs-procedural-geometry` for generic branch-ring emission without a
growth model. This skill owns species tables, topology, child placement,
foliage, roots, and hierarchical wind.
