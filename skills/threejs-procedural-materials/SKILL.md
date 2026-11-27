---
name: threejs-procedural-materials
description: Author production procedural materials in Three.js. Use for simulated paper burning with coupled sheet combustion and pyro fluids, luminescent jellyfish with simulated appendages and layered tissue optics, luminescent butterflies with articulated scale glints and finite wing emitters, hybrid texture-backed PBR soil and moss with procedural displacement and masks, upward-facing model moss accumulation, atlas filtering, specular AA, planet-space fields, terrain wetness, deformable granular sand with mass-coupled grain shading, simulated tearable denim with implicit yarn mechanics, wear-driven failure and frayed fibres, woven cloth with GPU XPBD mechanics and yarn microstructure, simulated fur with interactive grooming and strand shading, lava and emissive surfaces, reflective wave-optical diffraction gratings, air-film-air soap bubbles with Airy interference, raytraced diamond and gem refraction with internal reflection and dispersion, image-space glass transmission with spectral dispersion and volume absorption, deforming softbody jelly materials with XPBD mechanics and refractive caustics, per-instance dissolve, authored PBR identities, derivative normals, and custom direct-light shadow modulation.
---

# Procedural Materials

Build a material from surface identity and causes. Color, roughness, metalness, normal, transmission, and emission should describe the same surface—not unrelated noise textures.

This skill contains exemplary examples and assets beyond descriptive guidance,
they're worth studying, referencing, or even copying. Use them sufficiently
when relevant and do NOT blindly skip them.

## Material graph order

```text
stable coordinates
  → structural fields
  → material identity weights
  → causal modifiers
  → filtered microstructure
  → PBR channels
  → lighting/shadow extensions
```

Read [references/procedural-pbr-system.md](references/procedural-pbr-system.md)
for atlas filtering, specular AA, planetary coordinates, world-height wetness,
per-instance dissolve, and authored PBR response bundles. Read
[references/pbr-scans-projection-and-ranges.md](references/pbr-scans-projection-and-ranges.md)
(and optional [scripts/scan-stats.py](scripts/scan-stats.py)) for physical
albedo/metal/dielectric/roughness tables, PBR map measurement before
thresholding, TSL triplanar whiteout normals, multi-scale tiling breakup,
derived shader maps for basecolor-only models, and thick-media absorption traps.

Read the
[sculpted gallery frame geometry](../threejs-procedural-geometry/examples/sculpted-gallery-frame/frame-geometry.js)
for walnut, antique-gold, and ebony texture/roughness/metalness/clearcoat
bundles under a grazing-light setup.

Read the
[procedural planet surface](../threejs-procedural-planets/examples/procedural-planet-surface/planet-system.js)
for shared geological, climate, water, biome, roughness, and derivative-normal
causes on a procedural planetary surface.

Read the
[lava flow surface material](examples/lava-flow-surface/lava-surface.js)
for raymarched procedural height fields whose normals, rock/lava identity,
emission, glow, embers, fog, and grain are coupled to one material cause stack.

Read the
[raytraced diamond material](examples/raytraced-diamond/diamond-material.js)
for a gem whose mesh is its own optical volume: camera-ray entry refraction, a
GPU BVH first-hit loop with bounded total-internal-reflection bounces,
per-channel IOR dispersion, mip-correct environment exit sampling, and live
camera-matrix uniforms.

Read the
[spectral dispersive glass material](examples/spectral-dispersive-glass/spectral-glass-material.js)
for a transmissive body solved in image space: a double-sided back-face data
pass with inverted depth, an iterative interior exit search, bounded total
internal reflection, Beer-Lambert absorption over the true path length, and a
per-wavelength Cauchy index recombined through CIE 1931. Its reusable optical
primitives — exact unpolarised Fresnel, Cauchy coefficients, spectral weights,
the rotatable environment probe, and the buffer projection — live in
[glass optics](examples/spectral-dispersive-glass/glass-optics.js), and
[references/dielectric-glass-optics.md](references/dielectric-glass-optics.md)
carries the two-pass contract, buffer format, search bounds, and transmission
diagnostics.

