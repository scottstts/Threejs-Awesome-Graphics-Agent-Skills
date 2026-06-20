---
name: threejs-procedural-vfx
description: Author procedural real-time VFX systems in Three.js. Use for plasma, sparks, embers, trails, shockwaves, energy fields, reentry effects, instanced particles, temporal envelopes, coherent noise advection, bloom-aware emission, and layered effects with explicit visual causality.
---

# Procedural VFX

Build effects from an event envelope, motion field, geometry representation, and shading response. Avoid independent particle emitters that happen to share a color.

## Effect graph

```text
event state
  → normalized lifetime
  → emission schedule
  → initial distribution
  → motion/advection field
  → representation
  → material response
  → image-pipeline contribution
```

Read [references/procedural-vfx-system.md](references/procedural-vfx-system.md).

## Rules

- Every layer must have a role in silhouette, motion, illumination, or residue.
- Use normalized lifetime curves instead of scattered time constants.
- Derive secondary motion from the same flow or event direction.
- Keep bloom as a response to HDR emission, not as the effect's only shape.
- Pool instances and trails; do not allocate per burst.
- Expose spawn, simulation, overdraw, and luminance debug views.
- Include a non-bloom baseline that remains legible.
