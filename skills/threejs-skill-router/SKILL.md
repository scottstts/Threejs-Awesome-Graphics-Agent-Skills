---
name: threejs-skill-router
description: Route ambitious Three.js graphics work to the smallest expert skill set. Use for new visual experiences, graphics rewrites, reference matching, or requests spanning geometry, materials, atmosphere, shadows, temporal effects, and final image treatment.
---

# Three.js Visual Skill Router

Treat the model's Three.js knowledge and official documentation as prerequisites. Load only the expertise that changes the visual result.

This pack goes beyond procedural guidance: its working examples and supporting
assets contain much of its practical implementation value. When they are
relevant, give them particular attention.

## Route by the visual system being authored

| Required result | Load |
| --- | --- |
| decoding a visual reference into physical element identities, construction methods, light evidence, style-decides-method rules, misreading prevention, open design for silent or off-frame areas | `$threejs-reference-reading` |
| pinhole camera solving from image cues (FOV, pitch, roll, eye height, back-projected landmarks, real-world scale cues), level true-shaped layout, shot composition, chase/side/orbit rigs, camera handoffs, projection ownership, pointer look, floating origins | `$threejs-camera-direction` |
| launch and docking timelines, procedural transform phases, springs, staging, rotating-frame alignment, debris motion | `$threejs-procedural-animation` |
| reusable scalar/vector fields, domain warping, causal masks, procedural normals | `$threejs-procedural-fields` |
| simulated paper burning with coupled sheet combustion and pyro fluids, luminescent jellyfish with simulated appendages and layered tissue optics, luminescent butterflies with articulated scale glints and finite wing emitters, physical PBR albedo/metal/roughness ranges, scan measurement, TSL triplanar whiteout normals, multi-scale tiling breakup, derived shader maps for basecolor-only models, atlas-filtered blocks, planetary surfaces, hybrid texture-backed PBR soil/moss with procedural displacement and masks, ground and model moss accumulation, terrain wetness, deformable granular sand with mass-coupled grain shading, simulated tearable denim with implicit yarn mechanics and frayed fibres, woven cloth with GPU XPBD and yarn microstructure, simulated fur with interactive grooming and strand shading, lava/emissive surfaces, reflective wave-optical diffraction gratings, thin-film soap bubbles with Airy interference, raytraced diamond/gem refraction, dispersive glass transmission with internal reflection and volume absorption, deforming softbody jelly materials with XPBD mechanics and refractive caustics, authored frame PBR, specular AA | `$threejs-procedural-materials` |
| height-field ray marching, silhouette-aware POM, curved relief shells, relief self-shadowing | `$threejs-parallax-occlusion-mapping` |
| well-crafted and complete hard-surface object assemblies, procedural vehicles and humanoid robots, parameter-curve section tracks, tilted shell and spine lofts, pillow panels, exact polygon cuts, UV-owned apertures, spanwise airfoil lofts, sculpted rails/frames, branch rings, fin lofts, profile extrusion, inset, revolve, sweep, solidify, bevels and fillets, smooth-shading crease rules, pixel-footprint detail sizing, supplied-model placement/grounding, shell thickness, direct-topology apertures, semantic mesh writers, material slots and groups, primitive-built forms, coplanar flicker, faceting audit, support-chain audit, loose/non-manifold geometry, detached parts, interpenetration, support, clearance and swept-envelope defects | `$threejs-procedural-geometry` |
| trees, multi-species botanical archetypes, surface-following ivy, painted vines, stylized grass, GPU-computed grass, GPU-culled virtual flower fields, area-conserving structural LOD, distance-tiered plant geometry, roots, solid-clearance pruning, foliage, physical rooted wind deformation | `$threejs-procedural-vegetation` |
| buildings, façade grammars, full-thickness walls with through-openings, curved-wall trims, classical orders, recessed portals, pier-buttresses, spandrel roses, arches, vaults, domes, architectural junctions, carved versus applied relief, composed ornament (rinceau scrolls, acanthus, cartouches, coffers, height-field carving), profiles, ornaments, dual-LOD instanced architectural kits, modular mesh writers | `$threejs-procedural-architecture` |
| non-orbital terrain, geological rock and cliffs, height-matched rock displacement, scree and talus, sand dunes, slope-driven snow, terraces and foundations, eliminating ground voids and wall-foot rings, near-to-horizon distance layers, backlit and front-lit far mountain ranges | `$threejs-terrain-and-landscapes` |
| planets, spherical terrain, craters, biome fields, coastlines, spherical detail | `$threejs-procedural-planets` |
| sky scattering, built sky and sun aureole, planetary shells, depth-based aerial perspective, veil auditing, world-space participating media (shadowed god rays, mist banks, smoke) | `$threejs-atmosphere-aerial-perspective` |
| weather-driven raymarched clouds, spherical-shell march planning, amortisation safeguards, and cloud shadows | `$threejs-volumetric-clouds` |
| FFT oceans, 3-cause horizon-barcode elimination, slope-integrated sky and planar mirror reflections, Cox-Munk roughness hand-off, coastal breaker transitions, breaking-wave volumetric life cycles, finite-volume shallow-water beach waves, signed-distance coastlines, shallow-water swash chains, wet sand, rock-impact spray, stylized above/below ocean optics, submerged Snell windows, total internal reflection, forward-refracted structures, pixel-footprint spectral LOD, aquatic perspective, caustic god rays, spectral cascades, choppy derivatives, Jacobian whitecaps | `$threejs-spectral-ocean` |
| luminescent shallow-water rivers with coupled flow, bioluminescent excitation, advected foam and RGB caustics, photoreal shallow water with gravity-capillary FFT waves, dispersive caustics and diffraction glare, authored analytic waves, bounded heightfield pools, guard-band refraction, shadowed caustics, fountains, object ripples, differential-area caustics, ray-traced pool volume optics, shared normals, heuristic refraction, fallback absorption, crest foam | `$threejs-water-optics` |
| falling snow, snow accumulation, model snow caps, wet asphalt puddles, procedural ripple normals, splash flipbooks, rain streaks, shared weather envelopes, surface wetness | `$threejs-precipitation-surfaces` |
| curved-ray black holes, accretion disks, wormholes and throat transits, null-geodesic integration, lensed celestial spheres and star fields | `$threejs-raymarched-space-effects` |
| filmic HDR lens-flare compositors, highlight-derived radial ghosts, field-angle pupil deformation, spectral pupil rings, localized glare and bloom, raymarched aurora curtains, finite-footprint emissive slabs, uniform volume integration, equirectangular radiance probes, WebGPU voxel fire and smoke, volumetric fluid fields, mesh-surface emitters, SDF fire collisions, ship-conforming reentry shells/wakes, particles, trails, plasma, shockwaves, sparks, dissolving debris, dense pools, holographic projections, Fresnel rim shells, scanline banding, HDR hierarchy | `$threejs-procedural-vfx` |
| accumulated screen frost, touch clearing, wet-window rain, view-aligned droplet refraction and blur | `$threejs-temporal-surfaces` |
| general frame-to-frame temporal stability, MSAA and specular AA versus TAA smear, stochastic and amortised pass contracts, full-quality still paths, 15-20% screen-space guard bands, update-rate parity, eliminating camera-following artifacts and wrap seams, motion bisection | `$threejs-temporal-stability` |
| single-sun alignment, physical clear-sky sun-to-sky ratios, sun-stripped HDRI fill, flat/overcast lighting diagnosis, practical and emissive fixtures lighting surroundings, character lighting, GPU-baked irradiance probe grids (LightProbeGrid GI), planar and cube-probe reflections | `$threejs-lighting-and-gi` |
| stable large-world shadows, CSMShadowNode cascades, cached clipmaps, tight depth-range bias and peter-panning fixes, static versus dynamic caster update budgets, matte test-plane isolation | `$threejs-shadow-systems` |
| GTAO, native WebGPU/TSL builtinAOContext indirect-only AO, horizon-barcode masking and far fade, bent normals, bilateral reconstruction | `$threejs-screen-space-ambient-occlusion` |
| HDR bloom, veiling glare calibration, selective emission contribution, off-screen pop prevention, sprite depth ownership | `$threejs-bloom` |
| AgX, ACES, and Neutral tone-mapper selection, RenderPipeline outputColorTransform ownership, scene-referred contrast, TSL gamut-limited class-aware saturation, eye adaptation, LUT grading, subtle photographic lens and sensor traits, output color | `$threejs-exposure-color-grading` |
| shared depth/normal/velocity ownership, RenderPipeline multi-pass ordering, guard-band coordination, veil auditing | `$threejs-image-pipeline` |
| fixed-view diagnostics, per-layer isolation and gap attribution, quantitative region/local-contrast/glow/horizon-barcode measurements, 0.3 px flicker sweeps, single-sided clay checks, seed sweeps, temporal and cost-by-redesign budget evidence | `$threejs-visual-validation` |

