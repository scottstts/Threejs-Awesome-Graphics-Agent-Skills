---
name: threejs-skill-router
description: Route ambitious Three.js graphics work to the smallest expert skill set. Use for new visual experiences, graphics rewrites, reference matching, or requests spanning geometry, materials, atmosphere, shadows, temporal effects, and final image treatment.
---

# Three.js Visual Skill Router

Treat the model's Three.js knowledge and official documentation as prerequisites. Load only the expertise that changes the visual result.

## Route by the visual system being authored

| Required result | Load |
| --- | --- |
| shot composition, chase/side/orbit rigs, camera handoffs, projection ownership, pointer look, floating origins | `$threejs-camera-direction` |
| launch and docking timelines, procedural transform phases, springs, staging, rotating-frame alignment, debris motion | `$threejs-procedural-animation` |
| reusable scalar/vector fields, domain warping, causal masks, procedural normals | `$threejs-procedural-fields` |
| atlas-filtered blocks, planetary surfaces, terrain wetness, lava/emissive procedural surfaces, authored frame PBR, specular AA | `$threejs-procedural-materials` |
| sculpted rails/frames, branch rings, semantic mesh writers, material groups | `$threejs-procedural-geometry` |
| trees, stylized grass, branching organisms, roots, foliage, rooted wind deformation | `$threejs-procedural-vegetation` |
| buildings, façade grammars, profiles, ornaments, modular mesh writers | `$threejs-procedural-architecture` |
| planets, terrain, craters, biome fields, coastlines, spherical detail | `$threejs-procedural-planets` |
| sky scattering, planetary shells, depth-based aerial perspective | `$threejs-atmosphere-aerial-perspective` |
| weather-driven raymarched clouds and cloud shadows | `$threejs-volumetric-clouds` |
| FFT oceans, hybrid FFT/Gerstner clear water, stylized above/below ocean optics, spectral cascades, choppy derivatives, Jacobian whitecaps | `$threejs-spectral-ocean` |
| authored analytic waves, bounded heightfield pools, object ripples, differential-area caustics, ray-traced pool volume optics, shared normals, heuristic refraction, fallback absorption, crest foam | `$threejs-water-optics` |
| curved-ray black holes, accretion disks, wormholes | `$threejs-raymarched-space-effects` |
| particles, trails, plasma, shockwaves, layered event effects | `$threejs-procedural-vfx` |
| accumulated screen frost, touch clearing, reduced blur, and refraction masks | `$threejs-temporal-surfaces` |
| stable large-world shadows, cascades, clipmaps, cached updates | `$threejs-shadow-systems` |
| GTAO, bent normals, bilateral reconstruction | `$threejs-screen-space-ambient-occlusion` |
| HDR bloom and selective emission contribution | `$threejs-bloom` |
| eye adaptation, tone mapping, LUT grading, output color | `$threejs-exposure-color-grading` |
| shared depth/normal/velocity ownership and multi-pass ordering | `$threejs-image-pipeline` |
| fixed-view diagnostics, seed sweeps, temporal and budget evidence | `$threejs-visual-validation` |

## Execution order

For a new procedural scene:

1. Define a visual contract: subject, scale, camera distance, motion, and target frame budget.
2. Load `$threejs-camera-direction` when framing, lens, camera frame, or mode transitions affect the target.
3. Load the subject-generation skill.
4. Add `$threejs-procedural-animation` when object motion requires authored phases, moving frames, or spring convergence.
5. Add `$threejs-procedural-fields` when multiple visual channels must share coherent structure.
6. Add lighting/shadows and atmosphere only after silhouette and material masks read without effects.
7. Add `$threejs-image-pipeline` last.
8. Load only the atomic image effects actually needed.
9. Use `$threejs-visual-validation` for a deterministic evidence set.

## Routing constraints

- Do not load a skill for API setup alone. Inspect the installed Three.js version and use official docs.
- Do not route “make it beautiful” directly to post-processing. Find the missing authored system.
- Prefer one strong, inspectable visual rule over several independent noise layers.
- When adapting a supplied reference, preserve the mechanism that creates its character. Do not reduce it to a generic effect category.
- Keep source-space, world-space, and screen-space systems separate unless the composition explicitly requires coupling.
- If no retained skill matches, state that the pack lacks expert coverage for that system. Do not stretch the nearest skill to cover it.

## Acceptance gate

A routed task is incomplete until the implementation exposes:

- deterministic seed or reproducible inputs;
- visual debug modes for its controlling fields;
- parameters grouped by perceptual role;
- an intentional mechanism-backed quality or resolution tier when the system defines one;
- a no-post baseline that still reads.
