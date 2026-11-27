# Shadow cascades, bias discipline, and caster updates

Use this reference to select the right directional shadow tier (tight single map, built-in WebGPU `CSMShadowNode`, or custom cached clipmaps), eliminate peter-panning and missing small-relief shadows, and separate static from dynamic caster updates.

## Contents

- Coverage tier selection
- Built-in WebGPU CSMShadowNode setup
- Depth-range fitting, bias, and small-relief casting
- Static versus dynamic caster update policy
- Single-sun agreement and test-plane isolation
- Observed limits and defects
- Diagnostics and failure diagnosis

## Coverage tier selection

Pick the simplest shadow hierarchy that covers the entire visible receiver range without clipping, popping, or swimming:

| Scene extent | Recommended coverage tier | When to use |
| --- | --- | --- |
| Compact bounded scene (`<= 40–80 m`) | Single tightly fitted orthographic directional map | Viewer stays inside one bounded courtyard, room, or showcase plinth |
| Open outdoor scene (`80 m – 1 km`) | Built-in `CSMShadowNode` (`3–4` cascades) + optional baked far terrain shadow | General scenes, games, and architecture needing stable multi-distance shadows without custom shader plumbing |
| Large streamed / city world (`1–3 km+`) | Custom cached clipmaps (`references/cached-clipmap-shadows.md`) or near cascades + long-range world-fixed map | Worlds requiring frame-budgeted coarse caching and targeted spatial invalidation |
| Multi-kilometre static terrain (dunes, mountain ranges) | Baked terrain sun-visibility map handing over beyond `maxFar` | Static macro landforms whose shadows must persist out to the horizon |

## Built-in WebGPU CSMShadowNode setup

Verify `CSMShadowNode` availability and exact constructor options against the project's installed Three.js build (shipped in Three.js r187 WebGPU/TSL addons):

```js
import { CSMShadowNode } from "three/addons/csm/CSMShadowNode.js";

sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);

const csm = new CSMShadowNode(sun, {
  cascades: 4,
  maxFar: 600,
  mode: "practical",
  lightMargin: 200,
});
csm.fade = true; // smooth transition across cascade boundaries
sun.shadow.shadowNode = csm;
```

Key stability rules:

- **Texel snapping:** lock each cascade's orthographic origin to its light-space texel grid so shadow edges never crawl or shimmer during slow camera pans.
- **Smooth handover at `maxFar`:** enable `csm.fade = true` and match baked terrain self-shadowing or long-range maps cleanly to `maxFar` so shadows never slice off abruptly along a moving circle.
- **Complete participation:** every visible mass — terrain, architecture, vegetation, vehicles, characters, props — casts and receives shadows. Never exempt buildings or hero subjects from casting/receiving to fake a hero angle.

## Depth-range fitting, bias, and small-relief casting

Shadow **depth bias** operates in normalized light-camera depth (`[0, 1]`), meaning its world-space offset in metres grows linearly with `(shadowCamera.far - shadowCamera.near)`. A `500 m` loose frustum turns a tiny `-0.0005` bias into `25 cm` of peter-panning.

```text
worldDepthOffset ≈ abs(shadow.bias) * (shadowCamera.far - shadowCamera.near)
minimumCastableRelief > worldTexelWidth + abs(shadow.normalBias) + worldDepthOffset
```

Calibration procedure:

