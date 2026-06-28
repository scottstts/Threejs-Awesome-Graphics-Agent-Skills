# Source material ledger

This directory contains research inputs for Three.js Awesome Graphics Agent
Skills. Downloaded repositories are ignored by Git and inspected as untrusted
code. A reference checkout may install its own locked dependencies and run
inside its directory for code and visual verification. Reference packages are
never added to this project's dependencies or distributed with the package.

The pack is an independent distillation of mechanisms and workflows. Reference
code and assets may be copied into distributed skills only when the source is
accepted as MIT-compatible for this project and its exact source revision, hash,
local path, and attribution are recorded.

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

These projects were supplied by the author as reference implementations. The
table records their Git remotes and reviewed revisions rather than local
checkout paths. Source code is independently distilled; explicitly traced
author-supplied texture assets may be bundled when an accepted example needs
the original material or shader input.

| Project | Reviewed revision | Reviewed areas | Mechanisms distilled into |
| --- | --- | --- | --- |
| [scottstts/MyCraft](https://github.com/scottstts/MyCraft) | `7fdb3cee3d7d99b42ee47dd659b90a4f6a658074` | `BlockMaterial.ts`, `WaterSurfaceMaterial.ts`, custom shadow targets, composer and post passes | `$threejs-procedural-materials`, `$threejs-shadow-systems`, `$threejs-image-pipeline`, `$threejs-bloom`, `$threejs-screen-space-ambient-occlusion`; water retained as a bounded/analytic comparison |
| [scottstts/Stellar](https://github.com/scottstts/Stellar) | `ad8062b54ec86312d7c028d46727796eb802c9b2` | planetary field stack, crater/ridge/biome logic, procedural normals, atmosphere shell/post handoff, reentry plasma, dimension-scaled chase/side/orbit camera rigs, body-relative frames, bounded second-order camera response, launch/orbit handoffs, ship orientation control | `$threejs-procedural-planets`, `$threejs-procedural-fields`, `$threejs-atmosphere-aerial-perspective`, `$threejs-procedural-vfx`, `$threejs-camera-direction`, `$threejs-procedural-animation` |
| [scottstts/Interstellar.three.js](https://github.com/scottstts/Interstellar.three.js) | `0c9c4635f9e0cbcb1598a2af8914c3086f8629a3` | wormhole integration, black-hole lensing/accretion and `noise_deep.png`, analytic ocean waves and normals, scene-owned lenses, pointer look, floating-origin framing, launch kinematics, staging, spin docking, spring convergence, rotating-frame debris | `$threejs-raymarched-space-effects`, `$threejs-water-optics`, `$threejs-camera-direction`, `$threejs-procedural-animation` |
| [scottstts/mysite_React](https://github.com/scottstts/mysite_React) | `98bb4ad75561aaf7263dbc6c92e2d66268f69f43` | `ArtInLifeGallery.tsx`: sculpted frame/rail geometry, procedural metal texture, selective bloom, instanced chandelier and placeholders, shadow invalidation, adaptive DPR | `$threejs-procedural-geometry`, `$threejs-procedural-materials`, `$threejs-bloom`, `$threejs-visual-validation` |

### Local-project findings retained

- Shared procedural causes produce stronger materials than independent noise per channel.
- Geometry and normal evaluation must use the same wave or height function.
- Planet detail needs explicit macro/meso/detail bands and altitude filtering.
- Aerial perspective and sky-shell rendering must share one atmosphere parameter model.
- Thin raymarched structures need crossing tests rather than hoping a fixed step lands inside them.
- Selective bloom requires explicit contribution ownership and reliable restoration when material substitution is used.
- Adaptive quality needs observable decisions and reset rules, not an opaque frame-rate reaction.
- Camera offsets should scale from subject dimensions and be evaluated in the subject or dominant-body frame.
- A camera handoff needs one interpolation owner; stacked transition and follow smoothing creates a visible half-halt.
- Authored motion should separate analytic travel phases, spring convergence, exact terminal poses, and secondary motion.
- Rotating-frame docking is stable when axial/radial error, alignment, and spin are solved independently.

## Supplied external repositories

Repositories were cloned shallowly under this directory for inspection.

| Source | Reviewed revision | License observed | Distribution boundary |
| --- | --- | --- | --- |
| [dgreenheck/ez-tree](https://github.com/dgreenheck/ez-tree) | `48dc193515135cff2b33515c47f0a8703b977e63` | MIT | independent implementation plus explicitly attributed MIT/CC0 demo assets |
| [takram-design-engineering/three-geospatial](https://github.com/takram-design-engineering/three-geospatial) | `b012ad06d858fc035d88aacfd73f092f93c994e4` | MIT | independent prose/pseudocode only |
| [jeantimex/geospatial](https://github.com/jeantimex/geospatial) | `d166316ad38f9a21f6d7a3293b808bc7f920283e` | MIT | independent implementation plus dev-only LUT, weather, volume, turbulence, and blue-noise assets |
| [perplexdotgg/mecs-tower-defense-example](https://codeberg.org/perplexdotgg/mecs-tower-defense-example) | `d7b4e8815fcee18d97e9a12c00f900294773ad1c` | MIT code; CC0 assets | independent prose/pseudocode only; no assets copied |
| [YasirAwan4831/holographic-shader-visualizer-three.Js](https://github.com/YasirAwan4831/holographic-shader-visualizer-three.Js) | `34810a6e09d0d640d06a2e83c5abab749baf04d5` | MIT by project rule | conceptual analysis only |
| [vibe-stack/procedural-bank](https://github.com/vibe-stack/procedural-bank) | `0034e80a61f02b88dbe13a385bdab734a365b82d` | MIT | independent implementation plus attributed MIT stone textures |
| [takuma-hmng8/frozen](https://github.com/takuma-hmng8/frozen) | `15a98a5104951a0bd734eb23ab21b7f79741ab09` | MIT by project rule | conceptual analysis only |
| [owenyuwono/poseidon](https://github.com/owenyuwono/poseidon) | `caddf773c7e2b7c9b00ad232d21cca4f364d5272` | MIT by project rule | conceptual analysis only; no code copied |
| [gioeledallapozza/FFTOCEAN](https://github.com/gioeledallapozza/FFTOCEAN) | `0fe3a908a86118eab9930e17b0b29df7fcc05b65` | MIT-compatible author-supplied reference | copied/adapted stylized ocean shader mechanisms plus foam and sand assets for `$threejs-spectral-ocean` |
| [jeantimex/threejs-water](https://github.com/jeantimex/threejs-water) | `d5c06864fe22ad31f500af7f21a46aad1c7d3e27` | MIT | copied/adapted water simulation, pool caustics, pool/water/sphere shader mechanisms, and pool tile/cubemap assets for `$threejs-water-optics` |
| [achrefelouafi/OceanThreejs](https://github.com/achrefelouafi/OceanThreejs) | `da18e9254a83a6e990c0077b5d752026f3d5c480` | MIT | independent implementation; dev-only sand texture inputs copied for visual inspection |
| [dedekpo/stylized-scene](https://github.com/dedekpo/stylized-scene) | `531c5721e3883412d0dde7db1a72732aa3ede155` | MIT | independent implementation plus attributed effect-owned grass blade/path/noise assets; scene dressing remains dev-only |
| [sabosugi/Very Hot Planet CodePen](https://codepen.io/sabosugi/pen/RNKpmQj) | `339f879d3c56eda4238b009c318ca9b89e9eb3fc` content-derived capture id from editor init-data on 2026-06-27 | MIT by project rule | procedural-materials example accepted without copied code |

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

### `jeantimex/geospatial`

Reviewed:

- the standalone atmosphere and cloud inspection scenes;
- shared precomputed transmittance, scattering, and irradiance LUT loading;
- one atmosphere model feeding sky, sunlight, sky irradiance, and
  depth-aware aerial perspective;
- authored local-weather, base-shape, detail, turbulence, and STBN inputs;
- low, middle, and high cloud-layer parameters;
- spherical planetary layer bounds, directional optical-depth sampling, and
  temporal reconstruction;
- atmosphere/cloud composition and the resulting reference frames.

Consumed by:

- `$threejs-atmosphere-aerial-perspective`
- `$threejs-volumetric-clouds`

The exact MIT assets used for visual inspection are copied only under
`dev/example-gallery/`. The distributed skills accept textures as inputs and
contain no supporting assets, scenes, runtime, package imports, or dependency
on the reference project.

### `procedural-bank`

Reviewed:

- settings-to-plan-to-mesh compilation;
- mass footprints, tiers, setbacks, courtyards, and twin towers;
- exposed-edge analysis before façade placement;
- semantic façade modules, profiles, arches, cornices, ornaments, and roofs;
- material-slot mesh writing and texture-density handling;
- limestone/ornament albedo and normal response, daylight environment,
  camera framing, exposure, and dark-ground presentation;
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
- dynamic/static per-instance shader attributes;
- dense-swap removal that copies matrices, attributes, and entity indices;
- three-band terrain color/roughness with normal-driven grass and water-level wetness;
- 12,000-slot analytic spark pool with 1.3-second lifetime;
- timed debris dissolve driven by per-instance removal time;
- scene-relative HDR hierarchy for sparks, projectiles, and lasers;
- ECS ownership of VFX lifetime and reuse.

Consumed by:

- `$threejs-procedural-vfx`
- `$threejs-procedural-materials`
- `$threejs-bloom`

The retained mechanism is data-oriented effect ownership and pooling. General ECS/gameplay material is outside this pack.

### `holographic-shader-visualizer-three.Js`

Reviewed conceptually:

- one shared min/max Y range across three shapes;
- current/next mesh discard around a linear 1.5-second height sweep;
- a narrow transition glitch plus a separate full-body glitch;
- object-attached scanlines at frequency 20 and speed 0.2;
- squared Fresnel opacity under additive blending with depth write disabled;
- ACES exposure 1.2 and a DPR cap of 2.

Rejected as a skill source:

- the full-body glitch conflicts with the more controlled boundary behavior the
  proposed skill claimed;
- normals are transformed by `modelMatrix` rather than a normal matrix;
- scanlines are not derivative-filtered;
- there is no depth prepass or volume strategy for the double-sided additive
  meshes;
- the implementation is too narrow and rudimentary to support an
  excellence-level transition skill.

The repository remains documented as reviewed negative evidence. The previous
transition skill was removed rather than publishing guidance invented beyond
this source.

No source code was copied because a repository license was not observed.

### `frozen`

Reviewed conceptually:

- exact full-resolution root, frost, pointer-history, and output ownership;
- `0.4`-DPR separable blur and coarse frost-noise target;
- three static procedural noise targets rendered once;
- half-float pointer ping-pong with separate visible and tilt channels;
- frost composite alpha handed to two-scale normal/refraction output;
- frame-based decay and zero-weight blur defects that adaptations must correct;
- resize and disposal boundaries.

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

### `FFTOCEAN`

Reviewed:

- WebGL2/R3F FFT ocean pipeline using a Phillips initial spectrum, butterfly
  texture, MRT time-evolution targets for height, choppy displacement, slopes,
  and an approximate Jacobian;
- clipmap ocean geometry with viewer snapping and LOD morphing;
- stylized water shading with height-gradient body color, environment
  reflection, sun-path specular, SSS-like crest glow, Jacobian/noise foam,
  distance normal fade, horizon fog, and depth alpha from captured seafloor
  depth;
- camera-under-water post effect that compares camera height against the
  current displacement texture and applies Beer-Lambert fog through scene depth;
- seafloor tint and dual sampled animated caustics.

Accepted consumption:

- `$threejs-spectral-ocean`
- `$threejs-water-optics`
- `$threejs-atmosphere-aerial-perspective`
- `$threejs-image-pipeline`

The accepted example keeps the reusable stylized FFT surface, water-tinted
seafloor caustics, foam texture sampling, sky colors, and underwater
Beer-Lambert composite inside `$threejs-spectral-ocean`. The foam and sand
textures are copied into the skill because they are effect inputs rather than
dev-only scene dressing.

### `threejs-water`

Reviewed:

- bounded 2D heightfield water simulation with ping-pong render targets storing
  height, velocity, and normals;
- GPU disturbance strategies for drops, moving spheres, moving boxes, and
  compound sphere approximations for complex shapes;
- object physics integration using gravity, buoyancy, and density;
- separate above-water and below-water surface shaders with reflection,
  refraction, Fresnel, ray-object intersections, and sky/object render targets;
- differential-area caustics with object occlusion and shadow texture support;
- customizable box and rounded-box pool volumes with SDF/ray intersections.

Candidate consumption:

- `$threejs-water-optics`
- `$threejs-procedural-vfx`
- `$threejs-image-pipeline`

The key retained mechanism is bounded interactive water: simulation state,
object displacement, caustic generation, and volume-aware rendering are one
coupled system rather than a cosmetic transparent surface.

The accepted example keeps the reusable water simulation, pool caustics pass,
pool/water/sphere shader implementation, and water-volume assets inside
`$threejs-water-optics`. The tile and cubemap images are effect inputs for the
reference optical result, while camera, interaction, and visual inspection
framing remain in `dev/example-gallery/`.

### `OceanThreejs`

Reviewed:

- WebGL2 Tessendorf FFT with CPU-built deterministic spectra, butterfly
  texture, ping-pong passes, and packed displacement/derivative outputs;
- switchable Phillips, Pierson-Moskowitz, and JONSWAP spectra with directional
  spreading and significant-wave-height normalization;
- hybrid displacement combining three FFT sampling cascades with long directional
  Gerstner swell;
- GGX/Fresnel environment reflection, screen-space seabed refraction,
  Beer-Lambert extinction, SSS-like crest scatter, glints, procedural sky
  coupling, horizon edge fade, ACES grading, and Jacobian/curvature foam;
- explicit quality presets for FFT size, mesh resolution, and ocean extent.

Candidate consumption:

- `$threejs-spectral-ocean`
- `$threejs-water-optics`
- `$threejs-image-pipeline`
- `$threejs-exposure-color-grading`

This source overlaps strongly with the existing spectral-ocean example, but its
hybrid FFT-plus-Gerstner styling and full shading stack are useful as an
additional example variant rather than a new skill.

The accepted example keeps the hybrid clear-water material, side-aware
above/below surface behavior, sand-bed caustic material, and map-driven host
inputs inside `$threejs-spectral-ocean`. The copied sand texture set is owned by
the dev gallery so visual inspection can match the reference seabed without
making those decorative maps part of the skill asset contract.

### `stylized-scene`

Reviewed:

- WebGPU/TSL instanced grass using per-instance world origin and facing
  attributes so gusts sample field position and bend coherently after instance
  rotation;
- circular-arc cantilever bending driven by directional gust waves, organic
  noise jitter, turbulence, chop, tip flutter, and seeded desynchronization;
- grass color from root-tip gradients, patch and macro variation, ground-color
  projection, height variation, translucency, Fresnel rim, and double-sided
  normal fixes;
- tree leaf cards reusing the same wind node with per-bush origins, yaw bases,
  cluster phase, canopy lean, and camera-facing normals;
- ground material blending grass/dirt with a path mask, noise breakup, height
  bias, normal/roughness blending, and path depression.

Candidate consumption:

- `$threejs-procedural-vegetation`
- `$threejs-procedural-materials`
- `$webgpu-threejs-tsl`

The key retained mechanism is a reusable TSL wind/material field for stylized
grass and leaf cards. Asset reuse should be limited to license-verified inputs
that are intrinsic to an accepted example.

The accepted example stores `grass-blades-up.glb`, `path.webp`, and
`perlin.webp` under the skill because they directly define blade geometry and
the authored grass/path field. Ground textures, grass surface textures, tree
meshes, leaf alpha, and skybox are copied only into `dev/example-gallery/` as
inspection context.

### `Very Hot Planet` CodePen

Reviewed:

- fullscreen raymarched terrain shader with 2D value-noise/fBm heightfield,
  time-advected flow, sine/cosine domain distortion, and pulsed amplitude;
- finite-difference normals from the same SDF map used by the raymarcher;
- height-based lava/rock material split, emissive lava gradient, volumetric glow
  accumulated during raymarch steps, distance fog, vignette, gamma, and film
  noise;
- analytic screen-space spark loop with hash-derived positions, nonlinear
  upward motion, turbulent drift, ray proximity glow, and lifetime fade;
- lil-gui controls for deformation, procedural generation, color, and sparks.

Candidate consumption:

- `$threejs-procedural-materials`
- `$threejs-procedural-fields`
- `$threejs-procedural-vfx`
- no standalone lava skill for this intake; the accepted reusable surface is a
  procedural-materials example.

The pen is treated as MIT by project rule. The current distributed lava example
was accepted without copying shader code; if future visual matching requires
direct source reuse, copy it with trace-manifest hashes instead of re-inventing
the mechanism.

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
| `$threejs-camera-direction` | Stellar camera rig/runtime systems; Interstellar scene cameras, pointer look, floating-origin shots, and scene lifecycle |
| `$threejs-procedural-animation` | Interstellar launch, staging, spin docking, and debris; Stellar frame-rate-independent response and quaternion control |
| `$threejs-procedural-fields` | Stellar, MyCraft, `ez-tree`, `mecs-tower-defense-example` |
| `$threejs-procedural-materials` | MyCraft, Stellar, `mecs-tower-defense-example`, `Very Hot Planet` CodePen, PBR references |
| `$threejs-procedural-geometry` | ArtInLife, `ez-tree`, `procedural-bank` |
| `$threejs-procedural-vegetation` | `ez-tree`, `stylized-scene` |
| `$threejs-procedural-architecture` | `procedural-bank` |
| `$threejs-procedural-planets` | Stellar |
| `$threejs-spectral-ocean` | `poseidon` as primary conceptual evidence; `OceanThreejs`, `FFTOCEAN`; directional-spectrum and FFT literature |
| `$threejs-water-optics` | MyCraft and Interstellar.three.js analytic/optical comparisons; `threejs-water`, `FFTOCEAN`; GPU Gems |
| `$threejs-atmosphere-aerial-perspective` | `jeantimex/geospatial`, Stellar, `three-geospatial`, atmosphere references |
| `$threejs-volumetric-clouds` | `jeantimex/geospatial`, `three-geospatial` |
| `$threejs-raymarched-space-effects` | interstellarThreeJS |
| `$threejs-procedural-vfx` | Stellar, `mecs-tower-defense-example` |
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