## Execution order

For a new procedural or reference-driven scene:

1. Define a visual contract — or load `$threejs-reference-reading` when building from a visual reference — to lock physical identities, construction methods, scale, style category, and frame budget.
2. Load `$threejs-camera-direction` when solving lens/landmarks from a reference or authoring framing, rigs, or camera handoffs.
3. Load the subject-generation skills (`$threejs-procedural-geometry`, `$threejs-procedural-architecture`, `$threejs-terrain-and-landscapes`, `$threejs-procedural-vegetation`, water/planets/VFX) and settle massing and junctions in **single-sided clay** before look work.
4. Add `$threejs-procedural-animation` when object motion requires authored phases, moving frames, or spring convergence, and `$threejs-procedural-fields` when multiple channels share coherent structure.
5. Add `$threejs-lighting-and-gi`, `$threejs-shadow-systems`, `$threejs-screen-space-ambient-occlusion`, and `$threejs-atmosphere-aerial-perspective` / `$threejs-volumetric-clouds` only after silhouette, clay proportions, and material masks read cleanly.
6. Add `$threejs-image-pipeline` and only the atomic post skills actually needed (`$threejs-bloom`, `$threejs-exposure-color-grading`) last.
7. Verify motion stability with `$threejs-temporal-stability` and close out with `$threejs-visual-validation` for deterministic, measured, per-layer evidence.

## Routing constraints

- Do not load a skill for API setup alone. Inspect the installed Three.js version and use official docs.
- Do not route “make it beautiful” directly to post-processing. Find the missing authored system and fix every gap at its owning layer.
- **Style decides method (anchor principle):** a stylized target alters shading, light, and grade, never geometry integrity or core physical representations; confine deliberate impossibilities so they survive orbit.
- **Cost by redesign:** when a feature exceeds budget, bake static transport, apply structural LOD, or use stable amortisation with a full-quality path — never slash quality across the board or swap in banned proxies.
- Prefer one strong, inspectable visual rule over several independent noise layers.
- When adapting a supplied reference, preserve the mechanism that creates its character. Do not reduce it to a generic effect category.
- Keep object-space, world-space, and screen-space systems separate unless the composition explicitly requires coupling.
- If no retained skill matches, state that the pack lacks expert coverage for that system. Do not stretch the nearest skill to cover it.

## Acceptance gate

A routed task is incomplete until the implementation exposes:

- deterministic seed or reproducible inputs;
- visual debug modes for its controlling fields;
- parameters grouped by perceptual role;
- an intentional mechanism-backed quality or resolution tier when the system defines one;
- a no-post baseline that still reads.
