# Source material ledger

This directory contains research inputs for the Three.js procedural-graphics skill pack. Downloaded repositories are ignored by Git. They are inspected as untrusted code and are not installed, executed, or distributed with the package.

The pack is an independent distillation of mechanisms and workflows.
Third-party code is not copied into distributed skills. Assets may be bundled
only when their license permits redistribution and their exact source revision,
hash, local path, and attribution are recorded. A source with unclear licensing
may inform conceptual analysis only.

Version-sensitive API syntax must be verified against the target project and official Three.js documentation. The research snapshot on June 19–20, 2026 observed `three@0.184.0`. This is evidence, not a package-wide minimum. Three.js `PostProcessing` was deprecated in r183 after being renamed to `RenderPipeline`; current implementations must verify the installed API.

## Distillation standard

A source is useful here only when it answers one or more of these:

- What representation makes the result controllable?
- Which fields, geometry stages, render targets, or passes are coupled?
- What invariant prevents the visual system from degrading?
- How is the expensive work bounded, cached, filtered, or reconstructed?
- Which debug output exposes failure?
- What lower-cost mode preserves the defining visual mechanism?

Generic setup, API inventories, and introductory tutorials are not skill content.

## Author-supplied projects

These projects were supplied by the author as reference implementations. The table records their Git remotes and reviewed revisions rather than local checkout paths. They are not copied into this repository.

