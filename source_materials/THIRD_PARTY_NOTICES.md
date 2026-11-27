# Third-Party Notices

This package includes or adapts MIT Three.js reference material and
assets used by distributed skills. Source revisions and file hashes are recorded
in `source_materials/trace-manifest.json`.

## scottstts/ivory-kingdom

- Source: https://github.com/scottstts/ivory-kingdom
- License: MIT
- Used in: `skills/threejs-procedural-architecture/examples/sculpted-castle/`
  and its corresponding `example-gallery/` scene
- Includes adapted architectural mesh writer, dual-LOD instanced part library,
  rectangular and polygonal multi-tier storey compiler, multi-order recessed
  portals and vaulted gate, projecting pier-buttresses, carved spandrel roses
  and niche walls, ribbed fish-scale domes, Central Keep massing plan, and
  pure procedural TSL carved-relief shading. No external texture assets are
  distributed.

## scottstts/Pearl-Sea-Park

- Source: https://github.com/scottstts/Pearl-Sea-Park
- License: MIT by project rule
- Used in: `skills/threejs-spectral-ocean/examples/submerged-snell-ocean/`
  and its corresponding `example-gallery/` scene
- Includes adapted WebGPU spectral simulation, underwater ocean surface,
  shared HDR sky, differential-area caustics, aquatic medium, god rays,
  particulates, procedural sand and far-saucer geometry, and
  display-grade mechanisms.

## jeantimex/threejs-water

- Source: https://github.com/jeantimex/threejs-water
- License: MIT
- Used in: `skills/threejs-water-optics/examples/interactive-pool-volume/`
- Includes adapted water heightfield, pool caustics, pool interior, water
  surface, and sphere shader mechanisms.
- Bundled assets:
  - `skills/threejs-water-optics/assets/interactive-pool-volume/tiles.jpg`
  - `skills/threejs-water-optics/assets/interactive-pool-volume/xpos.jpg`
  - `skills/threejs-water-optics/assets/interactive-pool-volume/xneg.jpg`
  - `skills/threejs-water-optics/assets/interactive-pool-volume/ypos.jpg`
  - `skills/threejs-water-optics/assets/interactive-pool-volume/zpos.jpg`
  - `skills/threejs-water-optics/assets/interactive-pool-volume/zneg.jpg`

## gioeledallapozza/FFTOCEAN

- Source: https://github.com/gioeledallapozza/FFTOCEAN
- License: MIT by project rule
- Used in: `skills/threejs-spectral-ocean/examples/stylized-above-below-ocean/`
- Includes adapted stylized ocean, foam, seafloor caustic, sky, and underwater
  Beer-Lambert shader mechanisms.
- Bundled assets:
  - `skills/threejs-spectral-ocean/assets/stylized-above-below-ocean/foam.webp`
  - `skills/threejs-spectral-ocean/assets/stylized-above-below-ocean/sand.webp`

## momentchan/r3f-procedural-grass

- Source: https://github.com/momentchan/r3f-procedural-grass
- License: MIT
- Used in: `skills/threejs-procedural-vegetation/examples/gpu-computed-grass/`
- Includes adapted GPU-computed grass blade, clump, wind, LOD, terrain, and
  shading mechanisms.

## momentchan/r3f-gist

- Source: https://github.com/momentchan/r3f-gist
- License: no license observed in the checked submodule; treated as MIT by
  project rule for unlicensed source materials.
- Used in: `skills/threejs-procedural-vegetation/examples/gpu-computed-grass/`
- Includes adapted shader utility, simplex noise, and FBM chunks required by
  the grass implementation.

## siliconjungle/inkwell-webgpu-flowers

- Source: https://github.com/siliconjungle/inkwell-webgpu-flowers
- Copyright: 2026 James and Inkwell contributors
- License: MIT
- Used in:
  `skills/threejs-procedural-vegetation/examples/gpu-culled-flower-field/`
- Includes adapted raw-WebGPU candidate reconstruction, tile compaction,
  distance-stream culling, indirect drawing, flower geometry, wind, and
  instrumentation mechanisms.
- Included effect assets:
  - `skills/threejs-procedural-vegetation/assets/gpu-culled-flower-field/flower-petal-variants.png`
  - `skills/threejs-procedural-vegetation/assets/gpu-culled-flower-field/painted-grass-atlas.png`

## achrefelouafi/SnowSystemThreeJS

- Source: https://github.com/achrefelouafi/SnowSystemThreeJS
- License: MIT
- Used in: `skills/threejs-precipitation-surfaces/examples/snow-accumulation/`
- Includes adapted snowfall, snow accumulation, model capping, frozen lake, and
  material injection mechanisms.
