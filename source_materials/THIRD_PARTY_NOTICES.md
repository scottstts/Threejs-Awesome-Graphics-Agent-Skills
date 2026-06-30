# Third-Party Notices

This package includes or adapts MIT Three.js reference material and
assets used by distributed skills. Source revisions and file hashes are recorded
in `source_materials/trace-manifest.json`.

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

## achrefelouafi/SnowSystemThreeJS

- Source: https://github.com/achrefelouafi/SnowSystemThreeJS
- License: MIT
- Used in: `skills/threejs-precipitation-surfaces/examples/snow-accumulation/`
- Includes adapted snowfall, snow accumulation, model capping, frozen lake, and
  material injection mechanisms.
- Dev-only copied assets:
  - `dev/example-gallery/examples/threejs-precipitation-surfaces/snow-accumulation/assets/asphalt/`
  - `dev/example-gallery/examples/threejs-precipitation-surfaces/snow-accumulation/assets/old_rusty_car_2.glb`

## Faraz-Portfolio/demo-2023-rain-puddle

- Source: https://github.com/Faraz-Portfolio/demo-2023-rain-puddle
- License: GPL-3.0
- Used in: `skills/threejs-precipitation-surfaces/examples/wet-puddle-rain/`
- Includes adapted puddle material, rain streak, and splash mechanisms.
- Full GPL-3.0 text is included in `source_materials/GPL-3.0.txt`.
- Bundled GPL assets:
  - `skills/threejs-precipitation-surfaces/assets/wet-puddle-rain/Splash.png`
  - `skills/threejs-precipitation-surfaces/assets/wet-puddle-rain/road/`
- Dev-only copied assets:
  - `dev/example-gallery/examples/threejs-precipitation-surfaces/wet-puddle-rain/assets/`

## gl-noise

- Source: https://www.npmjs.com/package/gl-noise
- License: MIT
- Used in: `skills/threejs-precipitation-surfaces/examples/wet-puddle-rain/`
- Includes the shader noise helpers needed by the copied rain puddle material.

Additional bundled asset folders may include local `THIRD_PARTY_LICENSES.md`
files with asset-specific notices.
