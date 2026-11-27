# Irradiance probes and real-time reflections

Use this reference to replace glowing unoccluded fill with spatially varying indirect illumination (GI) and to choose physically coherent reflection architectures per surface class.

## Contents

- Why unoccluded fill fails in recesses
- GPU-baked irradiance probe grids
- Probe placement and leak prevention
- SSGI trade-offs and boundaries
- Reflection architecture by surface class
- Reflection content and clipping invariants
- Observed limits and defects
- Diagnostics and failure diagnosis

## Why unoccluded fill fails in recesses

A `HemisphereLight` or global `scene.environment` illuminates every surface as if it stood under an unobstructed open sky. As a result, alcoves, loggias, overhangs, undersides of vehicles, and interior rooms glow nearly as brightly as exposed rooftops, and grounded objects appear pasted onto floors.

Contact AO (`$threejs-screen-space-ambient-occlusion`) only solves small-scale crevices (`0.3–2.0 m`). Large-scale sky occlusion and colored inter-reflection (warm sunlit stone bouncing into shaded soffits, red brick tinting adjacent walls, practical lamps warming ceilings) require **spatially varying occluded indirect light**.

## GPU-baked irradiance probe grids

For static architecture, terrain enclosures, and interiors, bake an L2 spherical-harmonic irradiance probe grid over reachable space at load time. Once baked, evaluation is view-independent and costs almost nothing per frame.

Verify `LightProbeGrid` availability in the target project's installed Three.js build (shipped in Three.js r187 WebGPU/TSL addons):

```js
import { LightProbeGrid } from "three/addons/lighting/LightProbeGrid.js";

// Volume centered at grid.position; one SH probe at each cell center
const probeGrid = new LightProbeGrid(60, 20, 60, 24, 8, 24);
probeGrid.position.set(0, 10, 0);
scene.add(probeGrid); // extends Light; lit node materials sample it automatically

await renderer.init();
probeGrid.bake(renderer, scene, {
  cubemapSize: 16,
  near: 0.05,
  far: 200,
  bounces: 2,
});
```

Contract rules:

- **Bake order:** build static geometry, materials, sky, and static direct/emissive lights first, then run `probeGrid.bake(...)` before the first visible frame. Re-bake only when static lighting or geometry changes.
- **Multi-bounce convergence:** `bounces: 2` or `3` settles most architectural rooms, courtyards, and under-deck spaces with realistic colored bounce.
- **Fill handoff:** inside the probe volume, the probe grid replaces uniform ambient/hemisphere fill. Keep `scene.environment` for glossy specular reflections (occluded indoors via probes/AO) and for exterior areas beyond the grid volume.
- **Combined with contact AO:** let the probe grid own room- and alcove-scale indirect occlusion (`> 1–2 m`) and let GTAO via `builtinAOContext` own tight contact darkening (`< 1–2 m`).

## Probe placement and leak prevention

| Parameter | Guidance | Failure if mis-sized |
| --- | --- | --- |
| Cell spacing (`width / nx`, etc.) | Smaller than the narrowest distinct lighting zone (typically `1.0–2.5 m` for interiors/arcades, `3–8 m` for plazas) | Exterior sunlight bleeds through thin walls into dark interiors |
| Wall thickness vs spacing | Keep walls thicker than probe spacing, or place probe layers cleanly on both sides | Trilinear interpolation averages bright outdoor and dark indoor probes across the wall |
| Solid-interior probes | Avoid placing probes inside opaque solid volumes; offset sampling along the surface normal | Black blotches where trilinear lookup pulls a dark buried probe |
| Multi-grid large worlds | Stack a fine probe grid over the navigable core plus a coarse outer grid for distant massing | Wasted probe resolution on unreachable terrain or glowing mid-distance facades |

### Sizing a probe grid quantitatively

Derive probe counts from the smallest architectural chamber or arcade span (`minZoneMetres`) rather than guessing power-of-two integers:

```js
// Compute probe grid counts that keep cell spacing below minZoneMetres / 2
export function planProbeGrid(boundsSize, minZoneMetres = 3.0, maxProbesPerAxis = 32) {
  const targetStep = Math.max(0.75, minZoneMetres * 0.5);
  const count = (span) => Math.min(maxProbesPerAxis, Math.max(4, Math.ceil(span / targetStep)));
  const nx = count(boundsSize.x);
  const ny = count(boundsSize.y);
  const nz = count(boundsSize.z);
  return {
    nx,
    ny,
    nz,
    cellSize: [+(boundsSize.x / nx).toFixed(2), +(boundsSize.y / ny).toFixed(2), +(boundsSize.z / nz).toFixed(2)],
    totalProbes: nx * ny * nz,
  };
}
```

Practical guardrails:
- Keep `totalProbes <= 8192` for fast interactive startup bakes (`cubemapSize: 16`, `bounces: 2`).
- Hide dynamic moving props (characters, vehicles, swaying grass) during `probeGrid.bake(...)` so baked indirect light never embeds stale dark footprints under moving objects.
- Keep `scene.environment` active for glossy specular IBL while lowering uniform hemisphere/ambient fill inside the grid volume to zero so indirect diffuse is never double-counted.

## SSGI trade-offs and boundaries

Screen-space global illumination (SSGI) only bounces radiance from surfaces currently visible inside the camera frustum. When a bright sunlit wall or floor leaves the viewport during a pan or tilt, its bounce vanishes abruptly and interiors darken or flicker.

