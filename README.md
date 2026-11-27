# Three.js Awesome Graphics Agent Skills

[![GitHub stars](https://img.shields.io/github/stars/scottstts/Threejs-Awesome-Graphics-Agent-Skills?style=flat)](https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills/stargazers)
[![npm version](https://img.shields.io/npm/v/threejs-awesome-graphics-agent-skills?style=flat)](https://www.npmjs.com/package/threejs-awesome-graphics-agent-skills)
[![npm downloads](https://img.shields.io/npm/dm/threejs-awesome-graphics-agent-skills?style=flat)](https://www.npmjs.com/package/threejs-awesome-graphics-agent-skills)
![three.js](https://img.shields.io/badge/three.js-agent%20skills-blue?style=flat)
![Codex](https://img.shields.io/badge/Codex-compatible-purple?style=flat)
![Claude Code](https://img.shields.io/badge/Claude%20Code-compatible-orange?style=flat)
![Cursor](https://img.shields.io/badge/Cursor-compatible-blue?style=flat)

![Example Library](assets/example_gallery.jpeg)
***Example gallery to visually inspect included examples***

This is a Three.js agent skills pack for producing awesome graphics.

It includes mesh design, lighting, PBR materials, textures, shaders, TSL/WebGPU, GLSL, post-processing, realism, stylization, particles, procedural visuals, color management, tone mapping, etc. Graphics excellence is the **main focus** of this skill pack, with sophisticated design aesthetics, philosophy, ergonomics, sensibility, taste. It brings the sophistication of good graphics and eliminates cheap hacks.

This is NOT a three.js API cheat sheet, it skips basic 3D production fundamentals and concepts (any decent LLM already has that internal knowledge) as well as three.js API technicalities (just look up docs or use existing API oriented agent skills). Fundamentally, you cannot just prompt the agent for "good graphics" and expect the agent to produce it. The agent needs to see the exact implementation of said good graphics. That's what this skill pack aims to provide, the **vocabulary** of sophisticated graphics implementations. It's a skill pack with an attached example library to teach the agent not just what to do but also exactly how to do it.

This skill pack will be continuously updated as more three.js projects with awesome graphics emerge. I hope it can help everyone build awesome scenes and games with out-of-the-box sophisticated graphics, so you can focus on things like game logic and story.

![One example: spectral ocean](assets/spectral_ocean.jpeg)
***E.g., A realistic ocean such as this would have taken hours if not days to create and finetune, now it's out of the box***

## Operating model

Every graphics system is expected to expose:

- deterministic or reproducible inputs;
- named controlling fields and perceptual parameters;
- diagnostic outputs;
- scale, distance, and temporal stability rules;
- an intentional mechanism-backed quality or resolution tier when the system defines one;
- a no-post baseline that still reads.

## Skills

| Skill | Expertise |
| --- | --- |
| `threejs-skill-router` | Decompose a visual target into the smallest relevant expert systems. |
| `threejs-reference-reading` | Decode visual references into physical identities, construction methods, light evidence, style-decides-method rules, misreading prevention, and open design. |
| `threejs-camera-direction` | Pinhole camera solving and real-world scale cues, authored lenses and shots, chase/side/orbit rigs, body-relative frames, handoffs, pointer look, floating origins. |
| `threejs-procedural-animation` | Analytic timelines, gravity turns, staging, rotating-frame docking, springs, quaternion alignment, debris motion. |
| `threejs-procedural-fields` | Shared scalar/vector fields, frequency bands, domain warping, causal masks, procedural normals. |
| `threejs-procedural-materials` | Simulated paper burning, luminescent jellyfish tissue and appendages, articulated luminescent butterfly scales and wing illumination; physical PBR albedo/metal/roughness ranges, scan measurement, TSL triplanar whiteout normals, derived maps for basecolor-only models; hybrid texture-backed PBR soil/moss with procedural displacement and masks, atlas filtering, specular AA, planetary materials, terrain wetness, deformable granular sand with mass-coupled grain shading, simulated tearable denim with implicit yarn mechanics and frayed fibres, lava/emissive surfaces, raytraced diamond/gem refraction, physics-based diffraction grating, dispersive glass transmission, softbody jelly materials with refractive caustics, frame PBR, per-instance dissolve. |
| `threejs-parallax-occlusion-mapping` | TSL height marching, clipped flat and curved silhouettes, inflated relief shells, self-shadowing, relief-aware shadow depth. |
| `threejs-procedural-geometry` | Polygon modeling, loft/revolve/sweep/solidify/bevel, smooth-shading crease rules, pixel-footprint detail sizing, crafted assemblies, semantic joins, faceting/support/clearance/coplanar mesh and scene defect audits. |
| `threejs-procedural-vegetation` | Growth hierarchies, multi-species botanical archetypes, surface-following ivy, stylized and GPU-computed grass, culled procedural flower field, area-conserving structural LOD, branch-ring geometry, foliage normals, solid-clearance pruning, rooted wind. |
| `threejs-procedural-architecture` | Massing and façade grammars, full-thickness walls with through-openings, curved-wall trims, classical orders, arches/vaults/domes, junctions, carved versus applied relief, composed ornament (rinceau scrolls, acanthus, cartouches, coffers, height-field carving), exposed-edge analysis, modules, material-slot compilation. |
| `threejs-terrain-and-landscapes` | Non-orbital terrain, geological rock and cliffs, height-matched displacement, dunes, slope-driven snow, terraces and foundations, near-to-horizon distance layers, backlit and front-lit far mountain ranges. |
| `threejs-procedural-planets` | Spherical terrain, ridges, craters, biomes, procedural normals, altitude filtering. |
| `threejs-spectral-ocean` | Validated FFT synthesis, 3-cause horizon-barcode immunity, slope-integrated sky and planar mirror reflections, Cox–Munk roughness hand-off, finite-volume ocean beach waves with wet sand and impact spray, breaking-wave volumetric life cycles, hybrid FFT/Gerstner water, stylized above/below optics, submerged Snell windows, total internal reflection, aquatic perspective, caustic god rays, spectral cascades, choppy derivatives, Jacobian foam, ocean shading. |
| `threejs-water-optics` | Luminescent shallow-water river flow, foam and RGB caustics; photoreal shallow-water FFT optics, dispersive caustics and diffraction glare; shared analytic waves/normals, bounded pool heightfields, guard-band refraction, shadowed caustics, fountains, object ripples, refraction, absorption, reflection. |
| `threejs-precipitation-surfaces` | Falling snow and rain coupled to accumulation, snow caps, wet puddles, ripple normals, splashes, and shared weather envelopes. |
| `threejs-atmosphere-aerial-perspective` | Shared Rayleigh/Mie atmosphere, built sky and sun aureole, shell/post handoff, depth-based scattering, veil auditing, world-space participating media (god rays, mist, fog banks). |
| `threejs-volumetric-clouds` | Weather-shaped density, bounded raymarching, spherical-shell march planning, cloud lighting, amortisation safeguards, history, cloud shadows. |
| `threejs-raymarched-space-effects` | Curved-ray and null-geodesic integration, black holes, accretion disks, traversable wormhole throats with transported observer frames, footprint-filtered lensed celestial spheres and star fields, bounded quality. |
| `threejs-procedural-vfx` | Finite-footprint raymarched aurora curtains, uniform emissive-volume integration, filmic lens flare, WebGPU voxel fire and smoke, coupled fluid fields, mesh emitters, SDF collisions, reentry shells/wakes, sparks, dissolving debris, dense pools, HDR hierarchy. |
| `threejs-temporal-surfaces` | Persistent touch history, frost composite, wet-window droplets, background refraction, and blur. |
| `threejs-temporal-stability` | Whole-renderer frame-to-frame stability, MSAA and specular AA vs TAA, stochastic and amortised pass contracts, full-quality still paths, 15–20% guard bands, update-rate parity, motion bisection. |
| `threejs-lighting-and-gi` | Single-sun alignment, physical clear-sky sun-to-sky ratios, sun-stripped HDRI fill, practical and emissive illumination, character lighting, GPU-baked irradiance probe grids (`LightProbeGrid`), planar and cube-probe reflections. |
| `threejs-shadow-systems` | Stable cascades (`CSMShadowNode`) and cached clipmap shadows with tight depth-range bias, static vs dynamic update budgets, matte test-plane isolation, and invalidation. |
| `threejs-screen-space-ambient-occlusion` | Native WebGPU/TSL `GTAONode` + `builtinAOContext` indirect-only AO, horizon-barcode masking and far fade, horizon sampling, bent normals, bilateral reconstruction. |
| `threejs-bloom` | HDR extraction, veiling glare calibration, multi-scale filtering, selective contribution, off-screen pop and sprite-depth safeguards, exposure coupling. |
| `threejs-exposure-color-grading` | `AgX`/`ACES`/`Neutral` tone mapping, `RenderPipeline.outputColorTransform` ownership, scene-referred contrast, TSL gamut-limited class-aware saturation, encoded luminance metering, asymmetric adaptation, 3D LUT, subtle lens and sensor traits. |
| `threejs-image-pipeline` | Shared render-signal ownership, modern `RenderPipeline` ordering, guard bands, and veil auditing across multiple image-space systems. |
| `threejs-visual-validation` | Fixed-view diagnostics, per-layer isolation and gap attribution, quantitative region/local-contrast/glow/barcode metrics, sub-pixel flicker sweeps, single-sided clay checks, seed sweeps, cost-by-redesign and GPU evidence. |

## Install

```sh
# global installation
npx threejs-awesome-graphics-agent-skills@latest install --agent codex
npx threejs-awesome-graphics-agent-skills@latest install --agent claude-code
npx threejs-awesome-graphics-agent-skills@latest install --agent cursor

# Project installation
npx threejs-awesome-graphics-agent-skills@latest install --agent github-copilot --scope project

# Any custom-built agent
npx threejs-awesome-graphics-agent-skills@latest install --agent custom --path designated-agent-skills-dir

# Force a reinstall of the exact currently installed version
npx threejs-awesome-graphics-agent-skills@latest install --agent antigravity --force

# To uninstall it
npx threejs-awesome-graphics-agent-skills uninstall --agent codex
```

Supported targets:

| Target | User scope | Project scope |
| --- | --- | --- |
| `universal` | `~/.agents/skills` | `.agents/skills` |
| `grok` | `~/.grok/skills` | `.grok/skills` |
| `codex` | `~/.codex/skills` | `.codex/skills` |
| `claude-code` | `~/.claude/skills` | `.claude/skills` |
| `cursor` | `~/.cursor/skills` | `.cursor/skills` |
| `github-copilot` | `~/.copilot/skills` | `.github/skills` |
| `antigravity` | `~/.gemini/config/skills` | `.agents/skills` |
| `devin` | `~/.config/devin/skills` | `.devin/skills` |
| `hermes-agent` | `~/.hermes/skills` | `.hermes/skills` |
| `openclaw` | `~/.openclaw/skills` | `skills` |
| `muse-code` | `~/.config/muse/skills` | `.agents/skills` |
| `custom` | exact `--path` | exact `--path` |

## Development

```sh
npm run validate
npm test
npm run check:freshness
npm pack --dry-run
```

Generate deterministic captures and a contact sheet:

```sh
npm run capture:examples
```

Inspect every included graphics example from one development surface:

```sh
npm run dev
```

The gallery is meant for visual inspection of each example included in the 
skill pack. The skills only include the implementation and assets for the example itself 
respectively, while scene setup, camera rig, supporting implementation, supporting assets are owned 
by the gallery dev shim only.

This split is intentional:

- The agent using this skill only needs the implementation and the assets for the example itself
- The gallery is for viewing purpose, the agent doesn't need to know that scene setup

The gallery contract is documented in
[`example-gallery/README.md`](example-gallery/README.md).
