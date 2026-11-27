# TSL GTAO integration and horizon-barcode safety

Use this reference to wire Three.js WebGPU/TSL `GTAONode` natively into indirect lighting via `builtinAOContext` and to prevent far-depth horizon barcodes, halos, and AO-vs-GI misuse by construction.

## Contents

- Native WebGPU/TSL GTAO through builtinAOContext
- Horizon-barcode prevention by construction
- World-scale radius, thickness, and denoising
- AO versus global illumination boundary
- Observed limits and defects
- Diagnostics and failure diagnosis

## Native WebGPU/TSL GTAO through builtinAOContext

In Three.js WebGPU/TSL, applying AO directly to `scenePass.contextNode` via `builtinAOContext` modulates **indirect and ambient lighting only** (sky fill, `scene.environment`, and irradiance probes) while leaving direct sun, practical lights, specular highlights, and emissive surfaces untouched — avoiding the approximate forward-color subtraction required by post-composite AO.

Verify exact import paths and node options against the target project's installed Three.js build (checked against Three.js r187):

```js
import {
  pass,
  mrt,
  normalView,
  positionView,
  screenUV,
  builtinAOContext,
  smoothstep,
  mix,
  float,
} from "three/tsl";
import { ao } from "three/addons/tsl/display/GTAONode.js";

// 1. Opaque depth + view-normal pre-pass (keep sky, water, and emissives excluded)
const prePass = pass(scene, camera);
prePass.setMRT(mrt({ output: normalView }));
prePass.transparent = false;

// 2. GTAO pass sized to real scene geometry in metres
const aoPass = ao(
  prePass.getTextureNode("depth"),
  prePass.getTextureNode(),
  camera,
);
aoPass.radius.value = 2.0;    // metres: match architectural/prop contact scale
aoPass.thickness.value = 1.5; // metres: rejects foreground-to-background halos
aoPass.samples.value = 16;

// 3. Apply to indirect lighting only, faded cleanly to 1.0 before far depth quantizes
const scenePass = pass(scene, camera, { samples: 4 });
const farFade = smoothstep(250.0, 500.0, positionView.z.negate());
const maskedAO = mix(aoPass.getTextureNode().sample(screenUV).r, float(1.0), farFade);
scenePass.contextNode = builtinAOContext(maskedAO);
```

## Horizon-barcode prevention by construction

In open landscapes and ocean scenes, running AO on far, low-precision depth produces **vertical dark "barcode" stripes** in a narrow band just below the horizon. Prevent all AO-side causes when AO is first wired — never wait for stripes to appear:

1. **Exclude sky, water, and emissives:** keep transparent water, sky domes/backdrops, and emissive meshes out of the AO pre-pass (`prePass.transparent = false` plus explicit layer/mask exclusion for opaque water or sky shells) so AO never multiplies them.
2. **Fade AO out with view distance:** blend AO smoothly to `1.0` over a distance envelope (`farFade = smoothstep(dNear, dFar, -positionView.z)`, e.g., `250 m` to `500 m`, tuned to camera `near`/`far` precision) well before depth steps quantize into columns.
3. **Enable reversed depth:** construct `new WebGPURenderer({ reversedDepthBuffer: true })` so floating-point depth precision remains usable across kilometres.
4. **Cross-check open water:** in scenes with open seas, AO is only one of three independent causes of the horizon barcode; also close footprint-matched sky mips and far depth-term fading (`$threejs-spectral-ocean`), and run `measure.py --stripes` (`$threejs-visual-validation`) right after enabling AO.

## World-scale radius, thickness, and denoising

| Parameter | Guidance | Failure if mis-tuned |
| --- | --- | --- |
| `radius` | `0.4–2.5 m` matching real joints, steps, mouldings, and furniture contacts | Multi-metre radius darkens open floors/plazas evenly; tiny radius (`< 0.15 m`) misses architectural corners |
| `thickness` | `0.35–1.5 m` matching typical foreground object depth | Too large casts thick dark halos around poles, branches, and silhouettes against distant sky |
| `samples` & resolution | Full resolution when budget permits, or half resolution paired with a depth/normal-aware bilateral upsample clean in motion | Low sample counts (`4–8`) relying on temporal accumulation turn grainy during camera pans (`$threejs-temporal-stability`) |

## AO versus global illumination boundary

AO estimates **local contact visibility** (`< 2 m`). It cannot model large-scale sky occlusion inside alcoves, deep loggias, under bridges, or interior rooms, nor colored bounce light.

- Never crank AO radius (`> 4–8 m`) or power (`> 2.5`) to darken an entire room — doing so dirties open surfaces and creates massive dark halos around foreground objects.
- Use GPU-baked irradiance probes (`LightProbeGrid` in `$threejs-lighting-and-gi`) for room-, overhang-, and alcove-scale indirect occlusion and colored bounce, letting GTAO supply crisp small-scale contact grounding on top.

## Observed limits and defects

- **Extra scene traversal:** the separate `prePass` renders opaque geometry to produce depth and `normalView` before `scenePass` evaluates `builtinAOContext`. Keep `prePass` strictly opaque and free of expensive fragment shading.
- **Custom non-standard shaders:** unlit `MeshBasicNodeMaterial` or custom shaders that bypass Three.js's built-in indirect lighting model will ignore `builtinAOContext`; wire AO intentionally only onto indirect diffuse/IBL terms if writing a custom lighting model.
- **Opaque water meshes:** if an ocean mesh is rendered opaque (not `transparent = true`), `prePass.transparent = false` will still include it unless explicitly excluded via camera layers, material mask, or a water-mask channel.

## Diagnostics and failure diagnosis

Inspect these views whenever AO is added or adjusted:

```text
AO-only grayscale buffer      verifies clean corner darkening, zero halos, zero grain, and 1.0 on sky/water
direct vs indirect split      confirms sunlit surfaces and emissives are completely unaffected by AO
horizon grazing capture       verifies zero vertical dark barcode stripes near the horizon
moving pan capture            confirms bilateral upsample stays grain-free without temporal smear
```

Failure diagnosis:

- **Vertical dark stripes just below the horizon:** half-res or unmasked AO sampling quantized far depth; exclude sky/water from AO, add distance `farFade`, enable `reversedDepthBuffer: true`, and verify water reflection/depth terms (`$threejs-spectral-ocean`).
- **Dark aura around foreground pillars or trees against sky:** `thickness` is too large or bilateral upsample blends across depth jumps; tighten `thickness` and verify depth-aware weights.
- **Sunlit walls look dirty and grey:** AO is multiplying final scene color instead of indirect lighting via `builtinAOContext`.
- **Recesses still glow despite strong AO:** scene lacks large-scale indirect occlusion; add an irradiance probe grid (`$threejs-lighting-and-gi`) rather than inflating AO radius.
