# Production image-pipeline contracts

Use this reference to compose shared scene buffers, lighting effects, atmosphere, bloom, exposure, tone mapping, grading, and feature-local render targets with explicit ownership.

## Contents

- production WebGPU pipeline WebGPU graph
- selective gallery pipeline selective gallery graph
- atlas-based renderer composer graph
- Temporal-surface effect-local graph
- Buffer and ownership rules
- Resolution policies
- Failure analysis
- Diagnostics


## production WebGPU pipeline WebGPU graph

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
updatable inputs. AO is applied through its dedicated composite rather than
blindly multiplying the final image.

The atmosphere pass reconstructs view/world position from depth,
classifies sky, and owns aerial haze, height fog, sun disc/shaft, lens flare,
and distance grading. Its optional post-process cloud shadow is explicitly
disabled in its configuration, avoiding duplicate ownership with material
lighting.

## selective gallery pipeline selective gallery graph

The gallery owns three composers:

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

## atlas-based renderer composer graph

atlas-based renderer performs a separate depth prepass into a depth-stencil target before
the composer:

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

selective gallery pipeline caps DPR from both device and pixel budget:

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

## Failure analysis

- production WebGPU pipeline API names are version-sensitive; `PostProcessing` was renamed
  and deprecated in favor of `RenderPipeline` in current Three.js history.
- selective gallery pipeline selective bloom renders the scene multiple times.
- selective gallery pipeline manual shadow invalidation can freeze unregistered motion.
- atlas-based renderer depth prepass renders regular scene materials, not an explicit depth
  override; verify transparent and alpha-tested behavior.
- atlas-based renderer composer may not be the active runtime path.
- The frost blur has a zero-weight division risk and pointer decay is frame
  based.
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
