# Production image-pipeline contracts

Use this reference to compose shared scene buffers, lighting effects, atmosphere, bloom, exposure, tone mapping, grading, and feature-local render targets with explicit ownership.

## Contents

- WebGPU whole-scene graph
- Modern RenderPipeline output ownership, AA, and guard bands
- Selective gallery graph
- Depth-prepass composer graph
- Temporal-surface effect-local graph
- Buffer and ownership rules
- Resolution policies
- Veil audit and per-layer isolation
- Failure analysis
- Diagnostics


## WebGPU whole-scene graph

When GTAO is enabled, the scene pass writes MRT:

```text
output HDR color
view-space normal
diffuse albedo
depth
```

Graph:

```text
scene MRT
  -> reduced GTAO + bent normal
  -> full-resolution bilateral/lighting composite
  -> atmosphere
  -> bloom
  -> adapted exposure
  -> renderOutput / tone map
  -> 3D LUT
  -> FXAA
```

Near/far values, environment intensity, and environment texture remain
updateable inputs. AO is applied through its dedicated composite rather than
blindly multiplying the final image.

The atmosphere pass reconstructs view/world position from depth,
classifies sky, and owns aerial haze, height fog, sun disc/shaft, lens flare,
and distance grading. Its optional post-process cloud shadow is explicitly
disabled in its configuration, avoiding duplicate ownership with material
lighting.

## Modern RenderPipeline output ownership, AA, and guard bands

For current Three.js WebGPU `RenderPipeline` graphs (verify exact method names against the installed Three.js build), prefer native indirect-only AO and explicit scene-vs-display color ownership:

```text
opaque depth + normalView prePass
  -> GTAONode (masked off sky/water/emissives, far-faded)
  -> MSAA scenePass (samples: 4, reversedDepthBuffer: true, contextNode = builtinAOContext(maskedAO))
  -> HDR bloom (veiling glare)
  -> scene-referred contrast / exposure trims
  -> single tone map via renderOutput(sceneReferred, toneMapping, colorSpace)  [outputColorTransform = false]
  -> display-referred grade (gamut-limited saturation / Lut3DNode)
  -> subtle lens & sensor traits -> outputNode
```

- **Single tone-map invariant:** when `pipeline.outputColorTransform = true`, `outputNode` is scene-referred and tone mapping runs automatically after it. When adding display-referred grading or lens traits after tone mapping, set `pipeline.outputColorTransform = false` and call `renderOutput(...)` once.
- **AA policy:** rely on `4x` MSAA on `scenePass`, specular AA in materials, and mipmapped/anisotropic textures (`$threejs-temporal-stability`). Keep TAA light or off; TAA without MSAA smears moving geometry.
- **Guard bands (`15–20%` overscan):** whenever screen-space refraction, SSR, GTAO, or wide blurs read outside `[0, 1]`, render internal buffers `15–20%` wider/taller than the display viewport and crop at presentation, blending residual out-of-band rays toward the pixel's own UV or a local probe rather than clamping edge rows.

## Selective gallery graph

The gallery scene — the `sculpted-gallery-frame` example under
`$threejs-procedural-geometry` — owns three composers:

```text
neon selective bloom
chandelier selective bloom
base + final additive composite + OutputPass
```

Selective renders use layer membership plus temporary black material
substitution with `try/finally` restoration. CSS3D content is rendered by a
separate renderer after WebGL when invalidated.

Shadows use VSM and manual invalidation:

```text
shadowMap.autoUpdate = false
shadowMap.needsUpdate = true only after relevant scene/light changes
```

This is a bounded-scene optimization. It depends on every moving caster and
light correctly invalidating the cache.

## Depth-prepass composer graph

This graph renders a separate depth prepass into a depth-stencil target before
the composer passes:

```text
depth prepass target
main render
SSAO
volumetric lighting
bloom
lens flare
fog/color grading
```

The depth target uses nearest filtering and a
`DepthStencilFormat`/`UnsignedInt248Type` depth texture. Every depth consumer
receives that same texture.

The composer recalculates effective pixel dimensions from renderer pixel ratio
and resizes the depth target and all passes together.

