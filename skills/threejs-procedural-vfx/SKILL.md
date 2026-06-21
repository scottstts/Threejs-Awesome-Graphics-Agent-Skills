---
name: threejs-procedural-vfx
description: Author production real-time VFX in Three.js. Use for ship-conforming reentry plasma, generated capsule wakes, instanced analytic sparks, timed dissolving debris, dense-swap effect pools, and explicit scene-relative HDR emission hierarchy.
---

# Procedural VFX

Build effects from an event envelope, motion field, geometry representation, and shading response. Avoid independent particle emitters that happen to share a color.

## Effect graph

```text
ship/event state
  → effect-specific geometry or instance attributes
  → flow-facing masks or analytic age
  → material response
  → pool/lifetime ownership
  → HDR and bloom contribution
```

Read [references/procedural-vfx-system.md](references/procedural-vfx-system.md)
for ship-conforming reentry shells, capsule wakes, dense instanced
spark/debris pools, HDR hierarchy, and implementation limits.

Read the [reentry plasma implementation](examples/reentry-plasma/reentry-plasma.js)
for closed layered wake shells, flow-axis deformation, advected filament
fields, opacity shaping, and additive emission diagnostics.

## Rules

- Every layer must have a role in silhouette, motion, illumination, or residue.
- Use normalized lifetime curves instead of scattered time constants.
- Derive secondary motion from the same flow or event direction.
- Keep bloom as a response to HDR emission, not as the effect's only shape.
- Pool instances and trails; do not allocate per burst.
- Expose spawn, simulation, overdraw, and luminance debug views.
- Include a non-bloom baseline that remains legible.

## Routing boundary

Use `$threejs-temporal-surfaces` only for the screen-space
frost/touch-history pipeline. Keep ship-space plasma, generated wakes, sparks,
and pooled debris in this skill.
