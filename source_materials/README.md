# Source material ledger

This directory contains research inputs for Three.js Awesome Graphics Agent
Skills. Downloaded repositories are ignored by Git and inspected as untrusted
code. A reference checkout may install its own locked dependencies and run
inside its directory for code and visual verification. When an accepted example
needs package implementation internals, the readable source files are copied or
translated in source form and traced here; generated package build output is not
used as skill implementation material.

The pack is a reference-extraction library of mechanisms and workflows.
Reference code and assets may be copied or adapted into distributed skills when
their observed or project-rule license permits it and the exact source revision,
hash, local path, and attribution are recorded. GPL-derived materials stay under
the package's explicit GPL-covered boundary.

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
checkout paths. Source mechanisms and assets are copied or adapted into reusable
skill resources when an accepted example needs the original material or shader
input.

| Project | Reviewed revision | Reviewed areas | Mechanisms distilled into |
| --- | --- | --- | --- |
| [scottstts/MyCraft](https://github.com/scottstts/MyCraft) | `7fdb3cee3d7d99b42ee47dd659b90a4f6a658074` | `BlockMaterial.ts`, custom shadow targets, composer and post passes | `$threejs-procedural-materials`, `$threejs-shadow-systems`, `$threejs-image-pipeline`, `$threejs-bloom`, `$threejs-screen-space-ambient-occlusion` |
| [scottstts/Stellar](https://github.com/scottstts/Stellar) | `ad8062b54ec86312d7c028d46727796eb802c9b2` | planetary field stack, crater/ridge/biome logic, procedural normals, atmosphere shell/post handoff, reentry plasma, dimension-scaled chase/side/orbit camera rigs, body-relative frames, bounded second-order camera response, launch/orbit handoffs, ship orientation control | `$threejs-procedural-planets`, `$threejs-procedural-fields`, `$threejs-atmosphere-aerial-perspective`, `$threejs-procedural-vfx`, `$threejs-camera-direction`, `$threejs-procedural-animation` |
| [scottstts/Interstellar.three.js](https://github.com/scottstts/Interstellar.three.js) | `0c9c4635f9e0cbcb1598a2af8914c3086f8629a3` | wormhole integration, black-hole lensing/accretion and `noise_deep.png`, scene-owned lenses, pointer look, floating-origin framing, launch kinematics, staging, spin docking, spring convergence, rotating-frame debris | `$threejs-raymarched-space-effects`, `$threejs-camera-direction`, `$threejs-procedural-animation` |
| [scottstts/mysite_React](https://github.com/scottstts/mysite_React) | `98bb4ad75561aaf7263dbc6c92e2d66268f69f43` | `ArtInLifeGallery.tsx`: sculpted frame/rail geometry, procedural metal texture, selective bloom, instanced chandelier and placeholders, shadow invalidation, adaptive DPR | `$threejs-procedural-geometry`, `$threejs-procedural-materials`, `$threejs-bloom`, `$threejs-visual-validation` |
| [scottstts/Pearl-Sea-Park](https://github.com/scottstts/Pearl-Sea-Park) | `888fc57b817514049b5fb33b0a3e115b585de067` | generator-colocated geometry audits for bounds, supports, openings, ride envelopes, sight lines, track continuity, curvature, and world clearance | `$threejs-procedural-geometry` |
| [scottstts/Friends-Apartment](https://github.com/scottstts/Friends-Apartment) | `337fbb5c1fa48e51b983d35d137513118e7838b9` | polygon-first mesh authoring, profiles, loft/revolve/sweep constructors, solidify/subdivision/bevel/cleanup, smooth-angle normals, mechanical defect audits, fixed-view inspection | `$threejs-procedural-geometry` |
| [scottstts/Elysium-Mars-Park](https://github.com/scottstts/Elysium-Mars-Park) | `4ccaea9a8c0d5e2057203a7fb38bbf314a75f4a4` | complete geometry-craft contract, Three.js polygon modeling layer, same-mesh coplanar and inter-part clash audit, planted-defect self-tests, semantic and swept-clearance gates | `$threejs-procedural-geometry` |
| [scottstts/Sandboard](https://github.com/scottstts/Sandboard) | `489cb01e81b11ba575887f7c76760498eb41aaa8` | fixed-step GPU granular transport, mass-carrying impact particles, procedural mineral grains, bed-space lighting, airborne/tree shadows, and HDR glints | `$threejs-procedural-materials` |
| [iamtechartist/coastal-simulation](https://github.com/iamtechartist/coastal-simulation) | `2e95e1a3e757ca1268247417dee01606e5e3d55c` | positivity-preserving shallow-water beach solver, reconstructed wet-sand and film fields, procedural rocks, TSL water/sand optics, foam, reflected sky, and impact spray | `$threejs-spectral-ocean` |
| [scottstts/ivory-kingdom](https://github.com/scottstts/ivory-kingdom) | `d3a496d87d95c5a841d9d2112d4f4b397b9a9ccf` | growable architectural mesh writer, rectangular/polygonal multi-tier storey compiler, multi-order recessed portals and ribbed vaults, projecting pier-buttresses with breaking entablatures, carved spandrel roses and niche walls, monumental gate portals, ribbed fish-scale domes with lantern and finials, dual-LOD instanced architectural parts, and procedural carved-relief TSL shading | `$threejs-procedural-architecture` |

### Author-supplied local files

The local-file review context is
[scottstts/Threejs-Awesome-Graphics-Agent-Skills](https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills)
at `2d0972a23995a0b302aceb0050fb0ceeeadff891` for the first two rows and
`1e114ab548b1365b53cd1c0955ec6198e4cf64d3` for the two vehicle studies. The
aurora intake was reviewed against project state
`c43ac9e2532373a947fb5548c705fe40814632bc` plus the author-provided standalone
shader, and both files are pinned by hash. The glass-sculpture intake was
reviewed against project state
`05e02fe402ce2e48d3bc1fc6807b92cbd24f727f`; its script and its two accompanying
assets are pinned by hash. The wormhole intake was reviewed against project
state `d8822f93bca32567c4913a419827121bef23f761` and is pinned by hash. The
diffraction-grating and Optimus humanoid intakes retain project provenance at
state `160cfb8360b811a5512d8f60de113260ad20677f`; the revised TSL diffraction
working copy, both implementations, and the dev-only card artwork are pinned
by exact file hashes. The coastal-breaker and soap-bubble intakes were reviewed
against project state `98453747cc0678f6a5d910f38d7483596a5f9a40`; all code
and both resolution tiers of the bubble environment are pinned by exact file
hashes. The author explicitly confirmed that both projects are MIT material.
The filmic lens-flare intake was reviewed against project state
`1ad2171695a3594d282558a0d813ce336f11678b`; its compositor and both HDRI tiers
are pinned by exact hashes, and the author explicitly confirmed MIT licensing.
The softbody-jelly intake was supplied as a local file at project state
`04856286f29b9b6e0730e798bd943753492278c3`; it has no separate upstream
revision, is treated as MIT under the project rule, and is pinned by hash.
The simulated-cloth and simulated-fur intakes were supplied as local files at
project state `9b86b8cb145e2f2768e75ab7c4bffe3f47ef8b01`; neither has a separate
upstream revision, both are treated as MIT under the project rule, and both
files are pinned by hash.
The Sandboard intake was reviewed at `489cb01e81b11ba575887f7c76760498eb41aaa8`;
its copied effect files are GPL-3.0-only and the optional coconut-tree model is
kept dev-only. The coastal-simulation intake was reviewed at
`2e95e1a3e757ca1268247417dee01606e5e3d55c`; its copied effect files and binary
warm-state assets are MIT under the repository license.

| File | SHA-256 | Reviewed areas | Mechanisms distilled into |
| --- | --- | --- | --- |
| `source_materials/blackhole.html` | `da289ff15c8ea31db03efefdcb4b8dbbe8cd3a83095a329d3835e4b52ef926bb` | single-file WebGL black-hole renderer: RK2 Schwarzschild null-geodesic loop, exact equatorial disk crossing, Doppler/redshift disk shading, procedural deep field, HDR brightpass/blur/composite pipeline, camera/orbit/HUD separation | `$threejs-raymarched-space-effects` |
| `source_materials/submarine.html` | `6f80f233fd24e38ece393aea67a11e271782335f455d1e320cc69d18babc5f49` | single-file WebGPU procedural submarine: tilted-collar hull planning, reusable grid/lathe/sweep/fin emitters, UV-owned apertures and ornament, complete cabin/stern/fin assembly, generated TSL material inputs, deterministic topology evidence | `$threejs-procedural-geometry` |
| `source_materials/f1_race_car.html` | `4fe861a63c1e1dd34c10e951fbe16b661a9c5094b691d583211697492081dd6e` | single-file WebGPU/TSL procedural open-wheel car: monotone parameter tracks compiled into one continuous hull loft, recess-opening semantic sections, superellipse sidepods with a real inlet aperture, spanwise airfoil lofts, warped outline plates, two-plane livery projector, load-deflected tyre carcass, per-part triangle evidence | `$threejs-procedural-geometry` |
| `source_materials/motorcycle.html` | `56c43b3083037a69c438a6c46e9441c5f48d2117aa80be57111af9a2ae8697d9` | single-file WebGPU/TSL procedural supersport motorcycle: steering-axis placement, slot-tagged mesh writer, revolve/transport/upright sweeps, panel shells, spoked wheels and petal rotor masks, bore-local engine volumes, superellipse bodywork, catenary chain, signed-volume orientation guard | `$threejs-procedural-geometry` |
| `source_materials/aurora-snow-desert.html` | `3e021544cbe272db54f120eb0339455dea0fce6034d56ec887b56b0515c1ff07` | single-file WebGL polar-night scene: horizon-reaching aurora slab, warped curtain density, geometric ray steps, per-step jitter, limb extinction, shared perspective/equirectangular radiance, polar-night backdrop and stars, live terrain irradiance, clipmap snow desert, and spindrift | `$threejs-procedural-vfx`; only the aurora implementation is distributed, while all other scene systems remain in the dev gallery shim |
| `source_materials/aurora-original-shader.js` | `6ea35226f37f08adf0bffe6f10df9e2ecab3e216b8b18aead215a4a7a8a896a3` | author-provided standalone WebGL aurora: finite X ±250 / Z ±500 footprint, 75-step uniform raymarch, exact warped curtain density, screen-space lower fade, sky, stars, tone mapping, and dithering | `$threejs-procedural-vfx`; the finite aurora footprint is consumed, while sky, stars, grading, runtime, and GUI remain outside the skill |
| `source_materials/lens_flare/filmic_lens_flare.html` | `c3af411ae57edb830d2236c4ab423d964bb6ef49d491230b1f88967444981d5a` | single-file WebGPU/TSL HDR panorama compositor: HDR sun detection, perspective panorama reprojection, finite highlight-derived and synthetic ghost families, field-angle pupil deformation, spectral ring, source star, localized bloom, veiling glare, film response, camera, and controls | `$threejs-procedural-vfx`; the complete effect graph and view/source math are distributed, renderer and controls remain in the gallery adapter, and only `bg_1k.exr` is copied as a dev-only presentation asset |
| `source_materials/interstellar_wormhole.html` | `b892321b3f2faca884d82b5151e89c1c48cac7691c5e0f86fce8415d216be88f` | single-file WebGL geodesic wormhole renderer: ultrastatic cylindrical-throat metric with lensing shoulders, exact orbital-plane reduction with conserved angular momentum, adaptive RK4 null-geodesic integration, observer sphere frame parallel-transported through the throat, footprint-filtered galactic skies for both exterior regions, cube-face flux-conserving star layers, analytic ringed planet, display-aware bright-source point spread, progressive Halton accumulation, 13-tap bloom pyramid and ACES composite, WASD/pointer camera | `$threejs-raymarched-space-effects`; the integrator, observer, celestial spheres, accumulation and bloom are all distributed, while canvas sizing, the animation loop, and input binding remain in the dev gallery shim |
| `source_materials/glass_sculpture/index.html` | `756f2753611352239f260f156cfe47e19ab1b73922328cf1635590dca1a939c2` | single-file WebGPU/TSL physically based glass: inverted-depth double-sided back-face data pass, image-space interior exit search, exact unpolarized Fresnel with total internal reflection, Beer-Lambert path absorption, Cauchy per-wavelength index from an (n_d, Abbe) pair, CIE 1931 spectral recombination, shared equirectangular probe, and thickness/normal/Fresnel debug views | `$threejs-procedural-materials`; only the glass system is distributed, while model normalization, camera, controls, GUI, and presentation remain in the dev gallery shim |
| `source_materials/ocean_beach/index.html` | `ec93e9c6ecb55c13d82c7b2052eb07c73b5e547d70c1c3ac5eb30656665a6af6` | modular WebGPU/TSL coastal ocean: deterministic directional gravity/capillary fields, signed-distance mainland and island, arclength coast tables, conserved-volume swash chains, persistent world/film foam, warped camera-following geometry, wet-sand optics, shared analytic sky, camera, controls, and diagnostics | `$threejs-spectral-ocean`; the complete ocean/coast/swash/foam/sand implementation is distributed, while renderer lifecycle, visible sky mesh, camera, controls, and gallery integration remain in the dev shim |
| `source_materials/soap_bubble/soap_bubble.html` | `af679c8840b996560b829f4d359c4e0fd156681c5124bc854dfa6af1174d1916` | single-file WebGPU/TSL soap-bubble system: exact air-film-air Airy reflectance, RGB wavelength bands, front/rear membranes, analytic neighboring-bubble reflections, physical flight and capillary modes, camera-aware inflow, Taylor-Culick rupture, and pooled visible drops | `$threejs-procedural-materials`; every bubble-specific mechanism is distributed, while renderer, scene, camera, controls, and the selected 2K EXR remain in the dev gallery shim |
| `source_materials/diffraction_grating/diffraction_grating.html` | `80eb43dfd45dfd28c16324cd233db2c6737963d8756d0ac11bda288352948470` | layered reflective diffraction card: pure TSL `Fn`/`If`/`Loop` optical graph, procedural groove masks, analytic spectral conversion, phase-grating order efficiency, coherence/azimuth broadening, finite-emitter integration, and additive HDR optical composition | `$threejs-procedural-materials`; the whole diffraction material system is distributed, while the printed card artwork is dev-only | 
| `source_materials/optimus.html` | `ccecce42bfd568c8b44753231f584f1c32ae4b25edeeec080a0b72fe51b0d8ee` | complete procedural humanoid geometry and material system: polygon operations, CSG difference, bevels, lofts, pillow panels, semantic body assembly, procedural PBR materials, and deterministic topology statistics | `$threejs-procedural-geometry`; the complete geometry and material implementation is distributed, while the studio, camera, controls, and runtime remain in the dev gallery shim |
| `source_materials/jelly-webgpu.html` | `19c29c05859b3ed65fbd4e583e217deaf7b87546132af5723ec2c5599f259513` | single-file WebGPU/TSL softbody study: triangular-lattice flower cage, two-pass Loop shell, fixed-step XPBD neo-Hookean mechanics, dynamic BVH refraction, RGB absorption, finite receiver shadows and caustics, and physical transmission material | `$threejs-procedural-materials`; the reusable softbody/optics/material system is distributed, while renderer, camera, floor, light, controls, and page presentation remain in the dev gallery shim |
| `source_materials/cloth-webgpu.html` | `e1f7d7043aa931ccbedc455f6c07e3eed13388c055658a6728b97d867257200a` | single-file WebGPU linen study: 96 × 96 GPU XPBD sheet, 72-yarn plain weave, four generated PBR maps, graph-colored yarn constraints, nonlinear shear locking, bending, rigid and self-collision, triangle picking and local pin groups | `$threejs-procedural-materials`; cloth generation, GPU solver, interaction methods, and map diagnostics are in the effect modules; stone, cove, studio, bounded camera, and input binding are in the gallery shim |
| `source_materials/fur.html` | `0f306797a0f054f69fef2d5bf7899c667fd8d25e6f4af4717acaf21100a18983` | single-file WebGPU/TSL fur study: analytic character surfaces, 420,032 six-point GPU strands, root/groom sampling, inextensible Verlet compute, tapered ribbon shading, articulated hand contacts, pet/scratch timing, and per-strand comb memory | `$threejs-procedural-materials`; character, strands, hand, and interaction response are in the effect modules; room, lighting, set dressing, camera, and pointer binding are in the gallery shim; palette selection is omitted |

### `cloth-webgpu.html` and `fur.html`

Reviewed:

- the cloth rest grid, area-mass calculation, full WGSL integration and
  constraint kernels, spatial-hash self-contact, sphere/cove collision, and
  asynchronous pin picking;
- the 72-yarn alternating plain weave and its generated albedo, normal,
  roughness, and AO channels;
- the fur head/body/paw/tail analytic surfaces, Jacobian area estimates, root
  rejection, grooming fields, and per-strand pattern channels;
- the six-point GPU strand solver, segment-length projection, comb memory,
  custom tapered-ribbon shader, fur shadow positions, and articulated hand
  capsule contacts;
- pet, hover, scratch, and diagnostic interactions.

Accepted consumption:

- `$threejs-procedural-materials`

The cloth effect modules own the complete material-map generator, sheet mesh,
WGSL solver, GPU buffers, simulation order, picking, pin state, reset, pause,
and channel diagnostics. The fur effect modules own the character geometry and
root samplers, all strand data and compute, ribbon material, visible hand rig,
contact capsules, interaction state, fixed coat colors, and cleanup. The gallery
adapters own renderer and scene setup, rigid or room presentation, cameras,
lights, stage geometry, and event binding. Gallery text overlays and palette
selection are omitted; contact diagnostics can still render a translucent
wireframe view of the otherwise hidden picking proxies.

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

### `ivory-kingdom/`

Reviewed (`d3a496d87d95c5a841d9d2112d4f4b397b9a9ccf`, MIT):

- the pure-JS growable mesh writer (`kit.js`) emitting `position`, `normal`,
  authored recess `tint`, and carved-relief `carve` channels across profile
  sweeps, mitred hard sweeps, lobed/faceted lathes, arch paths/outlines,
  ear-clipped caps, and hole bridging;
- the unit-scale dual-LOD instanced architectural part library (`parts.js`)
  covering three-piece columns, modillions, pierced arcaded parapet bays,
  urns, spikes, spires, two-stage turrets, octagonal domed kiosks, and
  pinnacles;
- the tier, recessed portal, projecting pier-buttress, carved spandrel rose,
  niche wall, breaking entablature, clipped string course, balustrade, and
  ribbed fish-scale dome compiler (`tier.js`) plus the monumental six-order
  vaulted gate portal (`structures.js`);
- the Central Keep massing plan (`plan.js`: `keep0`–`crown` plus the
  companion rotunda `compBody` grounded onto `keep1`), totaling `1,720,646`
  merged triangles across `5` chunks and `17,482` dual-LOD instances;
- the baked `512 × 512` carved-relief height field, pixel-footprint
  derivative bump fade, specular AA, warm enclosure bounce, wrapped ivory
  scattering, fish-scale glazed roof tiles, and gilding (`materials.js`),
  alongside sky radiance, PMREM environment probe, static shadow fitting, and
  denoised GTAO + glare + soft-knee grade + FXAA frame graph (`sky.js`,
  `main.js`).

Accepted consumption:

- `$threejs-procedural-architecture` (`sculpted-castle`)

On author instruction, only one complete building — the Central Keep,
recentered cleanly at `(0, 0)` with flat base at `y = 0` — is extracted,
using a pure procedural glazed-ivory TSL material (no external PBR texture
assets) so the example focuses on architectural geometry. The skill example
owns the mesh kit, part library, tier/dome/gate compiler, keep massing plan,
pure procedural TSL materials, chunk compilation, dual-LOD switching,
diagnostics, and disposal. The dev gallery uses a single `scene.js` adapter
owning sky radiance, PMREM probe, sun and bounce lighting, static shadow fit,
ground plinth, denoised GTAO + 4× MSAA + glare + grade + FXAA pipeline,
bounded orbit/pan camera controls, and metrics. Terrain, clouds, birds,
stairs, causeway, flanking castle buildings, audio, collision, cinematics,
and UI are omitted. Visual inspection is delegated to the author.

### `Sandboard/`

Reviewed:

- the `512²` double-buffered bed, `0.8 m` extent, `0.032 m` depth, and fixed
  `1/120 s` simulation step;
- eight-neighbor conservative flux transport with fixed-point exchange,
  repose thresholds, contact limits, impact indentation, ejection, and mass
  carried by `16,384` airborne grains;
- distance-resampled bounded pointer strokes and deterministic fixed-step
  clock catch-up;
- procedural anisotropic `3 × 3` Voronoi grain response, filtered mineral
  edges, direct lighting, glints, optical-depth bed visibility, airborne
  shadows, and optional tree-shadow projection;
- reset, water-shadow, postprocess, and mobile quality paths required by the
  renderer.

Accepted consumption:

- `$threejs-procedural-materials`

The distributed example keeps the solver, input queue, render camera, renderer,
lighting, shadow, postprocess, and reset modules in the skill. The gallery owns
the raw WebGPU device, fixed-camera presentation, primary-pointer and keyboard
drawing input, canvas lifecycle, and optional tree URL. The tree model is a
dev-only presentation asset; the full GPL-3.0-only text is mirrored in the skill
asset directory.

### `coastal-simulation/`

Reviewed:

- the `241 × 401` staggered coastal grid, `0.3 m` spacing, procedural shoreline,
  terrain, fourteen rocks, and obstacle-top contract;
- positivity-preserving shallow-water fluxes with incoming-wave sponge,
  transported foam, wetness, thin film, and flow fields;
- reconstructed surface/material/flow packing and temporal interpolation;
- TSL sand, rock, water, sky, reflector, depth-guarded refraction,
  Beer–Lambert transmission, foam, crest lighting, and wet-rock response;
- deterministic `240`-instance impact spray, optional WebAssembly kernels, and
  the compressed warm-state header/array layout.

Accepted consumption:

- `$threejs-spectral-ocean`

The distributed example keeps the coastal solver, surface packing, world
geometry, shading graph, spray, accelerator adapter, and kernel source in the
skill. The gallery supplies renderer lifecycle, field texture uploads, camera,
controls, runtime timing, and metrics. The WebAssembly solver kernel and warm
state are effect-support assets under the skill asset directory. The page
worker, navigation, inspection panel, and performance UI are not distributed.

### `ocean_beach/`

Reviewed:

- five deterministic frequency-domain gravity fields with rotated directional
  band passes, a `0.87` scale comb, coupled height/displacement/derivative
  channels, physical copy speeds, and a separate isotropic capillary field;
- a `512 × 512` half-float signed coastline spanning `±384 m`, a `2048`-entry
  mainland arclength table at `0.8 m`, and a clockwise `96`-column island;
- `256 × 64` coast-normal conserved-volume swash chains with four substeps,
  shock viscosity, friction, a `0.25 m` handoff depth, and camera-following
  mainland row shifts;
- persistent `512 × 512` world foam and `128 × 256` film foam, stable display
  targets, breaker-Jacobian and swash-compression generation, swallowed-film
  decay, and deterministic foam-raft patterning;
- the `512²` warped deep grid, mainland/island ribbons, terrain mesh, shared
  water/sand shader, derivative-filtered sand normals, caustics, absorption,
  shared analytic sky, exact default parameter set, camera, controls, UI, and
  debug overlay;
- the original `2K` sand textures and the author-supplied `1K` delivery
  textures, each pinned by hash.

Accepted consumption:

- `$threejs-spectral-ocean`

The distributed example uses a modular `source/` system because the coast,
simulation targets, geometry and TSL material are one coupled implementation.
Effect code includes the generated fields, coast baker, swash solver, foam,
geometry, uniforms, shader graph, default parameters, exact texture setup and
both author-supplied `1K` sand assets. The dev adapter owns renderer lifecycle, the visible sky
sphere, camera, controls and gallery metadata. The analytic sky-radiance
function stays with the ocean and is consumed by the dev sky material so the
visible surround and water reflection share one function. The gallery view is
reframed down the channel between the island and mainland with camera position
`(14.5, 4.5, 32) m` and target `(-7.5, 0, 0) m`; the gallery viewport keeps the
supplied screenshot aspect. Camera height is clamped above the shader's `3 m`
maximum terrain height plus the near plane and a `0.05 m` margin by a
distance-aware OrbitControls polar-angle limit. Normal, foam,
signed-coast and wireframe diagnostics were added without changing final mode.

### `soap_bubble/soap_bubble.html`

Reviewed:

- exact s/p amplitude coefficients for an air-film-air boundary with
  `n_air = 1.000277`, Cauchy aqueous index, infinite-reflection Airy response,
  and three-tap bands centered at `610/545/460 nm`;
- separate back/front radial membranes, exact radial-graph normals,
  volume-preserving low-order capillary modes, gravity drainage, Plateau-border
  thickening, advected thickness structure, and alpha-normalized reflection;
- six CPU-ranked analytic neighboring sphere proxies per bubble with a bounded
  near/far membrane reflection and one return transmission;
- twenty log-normal bubbles with film mass, buoyancy, Reynolds-dependent drag,
  finite-correlation turbulence, local-air vorticity, capillary forcing,
  physical offscreen inflow, `6.5 s` prewarm, and expanded-frustum recycling;
- object-space geodesic puncture, Taylor-Culick retraction, mass-derived liquid
  rim, `2–5` visible drops, and a fixed `64`-instance drop pool;
- CPU optical, mechanics, volume, rupture and mass-conservation gates;
- `bg.exr`, `bg_1k.exr`, and the author-supplied `2048 × 1024` gallery
  environment, each pinned by hash.

Accepted consumption:

- `$threejs-procedural-materials`

The distributed module owns all bubble-specific optics, geometry, simulation,
camera-aware lifecycle, interaction, rupture, visible-drop aftermath, tests and
cleanup. It accepts an already configured equirectangular environment, camera,
orbit target and pointer element so renderer, scene, camera, controls and EXR
loading stay in the dev adapter. On author instruction, the adapter uses the
`2K` environment and sets background blur to `0.025`; optical reflection still
samples the unblurred environment texture.
Environment-only, spherical-membrane and rear-membrane diagnostics toggle
existing branches and leave final mode unchanged. Both projects are author-
confirmed MIT material.

### `lens_flare/filmic_lens_flare.html`

Reviewed:

- maximum-HDR-luminance sun detection with a `22%` centroid cutoff;
- top-origin perspective panorama reprojection with one EXR row inversion;
- four highlight-derived radial RGB ghosts and finite terminal, cool, warm,
  micro-pupil, spectral-ring, residual-haze, and source-star families;
- object-space field-angle pupil foreshortening, stable sensor-space radial
  direction, behind-camera rejection, and a `0.36`-UV off-frame fade;
- three localized bloom nodes, warm veil and milk masks, print density,
  shoulder, vignette, grain, ACES tone mapping, camera, and controls;
- `bg.exr` and `bg_1k.exr`, both pinned by hash.

Accepted consumption:

- `$threejs-procedural-vfx`

The distributed example owns the complete TSL compositor, HDR sun detector,
panorama view solver, source projection, exact ghost families, bloom nodes, and
film response. Renderer lifecycle, EXR loading, camera controls, viewport state,
and debug selection remain in the dev adapter. On author instruction, only the
`1K` HDRI is copied into the dev gallery; the full-resolution HDRI is not copied
into either the gallery or skill. Plate, flare-only, and no-flare diagnostics
select existing graph outputs or uniforms without changing final formulas.
Visual parity inspection remains for the author by explicit instruction.

### `aurora-snow-desert.html` and `aurora-original-shader.js`

Reviewed:

- a `75`-step emissive slab raymarch with `1.055` geometric step growth;
- the three-octave warped curtain-density field and height-ramped colour;
- per-step jitter, distance extinction, and the source's narrow horizon gate;
- the matching `40`-step, `32 × 16`, four-sample equirectangular radiance pass;
- the polar-night star/backdrop pass, linear HDR target, common grade, live
  terrain radiance use, clipmap snow terrain, spindrift, camera, and controls.
- the standalone shader's finite X `±250` / Z `±500` footprint, uniform
  `75`-step march, screen-space lower fade, sky, stars, grade, and GUI.

Accepted consumption:

- `$threejs-procedural-vfx`

The distributed example owns only the aurora field, its perspective and
equirectangular materials, shared uniforms, and calibrated preset. On author
instruction, it restores the standalone curtain footprint of X `±250` and Z
`±500` instead of the snow-desert scene's `12000`-unit horizontal half-extents,
removing the long horizontal accumulation path. It also uses the standalone
uniform marcher and `0.25`-step start jitter without distance extinction or a
direction gate, because the finite footprint already owns the lower boundary.
The standalone screen-space fade is not applied to the reusable field or probe.
The dev gallery uses a modest scene-relative gain, moderately darker polar-night
colors, and an intermediate upward view to recover contrast while preserving
the snow terrain presentation. Backdrop, stars, render targets, grading,
terrain lighting, terrain, snow particles, camera, and runtime lifecycle remain
in the dev gallery shim.

### `glass_sculpture/index.html`

Reviewed:

- a two-pass image-space glass system: a double-sided back-face pass writing
  the geometric world normal in `xyz` and camera distance in `w` into a
  half-float nearest-filtered RGBA target, with `depth.oneMinus()` so the
  default less-than test keeps the farthest surface of the union hull;
- a per-fragment interior path that refracts the view ray in, seeds the segment
  from the view-ray thickness floored at a `0.08`-unit minimum wall, and
  refines the exit three times per segment by reprojecting the estimate into
  the buffer and rebuilding the stored surface point along the camera ray;
- exact unpolarized Fresnel `F = ½(r_s² + r_p²)` at every interface, returning
  `1` past the critical angle so total internal reflection needs no separate
  test, with a `4`-segment budget, a `0.004` throughput break, and a residual
  term releasing the remaining throughput after the final segment;
- Beer-Lambert absorption over the accumulated internal path length, with
  extinction inverted from a `#d0edda` transmission colour at `0.5` units;
- a Cauchy index from `n_d = 1.5` and `V_d = 32` evaluated at `8` stratified
  wavelength samples across `415–695 nm`, recombined through CIE 1931
  piecewise-Gaussian colour matching into linear sRGB and normalized by the
  running weight sum;
- one rotatable equirectangular probe read at an explicit mip level and shared
  by the visible background, the external reflection, and every exit ray;
- a `0.015 × diagonal` fallback thickness at the silhouette, a `3 × diagonal`
  segment clamp, a V-inverted world-to-buffer projection for the WebGPU render
  target orientation, and thickness, back-face normal, and entry-Fresnel debug
  views;
- model normalization to `1.6` units, camera and orbit framing, AgX at exposure
  `1.3`, auto-rotation, the loading overlay, the backend and frame-rate badge,
  the resolution multiplier, and the lil-gui parameter panel.

Accepted consumption:

- `$threejs-procedural-materials`

The distributed example owns the whole glass system — data pass, exit search,
interface response, absorption, spectral path, environment probe, and
diagnostics — under a class that takes any placed mesh hierarchy and any
equirectangular probe. On author instruction it carries no control surface: the
GUI-driven uniforms become named constants at their reviewed default values,
and only the diagnostic view selector stays live. Model normalization,
environment texture configuration, camera, controls, tone mapping, and exposure
remain in the dev gallery shim, which renders at a device pixel ratio of `2` to
match the reviewed pixel-ratio cap. Camera auto-rotation is dropped on author
instruction.

One defect was corrected in the accepted example on explicit instruction, and
the same correction was applied to the local script (which is why its hash
above is not the one first observed). The absorption spectrum decoded its sRGB
tint literal twice — `new Color(hex)` already resolves into the linear working
space, so the added `convertSRGBToLinear()` squared the transfer and inflated
extinction by about `2.3×`, silently, because doubling only deepens the tint
and tuning by eye absorbs it. Both now parse the literal as
`LinearSRGBColorSpace` and decode exactly once, which also makes σ independent
of the color-management flag, and the default tint moves from `#e9f7ee` to
`#d0edda` so the calibrated appearance is preserved: `σ ≈ (0.922, 0.332,
0.710) 1/unit` against the previous `(0.926, 0.329, 0.710)`.

Both accompanying assets are owned by the dev gallery rather than the skill,
because the material is geometry- and probe-agnostic. `sculpture.glb` is a
scanned model distributed under CC-BY-4.0, which the published package does not
take on; `bar.exr` is a CC0 studio HDRI. Both are pinned by hash and validated
in place.

### `interstellar_wormhole.html`

Reviewed:

- an ultrastatic, spherically symmetric throat metric with a cylindrical neck of
  half-length `a` and lensing shoulders of width `W = 1.42953 M`, fixed at
  `rho = 1`, `W/rho = 0.05`, `2a/rho = 0.01`, with `l` running signed through
  the neck so one coordinate covers both exterior regions;
- the exact reduction of every null geodesic to `y = (l, psi, p_l)` with the
  conserved `b = r^2 dpsi/dt`, and adaptive RK4 with a step read from the local
  curvature scale — linear-exact inside the neck, `0.15 min(r, M + 0.9(|l|-a))`
  outside — capped at `1024` iterations and terminated at `r > 260` while
  receding;
- the observer as a sphere point plus a transported tangent frame with
  `A × B = U`, `r(l)`-scaled travel speed, yaw/pitch written in `(e_l, A, B)`
  components, and accumulation reset on any observer change;
- a ray-bundle footprint from `dFdx/dFdy` of the escaped direction, clamped to
  `0.06` and forced to maximum for iteration-capped rays;
- one galaxy model instanced per exterior region: filamentary ridged dust column
  with `(1.00, 1.24, 1.52)` extinction, band and bulge glow, region-gated HII
  and reflection nebulae behind `sqrt(ext)`, and three cube-face star layers at
  `30/104/300` cells with flux-conserving Gaussian point spreads, the
  `N(<m) ~ 10^(0.6 m)` luminosity law, and an analytic mean-radiance fallback;
- an analytically ray-traced ringed planet with banded `C/B/A` optical depth,
  ringlets, the Encke gap, mutual shadowing, and a depth-correct premultiplied
  composite;
- a display-aware sun point spread normalised by its own profile integral;
- progressive accumulation to `512` samples with a pixel-centred first sample
  and Halton `(2, 3)` offsets while converging;
- a five-level 13-tap bloom pyramid with a `0.85/0.55` soft-knee prefilter,
  additive tent upsampling, and an ACES composite with vignette `0.34`, sRGB
  transfer, and post-transfer grain `0.030`;
- canvas sizing at pixel ratio `1` with a `0.65` render scale, the animation
  loop, WASD/pointer/wheel input, and an offline error overlay.

Accepted consumption:

- `$threejs-raymarched-space-effects`

The distributed example owns the metric, the integrator, the observer and its
transport, both celestial spheres, the accumulation, the bloom pyramid, and the
composite. The sky is split into its own GLSL chunk plus a uniform and
galactic-frame factory so it is reusable without the integrator. Five diagnostic
views were added — exit direction, exterior region, RK4 step count, ray-bundle
footprint, and iteration-capped mask — gated behind an integer uniform at the
end of `main()`, with a float step counter as the only addition inside the
integration loop; a diagnostic keeps rendering into the reduced-resolution
target and reaches the screen through a plain copy pass, so it is framed exactly
like the image it explains and is never accumulated, bloomed, or tone mapped.
On author instruction the example carries no control
surface, so every parameter is a named constant at its calibrated value and the
diagnostic selector is the only settable one. Canvas sizing, device pixel ratio,
the animation loop, the delta conversion, the error overlay, and the raw
pointer/key/wheel binding remain in the dev gallery shim, which drives the
example's own `look`, `zoom`, and `move` entry points because the scene is flown
rather than orbited.

### `diffraction_grating/diffraction_grating.html`

Reviewed:

- the rounded printed substrate, slightly offset additive optical layer, and
  dark physical backing with the exact card proportions and layer spacing;
- star and three-family stripe masks that choose local groove angle, pitch,
  and relief without encoding optical colour directly;
- analytic CIE 1931 matching curves converted to linear sRGB and weighted by a
  `5250 K` blackbody spectrum relative to `560 nm`;
- reflective one-dimensional phase-grating orders `1–3`, Bessel-squared order
  efficiency, Fresnel and blaze terms, finite-coherence broadening, azimuth
  disorder, and the normalized `21`-sample strip-emitter integral;
- the pure TSL graph expressed with `Fn`, `If`, and `Loop`, including bounded
  Bessel, diffraction-order, and emitter loops without native shader strings;
- world-space groove-axis updates from the card quaternion, additive HDR
  composition, ACES display transform, light geometry, controls, GUI, HUD,
  and runtime lifecycle.

Accepted consumption:

- `$threejs-procedural-materials`

The distributed example owns the complete diffraction card and material
system, including generated rounded alpha, printed substrate, pure TSL optical
node graph, backing, every physical control uniform, and the object-axis update
contract.
Renderer creation, camera, emitter mesh, object-drag input, range controls,
reset handling, resize, and animation lifecycle remain in the dev gallery
adapter. On author instruction, `pokemon_card.png` is retained only as
`example-gallery/examples/threejs-procedural-materials/physical-diffraction-grating/assets/card-art.png`;
the reusable material accepts any printed substrate texture and the published
skill contains no card-art asset.

### `optimus.html`

Reviewed:

- the polygon mesh container, shape-preserving and natural-cubic curves,
  polynomial fitting, spatial-hash welding, shell winding repair, and split
  angle-weighted corner normals;
- exact BSP polygon difference and multi-segment, overlap-clamped bevel
  construction, including sector-corner normals and generated-face ownership;
- arc-length-balanced superellipse profiles, parameter and
  parallel-transport spine lofts, pillow panels, outline extrusion, tubes, and
  semantic mesh joining;
- the full torso, head, paired arms, five-finger hands, hip, paired legs, and
  feet: `176` objects and `891809` emitted triangles at `1.7321 m`;
- all `14` PBR identities and their WebGPU node-material roughness, signed
  Perlin-noise, derivative octave filtering, and object-space bump contracts;
- the studio, loading/progress overlays, camera, controls, lighting, floor,
  HUD, error handling, and runtime lifecycle.

Accepted consumption:

- `$threejs-procedural-geometry`

The `procedural-optimus-humanoid` example distributes the complete geometry
and material implementation behind one synchronous creator that returns the
named hierarchy, shared material dictionary, semantic collections,
deterministic statistics, and disposal contract. HTML presentation, renderer,
camera, orbit controls, environment, lights, floor, loading UI, HUD, and error
overlay remain in the dev gallery adapter.

### `jelly-webgpu.html`

Reviewed:

- the regular triangular-lattice cross sections, five-lobed flower contour,
  globally ordered prism tetrahedralisation, signed-volume correction, and
  watertight boundary checks;
- two Loop subdivision passes represented as exact source-node stencils so the
  rendered optical shell can move with the coarser simulation cage;
- compressible neo-Hookean XPBD with coupled deviatoric and hydrostatic solves,
  a unilateral determinant barrier, fixed `1/240 s` integration, gravity,
  frictional floor contact, limited local grabbing, and finite-state recovery;
- centre-of-mass, rigid-spin, and internal damping decomposition with RMS sleep
  detection, dynamic surface normals, volume/energy metrics, and nudge/reset
  controls;
- a refitted triangle BVH with ray/box traversal, geometric-normal fallback,
  exact unpolarised Fresnel transmission, view-ray thickness, and bounded
  internal reflection;
- a `192 × 192` shadow/contact receiver plus an adaptive WebGPU caustic field
  with a `65 × 65` ray lattice, `32 × 32` cell classifier, packed BVH,
  finite-power beam reconstruction, and edge-safe atlas sampling;
- the WebGPU physical jelly material with transmission, dispersion, clearcoat,
  shared optical thickness, and berry/mint/honey extinction presets.

Accepted consumption:

- `$threejs-procedural-materials`

The distributed `softbody-jelly` example owns the cage, smooth optical shell,
mechanics, interaction mechanics, BVH, refractive receiver textures, physical
material, diagnostics, metrics, and disposal contract. The gallery adapter owns
the WebGPU renderer, camera, orbit controls, generated receiver artwork, floor,
sun, runtime clock, and metadata. Loading UI, page copy, HUD, sliders, and
error presentation remain outside the reusable module. The adapter uses the
package-installed Three.js revision while retaining the WebGPU and TSL design.

## Supplied external repositories

Repositories were cloned shallowly under this directory or reviewed from an
author-supplied read-only neighboring worktree.

| Source | Reviewed revision | License observed | Distribution boundary |
| --- | --- | --- | --- |
| [dgreenheck/ez-tree](https://github.com/dgreenheck/ez-tree) | `48dc193515135cff2b33515c47f0a8703b977e63` | MIT | copied/adapted growth and vegetation mechanisms plus explicitly attributed MIT/CC0 demo assets |
| [takram-design-engineering/three-geospatial](https://github.com/takram-design-engineering/three-geospatial) | `b012ad06d858fc035d88aacfd73f092f93c994e4` | MIT | copied/adapted atmosphere and cloud contracts where accepted |
| [jeantimex/geospatial](https://github.com/jeantimex/geospatial) | `d166316ad38f9a21f6d7a3293b808bc7f920283e` | MIT | copied/adapted atmosphere and cloud mechanisms plus dev-only LUT, weather, volume, turbulence, and blue-noise assets |
| [perplexdotgg/mecs-tower-defense-example](https://codeberg.org/perplexdotgg/mecs-tower-defense-example) | `d7b4e8815fcee18d97e9a12c00f900294773ad1c` | MIT code; CC0 assets | copied/adapted ECS, VFX, and material mechanisms where accepted; no assets copied |
| [YasirAwan4831/holographic-shader-visualizer-three.Js](https://github.com/YasirAwan4831/holographic-shader-visualizer-three.Js) | `34810a6e09d0d640d06a2e83c5abab749baf04d5` | MIT by project rule | copied/adapted holographic projection-shell and shape-transition mechanisms for `$threejs-procedural-vfx` |
| [vibe-stack/procedural-bank](https://github.com/vibe-stack/procedural-bank) | `0034e80a61f02b88dbe13a385bdab734a365b82d` | MIT | copied/adapted building, shadow, and material mechanisms plus attributed MIT stone textures |
| [takuma-hmng8/frozen](https://github.com/takuma-hmng8/frozen) | `15a98a5104951a0bd734eb23ab21b7f79741ab09` | MIT by project rule | copied/adapted temporal-surface mechanisms where accepted |
| [scottstts/Pearl-Sea-Park](https://github.com/scottstts/Pearl-Sea-Park) | `4fbf1f3df59a97c27ad80113711622cb914ab0c3` | MIT by project rule | copied/adapted the whole underwater system — WebGPU spectral ocean, exact Snell/TIR underside, forward-refracted interface layer, aquatic medium, caustics, god rays, particulate, foam, sand-bed saucer, and grade — for `$threejs-spectral-ocean` |
| [owenyuwono/poseidon](https://github.com/owenyuwono/poseidon) | `caddf773c7e2b7c9b00ad232d21cca4f364d5272` | MIT by project rule | copied/adapted spectral-ocean mechanisms where accepted |
| [gioeledallapozza/FFTOCEAN](https://github.com/gioeledallapozza/FFTOCEAN) | `0fe3a908a86118eab9930e17b0b29df7fcc05b65` | MIT by project rule | copied/adapted stylized ocean shader mechanisms plus foam and sand assets for `$threejs-spectral-ocean` |
| [jeantimex/threejs-water](https://github.com/jeantimex/threejs-water) | `d5c06864fe22ad31f500af7f21a46aad1c7d3e27` | MIT | copied/adapted water simulation, pool caustics, pool/water/sphere shader mechanisms, and pool tile/cubemap assets for `$threejs-water-optics` |
| [dedekpo/stylized-scene](https://github.com/dedekpo/stylized-scene) | `531c5721e3883412d0dde7db1a72732aa3ede155` | MIT | copied/adapted grass shader, blade, wind, path-mask, and noise mechanisms plus attributed effect-owned assets; scene dressing remains dev-only |
| [sabosugi/Very Hot Planet CodePen](https://codepen.io/sabosugi/pen/RNKpmQj) | `339f879d3c56eda4238b009c318ca9b89e9eb3fc` content-derived capture id from editor init-data on 2026-06-27 | MIT by project rule | copied/adapted procedural lava material mechanisms |
| [momentchan/r3f-procedural-grass](https://github.com/momentchan/r3f-procedural-grass) | `e441d2bd4eacaa0c913a8b64dfeb69bd0314a7b5`; `packages/r3f-gist` submodule `16bc424b75077a910965c98ea8ce0c5b564b54b1` | MIT; submodule has no observed license and is treated as MIT by project rule | copied/adapted realistic GPU-computed grass implementation for `$threejs-procedural-vegetation` |
| [siliconjungle/inkwell-webgpu-flowers](https://github.com/siliconjungle/inkwell-webgpu-flowers) | `88fdb50d74fa160eda9cb8043ff4b2f791f42429` | MIT | copied/adapted the complete raw-WebGPU flower-field engine and its two effect-owned painted atlases for `$threejs-procedural-vegetation` |
| [achrefelouafi/SnowSystemThreeJS](https://github.com/achrefelouafi/SnowSystemThreeJS) | `c7a3bfbd10c93f8d7b032c322c99b38326edeb80` | MIT | copied/adapted snowfall, snow accumulation, model snow capping, and frozen-lake mechanisms into `$threejs-precipitation-surfaces` |
| [Faraz-Portfolio/demo-2023-rain-puddle](https://github.com/Faraz-Portfolio/demo-2023-rain-puddle) | `257066b63d08b227df8f982377e60f91752ddc81` | GPL-3.0 | copied/adapted wet asphalt puddle, rain, and splash mechanisms into GPL-covered precipitation example material |
| [bandinopla/threejs-easyfire](https://github.com/bandinopla/threejs-easyfire) | `994806e27d14b9226c36789ad71ae4b3583dd7db` | MIT | copied/adapted the WebGPU volumetric fire, fluid compute, mesh-emitter, SDF collision, temperature-scattering, and dev-stage mechanisms for `$threejs-procedural-vfx` |
| [N8python/diamonds](https://github.com/N8python/diamonds) | `69b30cc5586195461f47e0b25ccf14578b292cc0` | MIT | copied/adapted the BVH-raytraced diamond refraction material and its faceted gem model for `$threejs-procedural-materials`; the gallery stages it in an authored dark studio |

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

The exact MIT LUT, weather, volume, turbulence, and blue-noise assets needed by
the accepted atmosphere and cloud examples are copied under the corresponding
skill asset folders. The distributed skill examples copy the app-resolved
package `src/` implementation files for the atmosphere, cloud, geospatial
helper, and geospatial effect classes used by the standalone scenes; the shared
gallery host only supplies the canvas, TypeScript source serving, resize loop,
controls, and capture surface.

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

Reviewed:

- one shared min/max Y range across three shapes, with a 0.1 m margin at each
  end and the set lifted 0.5 m;
- current/next complementary discards around a linear 1.5-second height sweep
  inside a 4-second dwell (cycle speed 0.25 shapes/s);
- a narrow transition-band glitch (0.3 m) plus a height-phased body glitch
  (2 m) gated by three incommensurate sines through a smoothstep;
- object-space scanlines at frequency 20 and speed 0.2, cubed, plus a 1.25 rim
  gain and a `smoothstep(0.8, 0)` falloff over squared Fresnel;
- additive blending, front faces only, depth write disabled;
- ACES exposure 1.2 and a DPR cap of 2.

Accepted consumption:

- `$threejs-procedural-vfx`

Two defects were corrected in the accepted example on explicit instruction
(recorded as divergences in `example-traces.json`): the world normal came from a
bare model-basis multiply rather than an inverse-transpose normal matrix, and
the scanline band had no footprint filter. The example resolves incidence in
view space from `normalMatrix` and dissolves the band into its own mean by
`fwidth`. The earlier "double-sided additive" concern does not hold: the material
is front-side only, and additive composition is order independent.

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

### Pearl Sea Park

Reviewed:

- WebGPU compute spectra with three 256² JONSWAP × TMA directional bands,
  deterministic Gaussian packing, packed height/horizontal evolution, and a
  workgroup inverse FFT with explicit barriers;
- a camera-medium-controlled, double-sided ocean material whose underwater
  path performs water-to-air refraction, exact unpolarised dielectric Fresnel
  with a derivative-filtered critical-angle mask, total internal reflection
  against a physically bright upwelling underside, and an energy-conserving
  transmitted-sun lobe widened by the measured per-pixel normal spread;
- pixel-footprint LOD applied to cascade sampling, vertex displacement, the
  normal flatten, capillary bands, and foam — never distance-keyed;
- one shared fixed-sun HDR sky function for the visible dome and Snell window,
  including the bounded marine-aerosol horizon layer;
- aquatic per-channel extinction and directional in-scatter over scene depth,
  followed by pre-tonemap bloom, AgX, a generated 32³ grade, and vignette;
- a 256² differential-area caustic grid drawn 3×3 into a 1024² wrapping tile,
  read by surfaces through a footprint fade to the field's conserved mean and by
  a 14-step full-resolution jittered god-ray march through the exact sampler;
- 18,000 camera-following tetrahedral particulates driven by a shared curl
  field;
- four foam coverage populations (Jacobian whitecap, wake field, windrow raft
  with its recovery tail, crest tear) feeding one thickness-graded shading path
  whose bands fade to their own means;
- a forward-projected opposite-medium structure layer whose water-side crossing
  solve is bracketed by the critical angle rather than the camera-to-source span;
- procedural sand ripples restored as a direct-light ratio, caustic reception
  through `receivedShadowNode`, and the far lagoon saucer that rises from
  680–1150 m to close the seabed/ocean horizon gap;
- terrain-local procedural ripple normals transformed exactly once into view
  space before assignment to the node-material normal hook;
- a seabed-rooted arrival structure with underwater bracing and an above-water
  silhouette suitable for Snell-window alignment inspection.

Rejected mechanisms, recorded because they must not return:

- backward screen-space tracing for either above-water optical source (a
  direction's vanishing point must be inside the frustum, which is a pure
  function of camera pitch);
- a second below-surface normal filtered by the squared Snell stretch (it drives
  the outer window to a mathematically flat plane past ~10 m of depth);
- reduced-resolution god-ray reconstruction without velocity and history;
- a view-aligned near-surface scattering slab to mask the horizon gap.

Accepted consumption:

- `$threejs-spectral-ocean`

The accepted example keeps the spectral field, the exact underwater surface
path, the interface layer, sky coupling, caustics, medium, god rays,
particulates, foam, sand material, and display treatment together. The gallery
fixes the camera below the interface and owns a deliberately simplified tower —
registered with the interface layer as its scene-scale case — plus the focused
flat-centre/far-saucer seabed geometry. The above-water optical tier (undersea
radiance capture, planar mirror reflection, baked surface sun shadow) is not
wired, because none of it can affect a permanently submerged view.

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

Poseidon's spectral mechanisms remain copied/adapted into the spectral-ocean
coverage with trace hashes. They do not define the spectral skill's quality
bound.

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
framing remain in `example-gallery/`.

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
meshes, leaf alpha, and skybox are copied only into `example-gallery/` as
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

The pen is treated as MIT by project rule. The lava example copies/adapts the
reviewed raymarch, material split, glow, ember, fog, vignette, gamma, and grain
mechanisms into the procedural-materials example.

### `r3f-procedural-grass`

Reviewed:

- WebGL2 multiple-render-target compute pass that writes blade parameters,
  clump data, and motion seeds for a dense instanced grass field;
- deterministic jittered blade placement over a terrain-conforming patch;
- Voronoi clump centers, per-clump type trends, blade height/width/bend
  variation, wind-facing yaw, and per-blade LOD/cull seeds;
- Bezier blade spine with wind push, travelling sway, tip flutter, distance
  wind falloff, vertex-row folding, random distance culling, and density
  compensation;
- lighting-normal blending toward clump normals, distance fade toward the
  ground normal/color, height AO, backlight translucency, and per-blade/clump
  color variation;
- FBM terrain height and finite-difference normals supplied by the same shader
  field.

Accepted consumption:

- `$threejs-procedural-vegetation`
- `$threejs-procedural-fields`
- `$threejs-procedural-materials`
- `$threejs-visual-validation`

This is added as an additional realistic grass example, not a replacement for
the existing stylized meadow grass. The source depends on an unlicensed
`r3f-gist` submodule for shader utility and noise chunks; under the current
project rule that submodule is treated as MIT only because it has no observed
license.

The accepted example keeps the MRT blade-parameter compute pass, terrain field,
Voronoi clumps, Bezier blade folding, wind, LOD/cull, color/normal fade, and
lighting mechanisms inside `$threejs-procedural-vegetation`. The dev gallery
owns only the inspection scene, camera, source-like directional light,
environment-only lighting, post pass, and debug presentation.

### `inkwell-webgpu-flowers`

Reviewed:

- deterministic zero-record flower reconstruction from one integer candidate
  ID, using a jittered lattice, a rotated three-octave ecology field, and
  independent hashes for presence, species, scale, atlas mix, lean, and phase;
- `32 × 32` conservative tile compaction, indirect candidate dispatch, and
  atomic append into near, middle, and far four-byte visible-ID streams;
- eight indirect draw paths for exact curved near stems, petals and centres,
  reduced curved middle geometry, and species-preserving far stems and heads;
- five compatible petal-atlas variants across eight species, terminal-tangent
  head orientation, rooted two-frequency wind, and moving-contact bend;
- timestamp, visibility, surviving-tile, candidate-test, draw-count, memory,
  and expanded-transform comparison metrics;
- the React controls/presentation layer, view controls, benchmark bridge, and
  lifecycle around the raw WebGPU engine.

Consumed by:

- `$threejs-procedural-vegetation`

The distributed `gpu-culled-flower-field` example owns the raw WebGPU device
pipelines, buffers, compute and draw shaders, culling, indirect commands,
metrics, disposal, and both byte-identical painted atlases. The dev gallery
adapter supplies view-projection and camera state from its standard orbit/pan
camera, elapsed time, resize, frame scheduling, and lifecycle. React, the
controls panel, copy, telemetry DOM, benchmark bridge, profile buttons, page
CSS, and footer are not distributed.

### `SnowSystemThreeJS`

Reviewed:

- camera-centered GPU-instanced soft snow billboards with wrapped volume,
  per-flake seeds, slow gravity, wind drift, and figure-eight flutter;
- shared time and wind uniforms that keep snowfall and ground sparkle in
  lockstep;
- world-space FBM snow mask, coverage threshold, melt-line softness, snow depth,
  drift bumps, and edge taper;
- a single ground-height function used for vertex displacement and
  finite-difference snow normals;
- snow albedo, matte roughness override, sparse twinkling ice-crystal sparkle,
  and optional lake clearing from the same mask stack;
- model-surface snow capping by upward-facing world normals plus model-locked
  coverage noise, displaced snow thickness, roughness override, sparkle, and
  relief normals;
- optional frozen-lake blob field shared by ground basin carving and translucent
  ice sheet, with shoreline frost, cracks, bubbles, Fresnel reflection, and sun
  glint.

Accepted consumption:

- `$threejs-precipitation-surfaces`
- `$threejs-image-pipeline`

The accepted example keeps the wrapped snowfall volume, shared wind/time
uniforms, world-space snow mask, ground displacement and normals, object snow
capping, sparkle, and optional frozen-lake composition inside
`$threejs-precipitation-surfaces`. Dev-only asphalt inputs, the original
reference rusty car GLB, compressed-model loader support, source-matched model
recentering/resting, cinematic post presentation, and scene framing remain
under `example-gallery/`. The user-supplied compressed car handoff was
copied to `source_materials/user-supplied/old-rusty-car.glb` with SHA-256
`f2f29c4d6d7192e1d44d88238311bccb7fd5251517138c5769439ca71bce4d6b`, but the
gallery uses `source_materials/SnowSystemThreeJS/public/old_rusty_car_2.glb`
for visual parity.

### `demo-2023-rain-puddle`

Reviewed:

- rain-progress envelope that drives material wetness, falling drops, splashes,
  and source-side audio timing;
- PBR asphalt puddle material with procedural puddle mask, staged roughness
  collapse, analytic ripple normals, normal-map handoff, and circular opacity
  masking;
- instanced falling drop planes with camera-facing orientation and rain-progress
  alpha;
- surface-sampled splash placement weighted to upward-facing mesh normals,
  flipbook animation, additive blending, and per-instance splash progress;
- source thunder/lightning presentation was reviewed and deliberately omitted
  from the accepted gallery extraction so the precipitation example has no
  scene flash proxy.

Accepted consumption:

- `$threejs-precipitation-surfaces`

The source is GPL-3.0. The accepted example keeps its copied puddle material,
rain-progress envelope, ripple-normal shader, instanced drops, splash flipbook,
and surface sampling within the package's added GPL-covered boundary. The
effect-owned splash atlas and road texture set are copied under the skill; HDR
and trash inspection assets remain dev-only.

Live Vite inspection of the original checkout on this workstation started the
rain/drop/splash scene but the puddle material failed to compile with the
installed dependency set because `three-custom-shader-material` no longer
provided `csm_Bump`. The public live demo declared in the source README was
therefore inspected directly on June 30, 2026 for visual comparison and
captured at `.example-captures/reference/rain-puddle-live.png`. The accepted
extraction validates the copied puddle mechanisms through source inspection,
copied shader parity, the live-demo comparison, runtime captures, and explicit
puddle-mask/ripple-normal diagnostics rather than relying on the broken local
checkout rendering path.

### `GrassSystemThreeJS`

- Repository: https://github.com/achrefelouafi/GrassSystemThreeJS
- Revision: `b236b2a38d9f35daa2ddc7b0152544b10e635d0c`

Reviewed:

- a PBR soil texture set with shared tiling and correct color/data spaces;
- world-space simplex-fBm mounds with coverage, drift, and edge taper;
- the same mound height used for vertex displacement and finite-difference normals;
- broad tone variation and moisture masks coupling albedo and roughness;
- warped two-scale Worley dry-earth cracks coupling color, roughness, and groove normals;
- a raised moss carpet sharing coverage, height, color, roughness, normal, and AO causes;
- model-locked upward-face moss accumulation on the rusty-car GLB;
- adjacent grass, cloud, and post systems were inspected but excluded from this intake.

Accepted consumption:

- `$threejs-procedural-materials`

The accepted example is explicitly hybrid: Ground103 and Moss002 provide the
texture-backed PBR identities, while procedural fields drive terrain height,
moisture, cracks, moss coverage/thickness, and model accumulation. Both texture
sets are effect-owned and copied into the skill. The rusty-car GLB is shared
from the existing dev-gallery inspection asset; scene lights, environment,
camera, and controls remain gallery-owned.

### `rain`

- Repository: https://github.com/rocksdanister/rain
- Revision: `55d90619c2ba0cfc68c81f6b39f8d2dc64e8072b`

Reviewed:

- one static and two travelling procedural droplet layers;
- hashed cell offsets, saw-shaped lifetimes, elongated drop bodies, trails, and secondary droplets;
- finite-difference coverage normals driving background refraction;
- stochastic disc blur with a runtime iteration budget;
- aspect-fill correction, cool grading, lightning, vignette, brightness, panning, and wallpaper integration.

Accepted consumption:

- `$threejs-temporal-surfaces`

The fragment shader is copied byte-for-byte. The background image remains a
dev-gallery inspection asset; wallpaper APIs, file/video selection, and GUI are
not part of the skill implementation. No license file was observed, so this
source is treated as MIT under the project rule.

### `VegetationGeneratorThreeJS`

- Repository: https://github.com/achrefelouafi/VegetationGeneratorThreeJS
- Revision: `f6c26004c0763011248a65725a56ed28339fdf91`

Reviewed:

- deterministic Catmull-Rom ivy stems reprojected onto arbitrary mesh surfaces;
- tangent-plane creeping branches, surface-loss droop, and BVH first-hit raycasting;
- parallel-transport tube rings and ordered growth draw ranges;
- instanced procedural ivy leaves with rigid petiole-hinge wind;
- deterministic flower sites, bud-to-umbel bloom springs, and growth reveal;
- painting UI, application modes, imported models, and the separate banyan generator.

Accepted consumption:

- `$threejs-procedural-vegetation`

Only procedural ivy is retained. The reusable TypeScript modules are copied
byte-for-byte and translated without minification for direct browser use. The
gallery owns a deterministic painted-path fixture and host sphere.

### `threejs-silhouette-pom`

- Repository: https://github.com/SkyeShark/threejs-silhouette-pom
- Revision: `5b5b48749aab3237e6788a93d84f324995cfeab0`

Reviewed:

- adaptive tangent-space TSL height marching with hit refinement;
- bounded silhouette coverage and sample clamping;
- curvature-aware sag, coarse horizon chase, and horizon trimming;
- inflated curved shells with relief extending beyond the base silhouette;
- central-difference relief normals and light-ray self-shadowing;
- carved and full-relief shadow-map ownership through mask, depth, and received-position nodes;
- deterministic packed procedural height/emission/tone maps.

Accepted consumption:

- `$threejs-parallax-occlusion-mapping`

The core parallax module is copied byte-for-byte. The gallery retains the full
bulkhead composition: procedural wall, deck, columns, and two overhead pipes.
The inspector, GUI, and optional bloom remain dev-runtime concerns.

### `threejs-easyfire`

- Repository: https://github.com/bandinopla/threejs-easyfire
- Revision: `994806e27d14b9226c36789ad71ae4b3583dd7db`
- License: MIT

Reviewed:

- separate world, render, and physics volume dimensions;
- eleven 3D textures for velocity, dye, divergence, pressure, vorticity,
  procedural curl, signed distance, and surface velocity;
- fixed WebGPU compute ordering, ping-pong ownership, semi-Lagrangian
  advection, vorticity confinement, and Jacobi pressure projection;
- preallocated mesh-vertex emitters with transform/property/velocity storage
  buffers;
- box and ellipsoid SDF collider baking plus moving-wall response;
- temperature-tier HDR raymarching, self-absorption, depth handoff, and bloom;
- demo camera, stage geometry, teapot, moving colliders, lights, and exact
  perceptual settings.

Accepted consumption:

- `$threejs-procedural-vfx`

The reusable example retains the complete authored simulation and shading
system under product-neutral names. Inspector/browser persistence controls are
excluded. The copied GLB remains dev-only because it defines the inspection
stage and emitter presentation rather than the reusable fire effect. Gallery
diagnostics expose density, temperature, velocity, colliders, and the non-bloom
baseline without changing the final branch.

### `diamonds`

- Repository: https://github.com/N8python/diamonds
- Revision: `69b30cc5586195461f47e0b25ccf14578b292cc0`
- License: MIT

Reviewed:

- a ShaderMaterial gem whose fragment path refracts the camera ray into the
  mesh, walks a GPU BVH of the same geometry with `bvhIntersectFirstHit`, and
  reflects for up to `bounces` (default `3`) iterations while total internal
  reflection holds, refracting out as soon as escape is possible;
- entry/exit epsilons of `0.001` and a post-reflection origin push of `0.01`
  in model space, with the loop run in model space and the exit direction
  returned to world space;
- per-channel dispersion resolving red/green/blue exit rays at
  `ior * (1 ± aberrationStrength)` (defaults `2.4` and `0.01`), clamped to a
  minimum IOR of `1.0`;
- mip-correct environment sampling: `textureGrad` driven by screen derivatives
  of an ideal per-pixel camera ray reconstructed from `gl_FragCoord`, the
  inverse projection matrix, and the camera world matrix, with a raw-ray
  fallback behind a `correctMips` toggle;
- an SAH `MeshBVH` built from a non-indexed copy of the rendered geometry and
  exposed through `MeshBVHUniformStruct`, plus an invisible BVH visualizer;
- live uniform references to `camera.projectionMatrixInverse` and
  `camera.matrixWorld`;
- a six-face BMP skybox rendered as the scene background and sampled by the
  gem, VSM-shadowed ground and two-directional-light rig, and a scene-target
  passthrough into gamma correction and SMAA;
- GUI-tunable bounces (1–10), IOR (1–5), mip correction, dispersion toggle,
  and aberration strength (0–1);
- commented-out experiments (procedural gem clusters, extra dressing meshes, a
  cube-camera environment target) that are not part of the rendered result.

Accepted consumption:

- `$threejs-procedural-materials`

The accepted example keeps the exact material: entry refraction, the bounded
BVH bounce loop, dispersion, mip-correct exit sampling, SAH BVH construction,
uniform-struct upload, and the default optical constants. The faceted gem GLB
is a skill asset because the cut geometry defines the optical result. On
author instruction the gallery does not reproduce the reviewed daylight scene:
it stages the static gem in an authored dark studio — black background, a
semi-reflective floor (a slightly transparent glossy dark disc over a planar
mirror, so the gem itself reflects in it), and no scene lights. An author-deposited
studio HDRI, `colorful_studio.exr` (SHA-256
`30414b5dffe5d64c785773c7515cebc849f29db5584d290538c4ef7417fc1035`, owned by
the dev gallery), feeds the gem's refraction and reflection through a one-time
conversion to a 512 mipmapped half-float cube target and lights the floor as
the scene environment; it is never drawn as the background. The gallery
preset raises `aberrationStrength` to `0.05`. The skybox faces, light
rig, ground, and self-rotation are reviewed but not consumed. The gallery's
diagnostic modes only flip the material's own uniforms (dispersion off, one
bounce, raw mips) and the BVH helper visibility.

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
| `$threejs-procedural-materials` | MyCraft, Stellar, `mecs-tower-defense-example`, `Very Hot Planet` CodePen, `GrassSystemThreeJS`, `diamonds`, `glass_sculpture`, local diffraction grating, Sandboard, `cloth-webgpu.html`, `fur.html`, PBR references |
| `$threejs-procedural-geometry` | local WebGPU submarine, race-car, motorcycle, and Optimus humanoid HTML studies; ArtInLife, `ez-tree`, `procedural-bank` |
| `$threejs-procedural-vegetation` | `ez-tree`, `stylized-scene`, `inkwell-webgpu-flowers` |
| `$threejs-procedural-architecture` | `procedural-bank` |
| `$threejs-procedural-planets` | Stellar |
| `$threejs-spectral-ocean` | Pearl Sea Park, `poseidon`, `FFTOCEAN`, coastal-simulation; directional-spectrum, shallow-water, and FFT literature |
| `$threejs-water-optics` | `threejs-water`, `FFTOCEAN`; GPU Gems and bounded-water literature |
| `$threejs-atmosphere-aerial-perspective` | `jeantimex/geospatial`, Stellar, `three-geospatial`, atmosphere references |
| `$threejs-volumetric-clouds` | `jeantimex/geospatial`, `three-geospatial` |
| `$threejs-raymarched-space-effects` | interstellarThreeJS; local Schwarzschild black-hole HTML |
| `$threejs-procedural-vfx` | local filmic lens flare, `aurora-snow-desert.html`, `aurora-original-shader.js`, Stellar, `mecs-tower-defense-example`, `holographic-shader-visualizer-three.Js`, `threejs-easyfire` |
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

## Photoreal water and tearable denim intake

- Water: author-supplied `photoreal_water.html`, SHA-256
  `3d410a0cddd9344e95935e238e956cc14a5ff53d147e94fb8a196399025543ec`, recorded against
  https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills at
  `d1cb23dcce6ea8ee4a60f6159daeb79d4b511dba`. MIT by the embedded declaration
  and project rule. Consumed by `$threejs-water-optics` as `photoreal-water`.
- Denim: exact local Git clone, including source, assets, documentation, tests,
  tools and build configuration, from https://github.com/scottstts/Break-That-Denim at
  `3d25411c2c9d32bbc1d0dc1328822b1b4019639a`, under `fabricTear-repository/`.
  GPL-3.0-only. The clone retains the binary `public/drape.bin` unchanged;
  dependencies and build output are not needed.
  Consumed by `$threejs-procedural-materials` as `simulated-tearable-denim`.

The water effect retains the spectrum, ripples, three-channel caustics, bed,
medium, sky radiance, glints, glare and final treatment. Its embedded pebble
JPEG is serialized without re-encoding in a skill-local asset module. The
denim effect retains implicit mechanics, wear/failure, gripping, connectivity,
detached pieces, filtered twill, loose yarns, fibres and cloth shadows. The
stage, mount and floor passes/assets and audio playback are excluded. Plane
contact stays disabled, with inactive ABI slots left in place. The drape
module decodes the exact binary payload and keeps its version/hash validation.

The trace manifest distinguishes serialized module hashes from the decoded
binary hash. Gallery adapters own device/context, camera, input, scheduling,
and UI. Neither skill example depends on the intake directories. Visual
inspection is delegated to the author for this change; automated checks do
not claim visual parity.

Nonvisual extraction audit: all 20 water shader templates are identical to
the supplied HTML. Fifty-two retained denim modules preserve their arithmetic
after import-path and comment normalization; the renderer, disabled plane
contact entry point, telemetry constants, diagnostics and orchestration have
the explicit adaptations listed in example-traces.json. Headless WebGPU checks
compiled 29 WGSL modules, encoded all four output modes, caused actual yarn
failure by dragging, and passed picking, release, reset and no-floor checks.
The complete package tests and freshness check pass, and the package dry run
includes 67 new skill files with no gallery/intake files. Version stays 0.11.0.

## Luminescent water, burning paper, jellyfish and butterfly intake

All four local projects and their supplied assets are MIT under the author's
explicit ownership and license declaration. They were inspected as readable
HTML/JavaScript, not executed. Intake is recorded against repository baseline
`897aaa0a49f9346f342993e1eb74a30479f82614` at
https://github.com/scottstts/Threejs-Awesome-Graphics-Agent-Skills; the SHA-256
digests below identify the exact uncommitted local inputs.

| Local project | HTML SHA-256 | Consumption |
| --- | --- | --- |
| `luminescent-water/index.html` | `9b90beb1e260b9d2669d299ff04513a3a225e922aa4414d72950a75286ba5a05` | $threejs-water-optics / `luminescent-water` |
| `burning-paper/index.html` | `a9b1fc54eecf2f06ae7e55100ef452742ac0bdc58d0cad569acd576f6c3002e7` | $threejs-procedural-materials / `simulated-paper-burning` |
| `luminescent-jellyfish/index.html` | `eedf048c99cdfc74ae0a789a4f8600aefe8ebd7c1f7207ddfdd74dd131b534ba` | $threejs-procedural-materials / `luminescent-jellyfish` |
| `luminescent-butterfly/index.html` | `e92fc8af775ffe7d5d2769789bc44846040880ea0b462fc3a3f039637f441fd3` | $threejs-procedural-materials / `luminescent-butterfly` |

- Water retains the staggered solver, scalar transport, advected microdetail,
  caustics, wet-bed coupling, LOD and complete optical composite. Generated
  channel authoring, rock/HDRI assets, moon/fog, navigation and stir input
  belong to the dev shim. Camera clearance uses the supplied periodic CPU
  terrain lookup, nominal water level and 0.14 m clearance. It never blocks
  startup or the frame loop on simulation-buffer readback.
- Paper retains rest geometry, GPU sheet mechanics, combustion, pyro fluids,
  char/fracture, flames/smoke, soot fields and the automatic burn/wind cycle.
  The injected print, daylight environment, floor maps and receiver setup are
  dev-shim assets. Click ignition remains available without a control panel.
- Jellyfish retains anatomy, swimming, Verlet appendages, tissue shading,
  surrounding-medium radiance, particles, layer compositing and lens response.
  Free orbit/pan/zoom and the diver float belong to the dev shim.
- Butterfly retains wing masks/scales, microfacet glints, body/fur, articulation,
  perch-contact and full-stroke clearance, finite wing emitters, particle/lens
  optics, exposure adaptation and its numeric intersection audit. Botany,
  cave, rock maps, supporting lights and framing belong to the dev shim.

Page overlays, sound, cinematic shot controls and shot labels are omitted.
The supplied audio and butterfly reference image are not runtime dependencies.
All copied binary assets retain their recorded SHA-256 digests. No gallery
module loads from the intake directories.

Version-sensitive integration selects the exact supplied engine revisions per
inspection document: water uses `three-0180` (`npm:three@0.180.0`), and paper,
jellyfish and butterfly use `three-0186` (`npm:three@0.186.1`). Complete document
import maps keep renderer, TSL, controls and display addons on one revision.
The rest of the gallery retains its existing Three.js 0.185.1 dependency.
Water retains PostProcessing; jellyfish retains MRT per-attachment clearing,
which is absent in 0.185.1. No replacement clear/compositing scheme is added.

Paper awaits all four floor texture images before completing adapter setup.
This preserves the supplied receiver material while making its assets ready
for the gallery's single-frame thumbnail.

Butterfly's supplementary camera boundary checks run only when OrbitControls
reports movement. The gallery uses its standard fixed DPR, thumbnail queues,
startup deadlines and sizing. The adaptive-DPR integration is removed with
the shared resize changes. Thumbnail composition uses the effect itself.

Visual inspection, browser execution and captures are explicitly delegated
to the author for this change. Nonvisual code/asset parity, routing, package
validation and publishing dry-run checks do not assert visual equivalence.

Nonvisual acceptance: 19 canonical JavaScript regions match the accepted
intake arithmetic after the recorded boundary adaptations. The checks retain
their expected digests and use only tracked implementation/fixture files, so
they survive removal of every intake project. All four adapters link against
their selected renderer revisions. CPU-only constructor/first-frame tests use
real Three.js objects with a recording renderer, exercising MRT clear calls,
water chunk visibility and compositor scheduling without GPU execution.
Camera-clearance and geometry checks cover the runtime integration in addition
to the mechanism digests.
All package test components, routing, installer, asset-origin, geometry and
freshness checks pass. The publishing dry run includes the four effects and
four guides, excludes dev-shim assets and intake projects, and retains 0.12.0.
The skill usability audit checked standalone wording, exact numeric contracts,
example purpose clauses, navigation ownership and reciprocal routing boundaries.
No GPU execution or visual parity is claimed.

## Pipeline and environment-craft synthesis upgrade

A cross-cutting upgrade absorbed generalized 3D rendering-pipeline contracts,
physical anchors, and headless diagnostic tools from the author's local
environment-building skill pack (`artisticEnvSkills`, treated read-only) while
keeping all curated visual examples untouched and omitting workflow-specific
session/goal-loop procedures.

- **New atomic skills added (4):**
  - `$threejs-reference-reading`: generalized visual-reference decoding,
    recurring misreading checks, style-decides-method/anchor principle, and
    open-design craft.
  - `$threejs-lighting-and-gi`: single-sun alignment, Kasten–Young/Meinel/
    Haurwitz clear-sky ratios (`scripts/sun-sky.mjs`), sun-stripped HDRI fill,
    flat/overcast diagnosis, practical/emissive/subject lighting, GPU-baked
    `LightProbeGrid` GI, and planar/probe/SSR reflection architecture.
  - `$threejs-temporal-stability`: MSAA + specular AA vs TAA policy, stochastic
    and amortised-pass contracts + full-quality still paths, `15–20%` guard
    bands, update-rate parity, periodic-wrap alignment, and motion bisection.
  - `$threejs-terrain-and-landscapes`: non-orbital rock geology, projection-
    matched cliff displacement, dunes, slope-driven snow, foundations/terraces,
    and projected-size near-to-horizon distance layers.
- **Existing skills upgraded (11 + router):**
  - `$threejs-shadow-systems`: built-in WebGPU `CSMShadowNode`, tight depth-
    range bias calibration, small-relief threshold, static vs every-frame
    dynamic caster updates, matte test-plane isolation.
  - `$threejs-screen-space-ambient-occlusion`: native TSL `GTAONode` +
    `builtinAOContext`, horizon-barcode masking and distance fade, AO-vs-GI
    boundary.
  - `$threejs-exposure-color-grading`: `AgX`/`ACES`/`Neutral` selection,
    `RenderPipeline.outputColorTransform` ownership, scene-referred contrast vs
    post-tonemap S-curve trap, TSL `saturateInGamut`, subtle photographic lens
    and sensor traits.
  - `$threejs-image-pipeline` & `$threejs-bloom`: modern `RenderPipeline` chain,
    guard bands, 5-term veil audit, veiling-glare framing, off-screen pop and
    emissive-sprite depth ownership.
  - `$threejs-procedural-architecture`: architectural construction/junctions
    plus complete carved-vs-applied ornament and relief systems (rinceau,
    acanthus, cartouches, coffers, `max`-union height-field relief).
  - `$threejs-procedural-materials`: physical linear albedo/metal/dielectric/
    roughness tables, PBR map measurement (`scripts/scan-stats.py`), TSL
    triplanar whiteout normals, multi-scale tiling, derived shader maps for
    basecolor-only models, thick-media absorption/refraction pitfalls.
  - `$threejs-procedural-geometry`: smooth-by-default `360°/sides` crease rule,
    pixel-footprint detail sizing, exact-contact vs safe-sinking rule, visual
    flicker sweep, supplied-model placement/repair, plus `auditFaceting`,
    `auditSupport`, `auditGroupClearance`, `smoothAngleForSegments`, and
    negative-determinant mirroring winding flip added to `geometry-quality-kit`.
  - `$threejs-procedural-vegetation`: multi-species botanical archetypes,
    rooting and solid-clearance pruning, area-conserving structural LOD,
    physical member-length-scaled wind and every-frame foliage shadows.
  - `$threejs-spectral-ocean` & `$threejs-water-optics`: 3-cause horizon
    barcode elimination, slope-integrated sky/planar reflections, Cox–Munk
    roughness hand-off (`scripts/ocean-spectrum-check.mjs`), breaking-wave
    volumetric life cycles, `15–20%` guard-band bounded refraction, shadowed
    caustics, and fountains.
  - `$threejs-atmosphere-aerial-perspective` & `$threejs-volumetric-clouds`:
    built sky vs IBL-only HDRI, `0.53°` sun disc/aureole, 5-term veil audit,
    world-space participating media, spherical-shell `scripts/march-plan.mjs`,
    and amortised-tracing disocclusion remedies.
  - `$threejs-camera-direction` & `$threejs-visual-validation`: pinhole camera
    solver (`scripts/camera-solve.mjs`) + scale-cue table; per-layer isolation
    and gap attribution + `scripts/measure.py` + sub-pixel flicker sweep +
    cost-by-redesign rules.

Version-sensitive Three.js r187 patterns (`LightProbeGrid`, `CSMShadowNode`,
`GTAONode` + `builtinAOContext`, `RenderPipeline.outputColorTransform`) are
documented with explicit target-version verification requirements, not as a
package-wide minimum.