Pick between the two transmissive paths by geometry, not by quality. A closed
faceted gem whose exit facet must be exact even when it faces away from the
camera takes the BVH path. A scanned, assembled, open-sheet, or multi-shell
body takes the image-space path, which tolerates inconsistent winding and
authored normals pointing either way but cannot see a surface outside the
frame.

Read
[references/physical-diffraction-grating.md](references/physical-diffraction-grating.md)
for the exact embossed-field, CIE/blackbody spectral, phase-grating, Bessel
order-efficiency, coherence-broadening, strip-emitter, additive-layer, stable
object-frame, limitation, and diagnostic contracts.

Read the
[physical diffraction-grating implementation](examples/physical-diffraction-grating/physical-diffraction-grating.js)
for a printed substrate plus additive HDR foil response whose star and stripe
masks select local groove angle, pitch, and relief while wavelength alone owns
spectral colour. Its complete optical model is expressed as a pure TSL graph
with `Fn`, `If`, and `Loop`, without embedded native shader source.

Read
[references/thin-film-soap-bubble-system.md](references/thin-film-soap-bubble-system.md)
for the air-film-air Airy equation, representative RGB spectral bands,
two-membrane blending, bounded secondary reflection, capillary mechanics,
camera-aware inflow, puncture retraction, limits, and diagnostics.

Read the
[thin-film soap bubble system](examples/thin-film-soap-bubbles/soap-bubble-system.js)
when soap-film interference must drive the image: it provides wavelength-
dependent aqueous index, front and rear membrane passes, analytic nearby-
bubble reflection, volume-preserving capillary modes, buoyancy and drag,
Taylor-Culick rupture, visible-drop aftermath, and deterministic physics gates.

Read the
[softbody jelly implementation](examples/softbody-jelly/softbody-jelly.js)
for a deforming flower-shaped transmissive body whose tetrahedral XPBD state,
smooth optical shell, view-ray thickness, BVH refraction, absorption, receiver
shadow, and finite RGB caustic fields remain coupled.

Read the
[deformable sand implementation](examples/deformable-sand/deformable-sand.js)
for a fixed-step granular heightfield whose conservative transport, impact
particles, anisotropic mineral grains, horizon lighting, and optical-depth
shadows share one mass-carrying state.

Read the
[simulated cloth implementation](examples/simulated-cloth/simulated-cloth.js)
for an exact plain-weave linen material coupled to a GPU XPBD sheet with yarn
stretch, shear locking, bending, rigid contact, self-collision, and pinching.
The calibrated solver and cloth-map contracts are in
[references/simulated-cloth-system.md](references/simulated-cloth-system.md).

Read the
[simulated tearable denim implementation](examples/simulated-tearable-denim/simulated-tearable-denim.js)
for 3/1 twill, implicit multigrid PCG mechanics, wear-driven yarn failure,
connected grip patches, detached pieces, loose threads and frayed fibres.
Read [references/simulated-tearable-denim.md](references/simulated-tearable-denim.md)
for its material, solver, topology, filtering and integration contracts.
Choose this example for material loss and yarn failure; choose
`simulated-cloth` for plain-weave XPBD linen without tearing.

Read the
[simulated fur implementation](examples/simulated-fur/simulated-fur.js)
for groomed GPU strands, tapered ribbon shading, and an articulated hand whose
capsule contacts comb the strand field. The strand, groom, and interaction
contracts are in
[references/simulated-fur-system.md](references/simulated-fur-system.md).

Read
[references/softbody-jelly.md](references/softbody-jelly.md) for the
softbody coordinate contract, neo-Hookean XPBD split, damping and sleep rules,
refractive receiver budget, material constants, limits, and diagnostics.

