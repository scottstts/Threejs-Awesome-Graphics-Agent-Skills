---
name: threejs-skill-router
description: Route ambitious Three.js graphics work to atomic procedural-rendering skills. Use for new visual experiences, graphics rewrites, reference matching, or requests spanning procedural geometry, shaders, atmosphere, shadows, temporal effects, and final image treatment.
---

# Three.js Visual Skill Router

Treat the model's Three.js knowledge and official documentation as prerequisites. Load only the expertise that changes the visual result.

## Route by the visual system being authored

| Required result | Load |
| --- | --- |
| reusable scalar/vector fields, domain warping, causal masks, procedural normals | `$threejs-procedural-fields` |
| layered PBR identity, wear, wetness, derivative filtering, specular AA | `$threejs-procedural-materials` |
| profile sweeps, rails, frames, semantic mesh writers, UV density, mesh LOD | `$threejs-procedural-geometry` |
| trees, branching organisms, roots, foliage, wind deformation | `$threejs-procedural-vegetation` |
| buildings, façade grammars, profiles, ornaments, modular mesh writers | `$threejs-procedural-architecture` |
| planets, terrain, craters, biome fields, coastlines, spherical detail | `$threejs-procedural-planets` |
| sky scattering, planetary shells, depth-based aerial perspective | `$threejs-atmosphere-aerial-perspective` |
| weather-driven raymarched clouds and cloud shadows | `$threejs-volumetric-clouds` |
| FFT oceans, spectral cascades, choppy derivatives, Jacobian whitecaps | `$threejs-spectral-ocean` |
| bounded analytic waves, depth absorption, Fresnel, refraction, shore/wake foam | `$threejs-water-optics` |
| curved-ray black holes, accretion disks, wormholes | `$threejs-raymarched-space-effects` |
| particles, trails, plasma, shockwaves, layered event effects | `$threejs-procedural-vfx` |
| holograms, dissolves, scans, glitch bands, materialization | `$threejs-stylized-shader-transitions` |
| accumulated frost, wetness, paint, footprints, trails, reveal masks | `$threejs-temporal-surfaces` |
| stable large-world shadows, cascades, clipmaps, cached updates | `$threejs-shadow-systems` |
| GTAO, bent normals, bilateral reconstruction | `$threejs-screen-space-ambient-occlusion` |
| HDR bloom and selective emission contribution | `$threejs-bloom` |
| eye adaptation, tone mapping, LUT grading, output color | `$threejs-exposure-color-grading` |
| shared depth/normal/velocity ownership and multi-pass ordering | `$threejs-image-pipeline` |
| fixed-view diagnostics, seed sweeps, temporal and budget evidence | `$threejs-visual-validation` |

## Execution order

For a new procedural scene:

1. Define a visual contract: subject, scale, camera distance, motion, and target frame budget.
2. Load the subject-generation skill.
3. Add `$threejs-procedural-fields` when multiple visual channels must share coherent structure.
4. Add lighting/shadows and atmosphere only after silhouette and material masks read without effects.
5. Add `$threejs-image-pipeline` last.
6. Load only the atomic image effects actually needed.
7. Use `$threejs-visual-validation` for a deterministic evidence set.

## Routing constraints

- Do not load a skill for API setup alone. Inspect the installed Three.js version and use official docs.
- Do not route “make it beautiful” directly to post-processing. Find the missing authored system.
- Prefer one strong, inspectable visual rule over several independent noise layers.
- When adapting a supplied reference, preserve the mechanism that creates its character. Do not reduce it to a generic effect category.
- Keep source-space, world-space, and screen-space systems separate unless the composition explicitly requires coupling.

## Acceptance gate

A routed task is incomplete until the implementation exposes:

- deterministic seed or reproducible inputs;
- visual debug modes for its controlling fields;
- parameters grouped by perceptual role;
- a lower-cost fallback;
- a no-post baseline that still reads.