- Dev-only copied assets:
  - `example-gallery/examples/threejs-precipitation-surfaces/snow-accumulation/assets/asphalt/`
  - `example-gallery/examples/threejs-precipitation-surfaces/snow-accumulation/assets/old_rusty_car_2.glb`

## Faraz-Portfolio/demo-2023-rain-puddle

- Source: https://github.com/Faraz-Portfolio/demo-2023-rain-puddle
- License: GPL-3.0
- Used in: `skills/threejs-precipitation-surfaces/examples/wet-puddle-rain/`
- Includes adapted puddle material, rain streak, and splash mechanisms.
- Full GPL-3.0 text is included in `source_materials/GPL-3.0.txt` and in
  `skills/threejs-precipitation-surfaces/assets/wet-puddle-rain/GPL-3.0.txt`.
- Bundled GPL assets:
  - `skills/threejs-precipitation-surfaces/assets/wet-puddle-rain/Splash.png`
  - `skills/threejs-precipitation-surfaces/assets/wet-puddle-rain/road/`
- Dev-only copied assets:
  - `example-gallery/examples/threejs-precipitation-surfaces/wet-puddle-rain/assets/`

## gl-noise

- Source: https://www.npmjs.com/package/gl-noise
- License: MIT
- Used in: `skills/threejs-precipitation-surfaces/examples/wet-puddle-rain/`
- Includes the shader noise helpers needed by the copied rain puddle material.

## @takram Three.js geospatial packages

- Source: https://www.npmjs.com/package/@takram/three-atmosphere,
  https://www.npmjs.com/package/@takram/three-clouds,
  https://www.npmjs.com/package/@takram/three-geospatial, and
  https://www.npmjs.com/package/@takram/three-geospatial-effects
- License: MIT
- Used in:
  - `skills/threejs-atmosphere-aerial-perspective/examples/lut-aerial-perspective/`
  - `skills/threejs-volumetric-clouds/examples/weather-volume-clouds/`
- Includes copied readable source implementation files for sky, aerial
  perspective, sun and sky lighting, geospatial coordinate helpers, volumetric
  clouds, cloud shadow maps, blue-noise loading, lens flare, and dithering.

## postprocessing

- Source: https://www.npmjs.com/package/postprocessing
- License: Zlib
- Used in:
  - `skills/threejs-atmosphere-aerial-perspective/examples/lut-aerial-perspective/`
  - `skills/threejs-volumetric-clouds/examples/weather-volume-clouds/`
- Referenced as a dev-gallery runtime dependency for composer,
  render/effect/normal passes, and tone-mapping effects required by the copied
source examples. Its package build output is not copied into skill examples.

## achrefelouafi/GrassSystemThreeJS

- Source: https://github.com/achrefelouafi/GrassSystemThreeJS
- License: MIT
- Used in: `skills/threejs-procedural-materials/examples/hybrid-soil-moss-surface/`
- Includes adapted soil mound, tone, moisture, crack, raised ground moss,
  model moss accumulation, PBR texture, and relief-normal mechanisms.
- Bundled assets:
  - `skills/threejs-procedural-materials/assets/hybrid-soil-moss-surface/`
- Reused dev-only model asset:
  - `example-gallery/examples/threejs-precipitation-surfaces/snow-accumulation/assets/old_rusty_car_2.glb`

## scottstts/Sandboard

- Source: https://github.com/scottstts/Sandboard
- License: GPL-3.0-only
- Used in: `skills/threejs-procedural-materials/examples/deformable-sand/`
- Includes adapted fixed-step granular transport, impact grains, procedural
  mineral shading, bed-space lighting, and shadow mechanisms.
- The full GPL-3.0 text is included at
  `skills/threejs-procedural-materials/assets/deformable-sand/GPL-3.0.txt`.
- Dev-only copied asset:
  - `example-gallery/examples/threejs-procedural-materials/deformable-sand/assets/coconut_tree.glb`

## iamtechartist/coastal-simulation

- Source: https://github.com/iamtechartist/coastal-simulation
- Copyright: 2026 Techartist
- License: MIT
- Used in: `skills/threejs-spectral-ocean/examples/ocean-beach-waves/`
- Includes adapted finite-volume coastal solver, reconstructed wet-sand and
  water fields, procedural beach/rock world, TSL shading, and impact spray.
- Bundled effect-support assets:
  - `skills/threejs-spectral-ocean/assets/ocean-beach-waves/solver-kernels.wasm`
  - `skills/threejs-spectral-ocean/assets/ocean-beach-waves/initial-state.bin.gz`
- The asset-local MIT notice is included in
  `skills/threejs-spectral-ocean/assets/ocean-beach-waves/THIRD_PARTY_LICENSES.md`.

## rocksdanister/rain

