---
name: threejs-temporal-surfaces
description: Build persistent and accumulating screen-space or UV-space surface effects in Three.js. Use for frost, condensation, wetness, paint, footprints, damage, reveal masks, trails, heat, and interaction fields that must grow, decay, blur, or retain history over time.
---

# Temporal Surfaces

Use render-target state when the effect depends on history. Do not fake accumulation with a time-only procedural mask.

## Pipeline

```text
interaction sources
  → ping-pong state update
  → optional blur/diffusion
  → static structure textures
  → final material/composite
```

Read [references/ping-pong-accumulation.md](references/ping-pong-accumulation.md) for the direct implementation pattern.

## Rules

- Separate persistent state from static noise and scene color.
- Store state in one or two meaningful channels; do not waste RGBA by default.
- Use half-float only when the accumulation range or precision requires it.
- Apply decay in the update pass, never by mutating CPU-side pixel data.
- Run broad blur/diffusion at reduced resolution.
- Pre-render static procedural textures once.
- Clear history on resize, camera-space discontinuity, scene reset, or representation change.
- Define whether the field lives in screen UV, object UV, world projection, or a simulation plane.