1. **Fit near/far tightly to actual casters:** shrink the shadow camera depth range around casters that can actually shadow visible receivers (`lightMargin` only as deep as tall off-screen occluders require).
2. **Start both biases at `0`:** inspect the worst grazing surface (large flat floor/wall at low sun angle) for self-shadowing acne.
3. **Raise `normalBias` first:** `normalBias` offsets lookups along the surface normal in world units, clearing grazing acne with far less contact detachment than depth bias. Scale `normalBias` proportionally with each cascade's world texel width.
4. **Verify thin-contact peter-panning:** inspect thin posts, balustrade rails, wheels, and tree trunks where they meet the ground; lower bias or tighten depth range if any shadow gap opens, and seat trunks/posts solidly into their support.
5. **Verify small-relief shadows:** if architectural mouldings, carved panels, or cliff fractures cast no shadow, compare their relief depth against `worldTexelWidth + normalBias`. Tighten the near cascade's `maxFar`/width or add a local hero shadow map — never blur a coarse map to hide blocky texels.
6. **Physical penumbra softness:** size PCF filter radius to approximate the sun's `~0.53°` angular diameter (penumbra growing with occluder distance) or the physical size of a practical lamp.

## Static versus dynamic caster update policy

| Caster class | Required update policy | Banned shortcut |
| --- | --- | --- |
| Static architecture, cliffs, terrain | Render once after build (`renderer.shadowMap.autoUpdate = false`, trigger `needsUpdate = true` on change) | Re-rendering static shadow maps unnecessarily when budget is tight |
| Wind-blown vegetation, characters, vehicles, animated doors | **Update every frame** (`1:1` with presentation) | Updating every `N` frames (stepped stutter) or keeping frozen proxy shadows under moving foliage |
| Mixed static + dynamic scenes | Separate static/dynamic shadow layers or measure every-frame full-pass cost first (often `1–3 ms`) | Freezing dynamic casters indefinitely in coarse cascades |

## Single-sun agreement and test-plane isolation

- **Only the primary sun casts directional sun shadows:** sky fills, hemisphere lights, and secondary art-directed fills never cast conflicting directional shadows (`$threejs-lighting-and-gi`).
- **Isolating shadow-system bugs from material bugs:** place a plain, opaque, matte grey test plane (`roughness = 0.9`, `castShadow = false`, `receiveShadow = true`) directly at any spot where shadows appear missing or corrupt.
  - If the test plane receives a clean shadow, the bug is inside the target surface's material (custom shader ignoring shadow nodes, `receiveShadow = false`, or excessive emissive overriding shadows).
  - If the test plane also shows no shadow, the bug is in the shadow system (caster frustum clipping, `castShadow = false`, layer mismatch, or excessive bias).

## Observed limits and defects

- **Single map on wide scenes:** stretching one `2048²` map across `400 m` produces `~20 cm` texels, erasing all architectural relief and producing jagged stair-steps.
- **Over-wide PCF blur:** inflating filter radius on a coarse map turns stair-steps into swimming grain and detached halos; solve resolution first, then match filter radius to penumbra.
- **Unclamped near-cascade waste:** allocating `50%` of cascade range too close or too far starves mid-ground contact clarity; verify practical split factor (`lambda ≈ 0.5–0.8`) across dolly-in and dolly-out shots.

## Diagnostics and failure diagnosis

Mandatory shadow verification checks:

```text
matte test plane             separates shadow-pass bugs from material/shader bugs
grazing vertical stick       checks sun-direction agreement, acne, and contact peter-panning
dolly in/out (near to far)   verifies cascade handover, zero abrupt shadow cutoff, zero shifting
slow pan                     verifies texel snapping (zero swimming along thin edges)
dynamic motion capture       confirms wind-blown trees and moving subjects cast frame-accurate shadows
```

Failure diagnosis:

- **Gap between object base and cast shadow (peter-panning):** shadow camera depth range is overly wide or bias is too high; tighten near/far to casters, reduce depth bias, rely on scaled `normalBias`, and seat bases solidly.
- **Small relief or mouldings cast no shadow:** `worldTexelWidth + normalBias` exceeds relief depth; tighten near cascade extent or add higher resolution near hero detail.
- **Shadows clip abruptly at mid-distance:** single map or short `maxFar`; adopt `CSMShadowNode` or hand off into a long-range/baked terrain shadow map.
- **Tree or character shadows tick at low frame rate:** shadow map updates every `N` frames; switch moving casters to every-frame updates.
