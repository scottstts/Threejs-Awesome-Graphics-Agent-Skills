---
name: threejs-procedural-architecture
description: Build authored procedural buildings and architectural kits in Three.js. Use for massing grammars, exposed-edge analysis, façade bays, profiles, arches, cornices, roofs, ornaments, material-slot mesh compilation, deterministic variants, and procedural city assets.
---

# Procedural Architecture

Separate design planning from mesh emission. A building generator should produce an inspectable plan before it produces triangles.

## Required architecture

```text
settings
  → mass grammar
  → exposed-surface graph
  → façade/roof placements
  → module registry
  → material-slot mesh writer
  → geometries
```

Read [references/grammar-and-mesh-compiler.md](references/grammar-and-mesh-compiler.md) before implementing the generator.

Read the
[authored financial tower compiler](examples/authored-financial-tower/building-system.js)
for seeded tier planning, semantic façade placement, reserved zones,
material-slot instancing, projected detail, and mechanism-specific diagnostics.

## Rules

- Massing, façade rhythm, and detail modules are separate layers.
- Resolve exposed edges before façade placement. Do not decorate hidden internal faces.
- Modules own semantic anchors and construction depth, not global building coordinates.
- Compile by material slot to reduce draw calls without destroying material separation.
- Preserve real dimensions for floor height, bay width, trim projection, and texture density.
- Randomness may select among valid designs; it must not repair invalid geometry.
- Provide topology, placement, material-slot, and UV-density debug modes.

## Acceptance

The generated building must survive:

- silhouette-only view;
- flat untextured material;
- grazing light;
- close inspection of corners and roof transitions;
- seed variation without broken bays, overlapping ownership, or floating ornament;
- triangle and module-count reporting.

## Routing boundary

Use `$threejs-procedural-geometry` for a reusable profile, sweep, ring, or mesh
writer without a building grammar. This skill owns massing, façade semantics,
architectural modules, and building-plan compilation.