The composer can exist alongside another application post path. Verify the
actual render-loop call path before claiming that this graph owns runtime
output.

## Temporal-surface effect-local graph

The temporal frost graph is not a whole-scene post stack. It is a
self-contained material effect:

```text
scene at full resolution
  -> vertical blur at 0.4 DPR
  -> horizontal blur at 0.4 DPR
  -> frost composite at full resolution
  -> pointer history write/swap at full resolution
  -> final normal/refraction output
```

Three static procedural texture targets render once. This is a feature-local
example of mixing persistent, static, low-resolution, and full-resolution
signals in one feature.

## Buffer and ownership rules

Before implementation, write:

| Signal | Producer | Consumers | Space/format | Resolution | History |
| --- | --- | --- | --- | --- | --- |
| HDR scene | scene pass | AO/atmosphere/bloom | linear HDR | full | no |
| depth | scene or prepass | AO/fog/flare | renderer-defined | full | no |
| normal | MRT/geometry | AO composite | view space | full | no |
| albedo | MRT | indirect composite | linear | full | no |
| bloom contributions | selective passes | final composite | HDR | full/pyramid | no |
| exposure | meter | final color | scalar | 64x36 source | adapted |
| interaction | ping-pong pass | frost/output | half-float | full | yes |

Every signal has one producer. If a scene pass already owns depth and normal,
do not add an uncoordinated duplicate prepass without measuring the reason.

## Resolution policies

The gallery caps DPR from both device and pixel budget:

```text
mobile budget = 1,000,000 pixels, max DPR 1.25
desktop budget = 1,650,000 pixels, max DPR 1.5
minimum DPR = 1
budget DPR = sqrt(pixelBudget / CSS pixel count)
```

All composers receive the same selected DPR and CSS size.

The temporal frost graph instead gives individual passes fixed roles:

```text
blur and coarse noise = 0.4 DPR
composite, history, output = display DPR
```

Choose global DPR budgeting for scene cost and per-pass scaling for effect
bandwidth. They solve different problems.

## Veil audit and per-layer isolation

A grey, washed-out frame with lifted blacks (`p1`) rarely comes from one single parameter — it typically results from five additive/blended contributors stacking together:

```text
1. distance fog / aerial perspective
2. local height fog or mist volumes
3. cloud ambient haze
4. wide low-threshold bloom / veiling glare
5. display-referred grade black lift
```

Before touching contrast or black-point sliders, expose per-layer taps and toggle each veil term off individually while measuring `p1` and local contrast (`$threejs-visual-validation`):

- **Albedo only:** verifies base material values and scan micro-contrast.
- **Clay sun-only / clay sun+sky+GI:** verifies lighting structure independent of post.
- **Pre-tonemap HDR / pre-grade:** separates lighting and atmosphere from tone mapping and grading.
- **Final:** confirms grading improves medians without flattening surface contrast.

## Failure analysis

- WebGPU pipeline API names are version-sensitive; `PostProcessing` was
  renamed and deprecated in favor of `RenderPipeline` in current Three.js
  history.
- The gallery's selective bloom renders the scene multiple times.
- The gallery's manual shadow invalidation can freeze unregistered motion.
- The depth prepass renders regular scene materials, not an explicit
  depth override; verify transparent and alpha-tested behavior.
- A standalone composer graph may not be the active runtime path; verify the
  render-loop call path.
- The frost blur must guard its weight normalization and scale pointer decay
  by delta time; the `$threejs-temporal-surfaces` frost example does both.
- None of these graphs provides a complete velocity/motion-vector
  contract for general temporal effects.
- Do not advertise velocity ownership or TAA merely because a generic pipeline
  could include them.

## Diagnostics

Expose a graph inspector or equivalent stable views:

```text
scene HDR
depth raw and reconstructed
normal/albedo MRT
GTAO and bent normal
atmosphere only
each selective bloom contribution
exposure meter and current exposure
pre/post tone map and LUT
frost static/history/composite targets
pass resolution, format, memory, and GPU time
manual invalidation state
```

The pipeline is accepted only when every enabled pass has a named input,
output, owner, resolution, and disable path.
