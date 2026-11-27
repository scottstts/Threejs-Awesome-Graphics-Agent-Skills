---
name: threejs-procedural-architecture
description: Build authored procedural buildings, architectural kits, and composed architectural ornament and relief in Three.js. Use for massing grammars, exposed-edge analysis, façade bays, full-thickness walls with cut openings, curved-wall trims, classical orders, recessed portals, pier-buttresses, spandrel roses, arches, vaults, domes, cornices, roofs, stairs, architectural junctions, carved versus applied relief, rinceau scrolls, acanthus, cartouches, coffers, height-field carving, material-slot mesh compilation, dual-LOD instanced architectural kits, deterministic variants, and procedural city assets.
---

# Procedural Architecture

Separate design planning from mesh emission and construct architectural elements the way real masonry, stone, and timber are built. A building generator should produce an inspectable structural plan — with real wall thickness, through-openings, resolved junctions, and composed ornament — before emitting triangles.

This skill contains exemplary examples and assets beyond descriptive guidance,
they're worth studying, referencing, or even copying. Use them sufficiently
when relevant and do NOT blindly skip them.

## Required architecture

```text
settings
  → mass grammar & depth layers
  → exposed-surface graph
  → façade/roof/opening placements
  → structural & ornament module registry
  → material-slot mesh writer
  → geometries
```

Read [references/grammar-and-mesh-compiler.md](references/grammar-and-mesh-compiler.md) for deterministic mass grammars, compound footprints, exposed-edge subtraction, bay quantization, and material-slot compilation.

Read [references/architectural-construction-and-junctions.md](references/architectural-construction-and-junctions.md) for full-thickness walls with through-openings, curved-wall sweeps, classical orders, arches/vaults/domes, roofs/stairs, exact-contact versus safe-sinking junction rules, and the architectural junction catalogue.

Read [references/ornament-and-relief-systems.md](references/ornament-and-relief-systems.md) for carved versus applied relief, complete ornament composition vocabulary (rinceau scrolls, mirrored scrolls, candelabra, cartouches, acanthus clusters, rhythmic friezes, strapwork, coffers, swags), motif geometry (Euler spirals, cupped leaves, rosettes), `max`-union height-field relief, and banned stand-ins.

Read the
[procedural financial tower compiler](examples/procedural-financial-tower/building-system.js)
for seeded tier planning, semantic façade placement, reserved zones,
material-slot BufferGeometry output, projected detail, and mechanism-specific
diagnostics.

Read the
[sculpted castle keep compiler](examples/sculpted-castle/sculpted-castle.js)
for multi-tier rectangular and polygonal massing, recessed multi-order arched
portals and ribbed barrel vaults, projecting pier-buttresses with breaking
entablatures, sunk spandrels with carved eight-petalled roses, carved niche
walls, ribbed fish-scale domes with lantern and finials, dual-LOD instanced
architectural parts, and procedural height-field relief shading.

## Rules

- Massing, façade rhythm, openings, and ornament modules are separate layers; settle primary depth breaks in single-sided clay before adding ornament.
- Resolve exposed edges before façade placement; build convex corners once and never decorate hidden internal faces.
- Cut openings through full wall thickness and every backing layer; sweep trims on curved walls along the host curve rather than straight chords.
- Stop string courses, mouldings, and friezes cleanly at openings and blank faces.
- Decide carved versus applied relief from structural evidence; compose ornament continuously from stems/axes with full rounded sections rather than scattering disconnected primitives or tracing raw image pixels.
- Size architectural and relief depth tiers to viewing pixel footprint and shadow-map resolution (`reliefDepth > shadowTexelWidth + bias`).
- Compile by material slot to reduce draw calls without destroying material separation, preserving real dimensions for bay width, floor height, trim projection, and texel density.
- Provide topology, façade ownership, material/geometry, and shadow diagnostics appropriate to the renderer path.

## Acceptance

The generated architecture must survive:

- silhouette-only view and single-sided untextured clay view from hero + 4 orbit angles;
- raking grazing light verifying massing breaks, rounded relief sections, and real shadow casting;
- close inspection of openings, curved hosts, corners, roof transitions, and ornament junctions;
- seed variation without broken bays, overlapping ownership, coplanar flicker, or floating ornament;
- triangle and module-count reporting.

## Routing boundary

Use `$threejs-procedural-geometry` for general hard-surface/vehicle modeling, reusable mesh-writer primitives, and whole-scene geometry audits (`geometry-quality-kit`). Use `$threejs-terrain-and-landscapes` for building-to-slope foundations, retaining walls, and distant city/horizon tiers. This skill owns building grammars, architectural construction patterns, junctions, composed ornament/relief, and building-plan compilation.
