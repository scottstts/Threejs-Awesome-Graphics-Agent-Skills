---
name: threejs-shaders-vfx
description: "Author production Three.js VFX: layered particles, trails, decals, impact timing, water, atmosphere, volumetrics, screen-space effects, temporal stability, and device quality tiers. Use for effect design, integration, readability, fallback, or polish; use threejs-shaders-procedural for shader construction and math bugs."
---

# Three.js Shaders and VFX

Separate the effect’s visual purpose from its rendering technique.

## Effect workflow

1. State what the player or viewer should perceive.
2. Choose mesh, texture, particle, screen-space, raymarch, compute, or hybrid representation.
3. Define cheap, standard, and high-end tiers before implementation.
4. Build a static readable form before animation.
5. Add timing: anticipation, impact, expansion, decay, and residue.
6. Diagnose aliasing, overdraw, temporal instability, missing depth, and scene integration.
7. Validate at target resolution, motion speed, DPR, and mobile quality.

## Load focused references

- Noise, FBM, Voronoi, curl, and domain warping: [noise-domain-warping.md](references/noise-domain-warping.md)
- SDF composition and bounded raymarching: [sdf-raymarching.md](references/sdf-raymarching.md)
- Water, Gerstner waves, foam, and caustics: [water-ocean-caustics.md](references/water-ocean-caustics.md)
- Sky, atmosphere, aerial perspective, fog, clouds, smoke, and fire: [atmosphere-volumetrics.md](references/atmosphere-volumetrics.md)
- Derivatives, blue noise, TAA concepts, AO/SSR/SSGI, and temporal failure: [temporal-screen-space.md](references/temporal-screen-space.md)
- Particles, trails, ribbons, flipbooks, decals, shockwaves, and distortion: [particles-trails-impact-vfx.md](references/particles-trails-impact-vfx.md)
- VFX quality and readability gate: [vfx-rubric.md](references/vfx-rubric.md)

Runnable references:

- [Shader noise lab](examples/shader-noise-lab/index.html)
- [Impact VFX system](examples/impact-vfx-system/index.html)

## Guardrails

- Do not introduce a deferred renderer merely to obtain one effect.
- Do not stack AO, SSR, SSGI, TAA, and motion blur without an explicit budget and signal dependency.
- Use screen-space effects with fallbacks for missing offscreen information.
- Use stochastic rendering only with a stability strategy.
- Preserve focal hierarchy; more particles and bloom usually reduce readability.