- Source: https://github.com/rocksdanister/rain
- License: no license observed; treated as MIT by project rule.
- Used in: `skills/threejs-temporal-surfaces/examples/refractive-window-rain/`
- Includes the copied procedural droplet, refraction, blur, and presentation shader.
- Dev-only copied asset:
  - `example-gallery/examples/threejs-temporal-surfaces/refractive-window-rain/assets/background.webp`

## achrefelouafi/VegetationGeneratorThreeJS

- Source: https://github.com/achrefelouafi/VegetationGeneratorThreeJS
- License: MIT
- Used in: `skills/threejs-procedural-vegetation/examples/procedural-surface-ivy/`
- Includes copied and source-translated ivy skeleton, surface reprojection,
  stem geometry, instanced foliage/flowers, wind, and BVH integration.

## SkyeShark/threejs-silhouette-pom

- Source: https://github.com/SkyeShark/threejs-silhouette-pom
- License: MIT
- Used in: `skills/threejs-parallax-occlusion-mapping/examples/silhouette-relief/`
- Includes the copied TSL POM march and adapted curved-shell, height-map,
  normal, self-shadow, and shadow-depth material assembly.

## bandinopla/threejs-easyfire

- Source: https://github.com/bandinopla/threejs-easyfire
- Copyright: 2026 Pablo Bandinopla
- License: MIT
- Used in: `skills/threejs-procedural-vfx/examples/volumetric-fluid-fire/`
- Includes adapted WebGPU volumetric fire, coupled fluid compute passes,
  mesh-surface emitters, signed-distance collisions, temperature-tier volume
  scattering, and render-pipeline integration.
- Dev-only copied asset:
  - `example-gallery/examples/threejs-procedural-vfx/volumetric-fluid-fire/assets/demo-scene.glb`

## N8python/diamonds

- Source: https://github.com/N8python/diamonds
- Copyright: 2022 N8python
- License: MIT
- Used in: `skills/threejs-procedural-materials/examples/raytraced-diamond/`
- Includes the adapted BVH-raytraced gem refraction material: entry
  refraction, bounded total-internal-reflection bounces, per-channel
  dispersion, and mip-correct environment sampling.
- Bundled asset:
  - `skills/threejs-procedural-materials/assets/raytraced-diamond/diamond.glb`

## Sculpture (Thunk3D scanner)

- Source: https://sketchfab.com/3d-models/sculpture-4088a30082f343b6ad48b91fc3b7a40a
- Title: "Sculpture"
- Author: Thunk3D scanner
- License: CC-BY-4.0 (https://creativecommons.org/licenses/by/4.0/)
- Changes: recentered on the origin and uniformly scaled to a fixed height.
- Not distributed in the published package. Dev-only inspection asset:
  - `example-gallery/examples/threejs-procedural-materials/spectral-dispersive-glass/assets/sculpture.glb`

## Poly Haven HDRI

- Source: https://polyhaven.com/a/cowboy_town_saloon
- License: CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/)
- Changes: renamed only.
- Not distributed in the published package. Dev-only inspection asset:
  - `example-gallery/examples/threejs-procedural-materials/spectral-dispersive-glass/assets/bar.exr`

Additional bundled asset folders may include local `THIRD_PARTY_LICENSES.md`
files with asset-specific notices.

## Photoreal shallow-water implementation

- Source: author-supplied `photoreal_water.html` (Clearwater).
- Copyright: Aurélien / Lumaris.
- License: MIT under the supplied declaration and project rule.
- Used in: `skills/threejs-water-optics/examples/photoreal-water/`.
- Includes the FFT spectrum, ripples, caustics, optical shader, diffraction and
  display passes, and the embedded pebble JPEG as a lossless data URL module.

## scottstts/Break-That-Denim

- Source: https://github.com/scottstts/Break-That-Denim
- License: GPL-3.0-only.
- Used in: `skills/threejs-procedural-materials/examples/simulated-tearable-denim/`.
- Includes the yarn mechanics, gripping, topology and denim rendering modules.
- Losslessly encoded effect asset:
  `skills/threejs-procedural-materials/assets/simulated-tearable-denim/settled-drape.js`.
- The complete GPL text is included beside the asset and in
  `source_materials/GPL-3.0.txt`.
- Stage, floor assets, mount geometry and playback audio are not distributed.

## Author-owned luminescent and combustion examples

- Author: Scott, supplied directly by the copyright holder.
- License: MIT, explicitly declared by the author for all four projects and
  their supplied assets.
- Implementations: `luminescent-water`, `simulated-paper-burning`,
  `luminescent-jellyfish` and `luminescent-butterfly` under their respective
  water-optics and procedural-materials skill example directories.
- Supporting rock maps, HDR environments, paper artwork and floor maps remain
  in the development gallery; audio and the reference photograph are omitted.