Read the [simulated paper burning implementation](examples/simulated-paper-burning/simulated-paper-burning.js)
for crumpled-sheet mechanics, material-lattice combustion, char fracture,
volumetric flame/smoke and soot-driven receiver illumination. Read
[references/simulated-paper-burning.md](references/simulated-paper-burning.md)
for its coupled grids, fixed-step order, optical integration and burnout sequence.

Read the [luminescent jellyfish implementation](examples/luminescent-jellyfish/luminescent-jellyfish.js)
for bell anatomy, swimming, Verlet appendages, bioluminescent tissue and
depth-ordered underwater transport. Read
[references/luminescent-jellyfish.md](references/luminescent-jellyfish.md)
for the anatomy, attachment textures, optical layers and integration contracts.

Read the [luminescent butterfly implementation](examples/luminescent-butterfly/luminescent-butterfly.js)
for coherent wing masks, scale glints, articulation, perch clearance, finite
wing illumination and lens imaging. Read
[references/luminescent-butterfly.md](references/luminescent-butterfly.md)
for its wing, emission, lens, integration and swept-geometry contracts.

## Required controls

- real or perceptual texture scale;
- material identity weights;
- roughness range and micro-normal strength;
- the causal fields required by the selected material pattern;
- for a transmissive body, the physical constants that define it — index and
Abbe pair, interior path budget, extinction depth — named rather than buried
inside expressions;
- for a soap film, the exterior and film indices, nanometre thickness range,
  wavelength bands, surface tension, and membrane ordering;
- distance/derivative filtering;
- specular antialiasing;
- channel and mask debug modes.
- emissive-material debug modes when the material owns glow or volumetric
accumulation.

Read [references/hybrid-soil-moss-surface.md](references/hybrid-soil-moss-surface.md),
[hybrid soil and moss implementation](examples/hybrid-soil-moss-surface/hybrid-soil-moss-surface.js),
and [model moss implementation](examples/hybrid-soil-moss-surface/model-moss-accumulation.js)
for texture-backed soil/moss PBR combined with procedural mound displacement,
moisture, warped cracks, and upward-facing model moss accumulation.

## Failure conditions

- every PBR channel samples independent noise;
- roughness is a scalar afterthought;
- high-frequency normals survive below one pixel;
- triplanar projection has visible orientation or scale seams;
- atlas padding is ignored under mipmapping;
- custom lighting removes energy conservation without an explicit stylized goal;
- post-processing is used to hide unstable highlights.
- diffraction hue is painted from UV instead of derived from wavelength;
- a groove frame follows the camera or world axes instead of the object;
- a narrowed diffraction lobe loses energy because its density lacks sigma normalization.
- a soap bubble is treated as a solid glass sphere or painted with a rainbow instead of using air-film-air interference;
- a deformed soap membrane retains the undeformed sphere normal;
- a deforming transmissive body updates its render shell, optical BVH, and receiver field from different states;
- a finite caustic receiver lets non-zero data reach its clamped texture edge;
- a softbody solver uses variable integration steps or an uncoupled rest-stress split that injects energy after damping;
- granular displacement, airborne grains, settled-bed shading, and shadow fields advance from different simulation clocks;
- sand grain sparkle is an unfiltered high-frequency lookup that aliases under grazing motion;

## Routing boundary

Use `$threejs-procedural-vfx` for free-standing voxel fire and smoke; choose
`simulated-paper-burning` here when sheet combustion, char failure and fluid
emission must remain coupled. Use `$threejs-water-optics` for an air-side
luminescent river; `luminescent-jellyfish` owns submerged animal tissue and
its surrounding transport.

Use `$threejs-procedural-fields` when the main problem is designing shared
scalar/vector causes. Use `$threejs-procedural-planets` for a complete
orbit-to-close-approach body, not merely its material. Use
`$threejs-parallax-occlusion-mapping` when a height field must own ray-marched
intersection, silhouette coverage, or relief-aware shadows. Use
`$threejs-temporal-surfaces` for view-aligned wet-glass optics and screen-space
history; this skill owns the optical path through a transmissive body itself.