| Project | Reviewed revision | Reviewed areas | Mechanisms distilled into |
| --- | --- | --- | --- |
| [scottstts/MyCraft](https://github.com/scottstts/MyCraft) | `7fdb3cee3d7d99b42ee47dd659b90a4f6a658074` | `BlockMaterial.ts`, `WaterSurfaceMaterial.ts`, custom shadow targets, composer and post passes | `$threejs-procedural-materials`, `$threejs-shadow-systems`, `$threejs-image-pipeline`, `$threejs-bloom`, `$threejs-screen-space-ambient-occlusion`; water retained as a bounded/analytic comparison |
| [scottstts/Stellar](https://github.com/scottstts/Stellar) | `ad8062b54ec86312d7c028d46727796eb802c9b2` | planetary field stack, crater/ridge/biome logic, procedural normals, atmosphere shell/post handoff, reentry plasma | `$threejs-procedural-planets`, `$threejs-procedural-fields`, `$threejs-atmosphere-aerial-perspective`, `$threejs-procedural-vfx` |
| [scottstts/Interstellar.three.js](https://github.com/scottstts/Interstellar.three.js) | `0c9c4635f9e0cbcb1598a2af8914c3086f8629a3` | wormhole integration, black-hole lensing/accretion, analytic ocean waves and normals | `$threejs-raymarched-space-effects`, `$threejs-water-optics` |
| [scottstts/mysite_React](https://github.com/scottstts/mysite_React) | `98bb4ad75561aaf7263dbc6c92e2d66268f69f43` | `ArtInLifeGallery.tsx`: sculpted frame/rail geometry, procedural metal texture, selective bloom, instanced chandelier and placeholders, shadow invalidation, adaptive DPR | `$threejs-procedural-geometry`, `$threejs-procedural-materials`, `$threejs-bloom`, `$threejs-visual-validation` |

### Local-project findings retained

- Shared procedural causes produce stronger materials than independent noise per channel.
- Geometry and normal evaluation must use the same wave or height function.
- Planet detail needs explicit macro/meso/detail bands and altitude filtering.
- Aerial perspective and sky-shell rendering must share one atmosphere parameter model.
- Thin raymarched structures need crossing tests rather than hoping a fixed step lands inside them.
- Selective bloom requires explicit contribution ownership and reliable restoration when material substitution is used.
- Adaptive quality needs observable decisions and reset rules, not an opaque frame-rate reaction.

## Supplied external repositories

Repositories were cloned shallowly under this directory for inspection.

| Source | Reviewed revision | License observed | Distribution boundary |
| --- | --- | --- | --- |
| [dgreenheck/ez-tree](https://github.com/dgreenheck/ez-tree) | `48dc193515135cff2b33515c47f0a8703b977e63` | MIT | independent implementation plus explicitly attributed MIT/CC0 demo assets |
| [takram-design-engineering/three-geospatial](https://github.com/takram-design-engineering/three-geospatial) | `b012ad06d858fc035d88aacfd73f092f93c994e4` | MIT | independent prose/pseudocode only |
| [perplexdotgg/mecs-tower-defense-example](https://codeberg.org/perplexdotgg/mecs-tower-defense-example) | `d7b4e8815fcee18d97e9a12c00f900294773ad1c` | MIT code; CC0 assets | independent prose/pseudocode only; no assets copied |
| [YasirAwan4831/holographic-shader-visualizer-three.Js](https://github.com/YasirAwan4831/holographic-shader-visualizer-three.Js) | `34810a6e09d0d640d06a2e83c5abab749baf04d5` | no root license observed | conceptual analysis only |
| [vibe-stack/procedural-bank](https://github.com/vibe-stack/procedural-bank) | `0034e80a61f02b88dbe13a385bdab734a365b82d` | MIT | independent prose/pseudocode only |
| [takuma-hmng8/frozen](https://github.com/takuma-hmng8/frozen) | `15a98a5104951a0bd734eb23ab21b7f79741ab09` | no root license observed | conceptual analysis only |
| [owenyuwono/poseidon](https://github.com/owenyuwono/poseidon) | `caddf773c7e2b7c9b00ad232d21cca4f364d5272` | no root license or package license observed | conceptual analysis only; no code copied |

### `ez-tree`

Reviewed:

- per-level species parameter tables;
- queue-based branch growth;
- oriented ring geometry and bark UV scale;
- taper, stochastic gnarliness, tropism, and trellis attraction;
- stratified longitudinal child placement with independently permuted angular slots;
- crossed leaf cards with canopy-oriented normals;
- leaf-root and meadow-root multi-frequency wind;
- deterministic seeds and geometry budgets.

Consumed by:

- `$threejs-procedural-vegetation`
- `$threejs-procedural-geometry`
- `$threejs-procedural-fields`
- `$threejs-visual-validation`

The key retained mechanism is structured variation. Randomness selects within species and placement constraints; it does not replace growth structure.

### `three-geospatial`

Reviewed:

- shared atmosphere parameters for Rayleigh, Mie, and absorption density profiles;
- precomputed transmittance/scattering lookup architecture;
- coupling between sky material and aerial-perspective effect;
- ellipsoid/ECEF transforms and altitude handling;
- weather/shape/detail/turbulence cloud textures;
- multiple bounded cloud layers and packed ray intervals;
- front-to-back volumetric integration, cloud lighting, temporal reconstruction, and cloud shadows;
- WebGPU temporal and screen-space effect organization.

Consumed by:

- `$threejs-atmosphere-aerial-perspective`
- `$threejs-volumetric-clouds`
- `$threejs-image-pipeline`
- `$threejs-visual-validation`

The key retained mechanism is system coupling: sky, surface haze, light transmittance, clouds, and cloud shadows use compatible coordinate and radiometric contracts.

### `procedural-bank`

Reviewed:

- settings-to-plan-to-mesh compilation;
- mass footprints, tiers, setbacks, courtyards, and twin towers;
- exposed-edge analysis before façade placement;
- semantic façade modules, profiles, arches, cornices, ornaments, and roofs;
- material-slot mesh writing and texture-density handling;
- stable cached clipmap shadows with texel snapping, guard bands, update budgets, and targeted invalidation;
- GTAO/bent-normal composition;
- bloom, exposure, LUT grading, and atmosphere ordering;
- small-target luminance metering and readback.

Consumed by:

- `$threejs-procedural-architecture`
- `$threejs-procedural-geometry`
- `$threejs-shadow-systems`
- `$threejs-screen-space-ambient-occlusion`
- `$threejs-bloom`
- `$threejs-exposure-color-grading`
- `$threejs-image-pipeline`

The key retained mechanism is explicit compilation and ownership: design plans, material groups, shadow levels, and post signals remain inspectable before final composition.

### `mecs-tower-defense-example`

Reviewed:

- pooled instanced meshes and sprites;
- per-instance shader attributes;
- TSL material composition;
- terrain wetness and effect fields;
- compact bloom contribution;
- ECS ownership of VFX lifetime and reuse.

Consumed by:

- `$threejs-procedural-vfx`
- `$threejs-procedural-materials`
- `$threejs-bloom`

The retained mechanism is data-oriented effect ownership and pooling. General ECS/gameplay material is outside this pack.

### `holographic-shader-visualizer-three.Js`

Reviewed conceptually:

- object/world-height transition bands;
- boundary-local glitch displacement;
- scanlines;
- Fresnel reinforcement;
- additive transparency and depth-write choices;
- shape transition timing.

Consumed by:

- `$threejs-stylized-shader-transitions`

No source code was copied because a repository license was not observed.

### `frozen`

Reviewed conceptually:

- root scene render followed by reduced-resolution separable blur;
- static procedural noise render targets;
- high-resolution frost composite;
- ping-pong interaction/history state;
- normal/refraction output;
- resize/reset/disposal boundaries.

Consumed by:

- `$threejs-temporal-surfaces`
- `$threejs-image-pipeline`

No source code was copied because a repository license was not observed.

### `poseidon`

Reviewed:

- Stockham/butterfly inverse FFT performed through WebGPU compute;
- validation of the FFT in isolation before coupling it to ocean simulation;
- three disjoint spectral cascades for roughly 250 m, 17 m, and 5 m spatial scales;
- Horvath/JONSWAP directional wind-sea and swell spectrum;
- TMA finite-depth correction, Donelan–Banner directional spreading, and short-wave fade;
- choppy horizontal displacement reconstructed from spectral derivatives;
- slope FFTs and fold-aware normal handling;
- displacement-Jacobian whitecap detection with temporal foam build and decay;
- Fresnel sky reflection, reflected-sun glitter, subsurface scatter, depth color, and sub-grid detail;
- optional GPU ballistic spray driven from energetic crests.

Consumed by:

- `$threejs-spectral-ocean`
- `$threejs-procedural-fields`
- `$threejs-temporal-surfaces`
- `$threejs-procedural-vfx`
- `$threejs-visual-validation`

Poseidon defines the spectral-ocean skill's upper mechanism target. MyCraft
and Interstellar remain useful for the separate analytic/bounded-water skill;
they do not define the spectral skill's quality bound.

No source code was copied because a repository license was not observed. Poseidon's README credits `gasgiant/FFT-Ocean` under MIT for adapted spectrum/FFT techniques; that credit does not establish a license for Poseidon's own repository.

## Focused technical references

These references support mathematical or rendering claims that are not specific to one inspected project:

- [Official Three.js documentation](https://threejs.org/docs/) — version-specific API verification.
- [Official Three.js TSL documentation](https://threejs.org/docs/pages/TSL.html) — current node/shader surface verification.
- [Three.js RenderPipeline documentation](https://threejs.org/docs/pages/RenderPipeline.html) — current post-pipeline API verification.
- [Three.js color management manual](https://threejs.org/manual/en/color-management.html) — color-space and output-conversion verification.
- [Filament rendering notes](https://google.github.io/filament/main/filament.html) — PBR, exposure, and material-response grounding.
- [Disney Physically-Based Shading](https://disneyanimation.com/publications/physically-based-shading-at-disney/) — artist-facing material parameter reasoning.
- [GPU Gems: Effective Water Simulation](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) — analytic wave derivatives and frequency decomposition.
- [GPU Gems 2: Accurate Atmospheric Scattering](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering) — scattering and optical-depth integration.
- [Eric Bruneton: Precomputed Atmospheric Scattering](https://ebruneton.github.io/precomputed_atmospheric_scattering/) — atmosphere lookup architecture.
- [Inigo Quilez articles](https://iquilezles.org/articles/) — SDF, noise, and domain-warping mathematics.
- [Scalar Spatiotemporal Blue Noise Masks](https://arxiv.org/abs/2112.09629) — stable stochastic sampling.
- [Playdead temporal reprojection](https://github.com/playdeadgames/temporal) — history reprojection and neighborhood constraints.
- [OpenAI Codex Agent Skills](https://developers.openai.com/codex/skills) — packaging shape and progressive disclosure.

These sources are paraphrased. Official documentation remains the authority for installed API behavior.

## Pack consumption map

| Skill | Primary distilled evidence |
| --- | --- |
| `$threejs-skill-router` | repeated decomposition patterns across all reviewed systems |
| `$threejs-procedural-fields` | Stellar, MyCraft, `ez-tree`, field mathematics |
| `$threejs-procedural-materials` | MyCraft, Stellar, `mecs-tower-defense-example`, PBR references |
| `$threejs-procedural-geometry` | ArtInLife, `ez-tree`, `procedural-bank` |
| `$threejs-procedural-vegetation` | `ez-tree` |
| `$threejs-procedural-architecture` | `procedural-bank` |
| `$threejs-procedural-planets` | Stellar |
| `$threejs-spectral-ocean` | `poseidon` as primary conceptual evidence; directional-spectrum and FFT literature |
| `$threejs-water-optics` | MyCraft and Interstellar.three.js analytic/optical comparisons; GPU Gems |
| `$threejs-atmosphere-aerial-perspective` | Stellar, `three-geospatial`, atmosphere references |
| `$threejs-volumetric-clouds` | `three-geospatial` |
| `$threejs-raymarched-space-effects` | interstellarThreeJS |
| `$threejs-procedural-vfx` | Stellar, `mecs-tower-defense-example` |
| `$threejs-stylized-shader-transitions` | holographic visualizer, conceptual only |
| `$threejs-temporal-surfaces` | `frozen`, conceptual only |
| `$threejs-shadow-systems` | MyCraft, `procedural-bank` |
| `$threejs-screen-space-ambient-occlusion` | MyCraft, `procedural-bank`, `three-geospatial` |
| `$threejs-bloom` | ArtInLife, MyCraft, `procedural-bank`, `mecs-tower-defense-example` |
| `$threejs-exposure-color-grading` | `procedural-bank`, color references |
| `$threejs-image-pipeline` | MyCraft, ArtInLife, `procedural-bank`, `three-geospatial`, `frozen` |
| `$threejs-visual-validation` | failure modes and quality controls observed across all sources |

## Scope boundaries

- The pack does not teach basic Three.js setup or repeat API documentation.
- It does not provide a general game-engine, ECS, physics, UI, audio, or gameplay curriculum.
- External assets are relevant only when they support an authored procedural composition.
- WebGL, WebGPU, GLSL, and TSL syntax remain version-sensitive implementation surfaces. Skills specify the mechanism and invariants; agents must inspect the target renderer before choosing exact APIs.