- Default to **irradiance probe grids** for static or slowly changing worlds.
- Only add SSGI when dynamic large-scale color bleed is strictly required AND motion captures prove that off-screen bounce disappearance is invisible across pans and turns.

## Reflection architecture by surface class

Choose one explicit reflection mechanism per surface class rather than forcing one technique everywhere:

| Surface class | Recommended method | Key implementation requirements |
| --- | --- | --- |
| Large flat floors (polished stone, wet plaza, marble) | Planar mirror render (TSL `reflector`) | Mirror camera across floor plane, clip geometry below the plane, blur by roughness using mips, clamp normal-map UV distortion near wall bases |
| Open ocean and bounded water | Waterline-clipped planar mirror + slope-integrated sky reflection (`$threejs-spectral-ocean`, `$threejs-water-optics`) | Clip strictly at waterline; integrate across wave slope distribution |
| Hero glossy objects (vehicles, chrome, glass, gems) | Local cube probe or box-projected reflection probe | Update **all `6` faces every frame** when surroundings move; never rotate one face per frame |
| General matte-to-satin scene surfaces | Sun-stripped environment map (`scene.environment`) + local probes | Attenuate indoor specular IBL using probe irradiance or AO so shaded glass does not reflect bright open sky |
| Screen-space reflections (SSR) | Secondary enhancement only | Require a `15–20%` guard band (`$threejs-temporal-stability`) and a matched local-probe fallback so reflections never vanish at screen edges |

## Reflection content and clipping invariants

- **Scene-layer parity:** deciding which layers appear in a reflection (e.g., excluding distant skyline or sky clouds) alters the image itself, not merely quality. Keep reflected layer membership consistent across quality tiers.
- **Full-resolution verification:** low-resolution or heavily blurred reflections hide missing back faces, unclipped sub-floor geometry, and detached props. Inspect every planar and cube reflection at full resolution and low roughness before finalizing roughness blur.
- **Wall-base normal-offset clamping:** on polished stone floors with slight per-slab normal tilt, an unclamped reflection UV offset can sample past the base of a wall into exterior sky or back rooms, creating bright dashed lines along wall-floor seams. Clamp UV offset, depth-test the reflected sample, or zero slab-tilt distortion near wall contacts.
- **Real-extent emitter reflections:** large bright panels, windows, and neon strips must reflect their actual geometry in planar/probe passes rather than collapsing into a single specular point-light dot.

```js
// TSL planar floor reflection with roughness-driven mip blur and clamped normal distortion
// Verify reflector import against the installed Three.js WebGPU build before use.
import { reflector, uv, normalWorld, vec2, clamp } from "three/tsl";

export function attachPlanarFloorReflection(floorMaterial, {
  resolutionScale = 0.5,
  maxDistortion = 0.015, // prevents sampling past wall bases into bright background
  bounces = false,
} = {}) {
  const reflection = reflector({ resolutionScale, bounces });
  reflection.target.rotateX(-Math.PI / 2); // align to Y-up horizontal floor
  const tilt = clamp(normalWorld.xz.mul(0.025), vec2(-maxDistortion), vec2(maxDistortion));
  reflection.uvNode = reflection.uvNode.add(tilt);
  return reflection;
}
```

### Continuous cube-probe update checklist

When using a local `THREE.CubeCamera` for a glossy vehicle, sculpture, or interior room:
1. Hide the reflective subject itself before calling `cubeCamera.update(renderer, scene)`.
2. Render all `6` faces every frame whenever reflected sky, lights, or nearby objects animate; set `needsUpdate` once on load only for strictly static interiors.
3. Match `cubeCamera.near` and `cubeCamera.far` to real surrounding geometry so distant skylines do not clip mid-reflection.

## Observed limits and defects

- **Static probe grids do not track fast moving occluders:** moving vehicles or doors will not dynamically block baked probe bounce; combine static probes with dynamic direct shadows and local contact AO.
- **Memory and bake budget:** high-resolution `3D` probe grids (`> 32×16×32`) with large cubemap sizes (`> 32`) increase startup bake time; profile `cubemapSize = 16` with `2` bounces first before increasing resolution.
- **Double-counted ambient:** leaving a full-strength `HemisphereLight` active inside a baked `LightProbeGrid` doubles indirect light and washes out recesses.

## Diagnostics and failure diagnosis

Expose these inspection views:

```text
probe-grid irradiance only    isolates indirect sky occlusion and colored bounce without direct sun
alcove vs open wall pair      measures luminance drop between recessed and exposed surfaces of same albedo
full-res mirror reflection    unblurred planar/cube pass checking clip plane, layer parity, and wall seams
motion reflection check       frame-by-frame pan verifying continuous 6-face updates and zero SSR edge pop
```

Failure diagnosis:

- **Recesses and overhangs glow like open roofs:** unoccluded fill is still dominant or probe grid is absent; add `LightProbeGrid` and remove redundant uniform fill inside its volume.
- **Light leaks along interior wall bases:** probe cell spacing straddles a thin wall; tighten probe spacing, thicken walls, or separate interior/exterior grids.
- **Dark blotches on columns or ceilings:** a probe sits inside solid geometry; shift grid origin/resolution or apply normal-bias offset during sampling.
- **Bright dashed line where wall meets polished floor:** planar reflection normal-map offset reads behind the wall; clamp distortion offset and verify clip-plane alignment.
- **Reflections stutter during motion:** cube faces are amortised across frames (`1` face/frame) or updated every `N` frames; update all `6` faces per frame for moving content.
