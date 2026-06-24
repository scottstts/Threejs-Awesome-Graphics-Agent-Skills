# HDR bloom systems

Use this reference to choose bloom ownership, signal order, selective contribution, and scene-relative emissive ranges without making bloom responsible for the underlying form.

## Contents

- production WebGPU pipeline signal order
- production WebGPU pipeline bloom controls
- selective gallery pipeline selective ownership
- Material substitution invariant
- atlas-based renderer baseline
- pooled VFX system HDR hierarchy
- Implementation limits
- Diagnostics


## production WebGPU pipeline signal order

The WebGPU pipeline owns bloom before exposure and render output:

```text
scene pass
  -> optional GTAO composite
  -> optional atmosphere
  -> bloom node
  -> sampled scene + bloom
  -> eye-adaptation exposure
  -> renderOutput / tone map
  -> optional 3D LUT
  -> optional FXAA
```

The render pipeline disables its automatic output color transform and assigns
one final output node. Preserve this one-owner rule when adapting to current
Three.js `RenderPipeline`.

## production WebGPU pipeline bloom controls

Bloom defaults:

```text
enabled = false
strength = 0
radius = 0.35
threshold = 0.72
smooth width = 0.08
```

The Three.js bloom node reads the HDR texture produced after atmosphere. Its
strength becomes zero when disabled; radius, threshold, and smooth width remain
independently updatable.

This path does not implement a custom pyramid. Its contract is signal placement
and parameter ownership around the renderer’s bloom node.
Verify the installed Three.js node API before using the exact constructor or
property names.

## selective gallery pipeline selective ownership

The gallery uses two separate selective bloom pipelines:

```text
neon layer -> neon UnrealBloomPass
chandelier layer -> chandelier UnrealBloomPass
base scene -> final composer

final = base + neon bloom + chandelier bloom
```

Each bloom composer renders off-screen. A final shader adds both bloom textures
to the base render, then an `OutputPass` performs display output.

Separate ownership lets neon animation change strength/radius without forcing
the chandelier glow to share the same threshold or spread.

Chandelier bulbs, filaments, and glow meshes use unlit materials; bulb and
filament materials set `toneMapped = false`. The pipeline therefore combines
explicit layer membership with material-level HDR/display behavior.

## Material substitution invariant

For each selective pass, selective gallery pipeline traverses visible meshes and replaces every
non-member material with one shared black material.

Required transaction:

```text
set active bloom layer
traverse visible meshes
record { mesh, original material }
replace non-members with shared black material
try:
  render bloom composer
finally:
  restore every recorded material
  clear restoration list
```

Support material arrays by storing the complete original `mesh.material`
value. Also toggle the high-detail and simplified
chandelier representations so only the intended version contributes.

The `finally` block is non-negotiable. Without it, a render error permanently
blackens scene meshes.

## atlas-based renderer baseline

atlas-based renderer wraps `UnrealBloomPass` with:

```text
strength = 0.30
radius = 0.50
threshold = 0.05
```

Composer order:

```text
scene -> SSAO -> volumetrics -> bloom -> lens flare -> fog/color
```

This is a useful comparison, not the quality target. The threshold is very low
and can bloom ordinary bright surfaces. The wrapper exposes only enabled,
strength, and threshold, while radius stays at its constructor value.

## pooled VFX system HDR hierarchy

pooled VFX system assigns compact effect luminance before bloom:

```text
spark initial RGB multiplier = 80
homing projectile = 30
laser = 10
```

These values establish a material-level contribution hierarchy, but they do
not define the bloom pass. Validate them against actual renderer exposure
before reuse.

Use the relationship, not the raw numbers:

```text
short spark flash
  > projectile core
  > persistent laser
  > ordinary lit surface
```

## Implementation limits

- selective gallery pipeline renders the scene multiple times for selective bloom. This is
  acceptable for its bounded gallery but expensive for large scenes.
- Temporary material substitution can trigger shader/program changes and must
  account for newly added meshes.
- The final selective gallery pipeline composite adds bloom textures directly; energy is
  artistic, not physically conserved.
- atlas-based renderer’s low threshold is not evidence for a general HDR calibration.
- production WebGPU pipeline depends on version-sensitive Three.js bloom-node behavior.
- pooled VFX system material multipliers are scene-relative and cannot be treated as
  exposure-independent units.

Prefer a dedicated contribution target when MRT/backend architecture supports
it and the scene cannot afford multiple full renders. Validate that decision
against the target scene’s measured cost and contribution masks.

## Diagnostics

Expose:

```text
HDR scene before bloom
false-color luminance
neon contribution
chandelier contribution
each bloom result
base without bloom
final composite
active layer membership
material restoration count and leak assertion
transparent-emitter contribution
bloom GPU time per render
```

Acceptance requires the base frame to retain form and material hierarchy with
both bloom textures disabled.
