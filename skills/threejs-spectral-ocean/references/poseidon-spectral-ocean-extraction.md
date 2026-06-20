# Poseidon spectral-ocean extraction

Use this reference for a large, unbounded-looking ocean whose identity comes from spectral synthesis rather than a small authored wave set.

The implementation evidence was reviewed from
[`owenyuwono/poseidon`](https://github.com/owenyuwono/poseidon) at revision
`caddf773c7e2b7c9b00ad232d21cca4f364d5272`.
No repository or package license was observed. Treat this document as a
conceptual extraction: reproduce mechanisms independently and do not copy
Poseidon source.

## 1. Architecture contract

Keep these stages distinct and inspectable:

```text
sea-state parameters
  -> deterministic Gaussian field
  -> initial directional spectrum h0(k)
  -> conjugate packing h0(k), conj(h0(-k))
  -> time-evolved packed frequency fields
  -> horizontal IFFT stages
  -> vertical IFFT stages
  -> centered-spectrum permutation
  -> displacement + derivative + foam-history maps
  -> displaced surface + optical shading
```

One cascade owns one patch length and one disjoint wavenumber interval. Shared
sea-state uniforms and Gaussian seeds keep the cascades statistically related;
separate buffers prevent writes from aliasing.

The reviewed 256², three-cascade configuration uses:

```ts
const oceanPreset = {
  resolution: 256,
  patchLengthsMeters: [250, 17, 5],
  boundaryFactor: 6,
  depthMeters: 500,
  gravity: 9.81,
  choppiness: 1.3,
}
```

Treat these as a validated starting scale, not universal constants.

## 2. Cascade partition

For cascade `i`, define:

```text
deltaK(i) = 2π / patchLength(i)
handoff(i) = 2π / patchLength(i) * boundaryFactor
```

Use:

```text
cascade 0: [epsilon, handoff(1)]
cascade 1: [handoff(1), handoff(2)]
cascade 2: [handoff(2), largeUpperBound]
```

The in-band mask must be applied after all singular inputs have been made safe.
Do not rely on multiplication by zero to hide `1/0`, `sqrt(NaN)`, or infinite
frequency derivatives. Clamp the evaluated wavenumber first:

```glsl
float kSafe = max(kLength, cutoffLow);
float inBand =
  step(cutoffLow, kLength) *
  step(kLength, cutoffHigh);
```

Debug every cascade as a centered spectrum heatmap. Adjacent bands may touch
at a boundary; they must not overlap broadly or leave a visible spectral hole.

## 3. Initial directional spectrum

Generate two independent standard-normal values per grid cell once. Seed the
generator explicitly so image comparisons and regression tests are stable.

For each centered grid coordinate:

```text
k = (gridIndex - N/2) * deltaK
omega(k) = sqrt(g * |k| * tanh(min(|k| * depth, 20)))
```

The reviewed sea state sums two spectra:

```text
energy =
  localWindSea(omega, direction)
  + swell(omega, direction)
```

Each term combines:

```text
JONSWAP frequency energy
* TMA finite-depth correction
* directional spreading
* exp(-shortWaveFade² * |k|²)
```

Compute JONSWAP peak terms from wind speed and fetch:

```text
alpha = 0.076 * (g * fetch / windSpeed²)^(-0.22)
peakOmega = 22 * (windSpeed * fetch / g²)^(-0.33)
```

Use the standard JONSWAP sigma split around the peak (`0.07` below, `0.09`
above), peak enhancement `gamma`, and an explicit scale per local/swell lobe.

Directional spreading must rotate around the configured wind angle and tighten
as the frequency approaches the energetic range. The reviewed system blends a
broad cosine-squared base with a Donelan–Banner-style powered cosine lobe.

Initial complex amplitude:

```text
amplitude =
  sqrt(
    energy
    * 2
    * abs(dOmega/dk)
    / kSafe
    * deltaK²
  )

h0(k) = gaussianComplex(k) * amplitude * inBand
```

Expose at least:

```text
local-only spectrum
swell-only spectrum
combined spectrum
in-band mask
frequency derivative
```

## 4. Hermitian pairing and packed fields

Real spatial fields require conjugate symmetry. Store:

```text
packedH0(k) = [h0(k), conjugate(h0(-k))]
```

At time `t`:

```text
h(k,t) =
  h0(k) * exp(i * omega * t)
  + conjugate(h0(-k)) * exp(-i * omega * t)
```

Compute horizontal displacement from `i * k / |k| * h`, vertical displacement
from `h`, and spatial derivatives by multiplying by the relevant wave-number
components.

Pack two real spatial fields into one complex IFFT input. A useful four-buffer
layout is:

```text
field 0: horizontal displacement X + i horizontal displacement Z
field 1: height + i cross derivative
field 2: height slope X + i height slope Z
field 3: horizontal derivative XX + i horizontal derivative ZZ
```

Packing halves the number of transforms. Document the unpacking algebra next
to the field contract; a swapped real/imaginary sign can look plausible while
rotating or mirroring the sea.

## 5. GPU inverse FFT schedule

Precompute a butterfly table on the CPU for every FFT stage and output column:

```ts
type ButterflyEntry = {
  twiddleReal: number
  twiddleImaginary: number
  inputA: number
  inputB: number
}
```

For each complex field:

1. execute `log2(N)` horizontal butterfly stages;
2. execute `log2(N)` vertical butterfly stages;
3. multiply by `(-1)^(x+y)` to reconcile centered frequency coordinates.

Ping-pong between the field buffer and a dedicated scratch buffer. Never let
two logical fields share scratch storage during the same stage.

The critical backend rule from the reviewed WebGPU path is:

```text
one FFT stage -> one compute submission boundary
```

Do not assume writes from one dispatch are visible to the next dispatch inside
an implementation-defined combined pass. Batch independent fields at the same
stage into one submission, then submit the next stage:

```ts
for (let stage = 0; stage < logN; stage++) {
  renderer.compute(allHorizontalFieldsAt(stage))
}
for (let stage = 0; stage < logN; stage++) {
  renderer.compute(allVerticalFieldsAt(stage))
}
renderer.compute(allCenteringPermutations)
```

Inspect the installed renderer before relying on this exact API shape.

## 6. FFT hard gate

Validate the transform before connecting the spectrum:

```text
test A:
  centered DC impulse
  expected spatial result = constant complex (1, 0)

test B:
  centered one-bin X-frequency impulse
  expected spatial result =
    cos(2πx/N) + i sin(2πx/N)
```

Measure maximum absolute error over every texel. A practical gate for half- or
single-precision storage is `1e-3`, adjusted only with evidence.

If either test fails, stop. Do not tune spectrum amplitude, choppiness, or
shading around a broken transform.

Diagnostic causes:

```text
constant test alternates signs -> missing or duplicated centering permutation
sine direction reversed -> inverse twiddle sign is wrong
frequency appears on Y -> horizontal/vertical indexing is swapped
every other stage corrupts -> ping-pong source/destination parity is wrong
random blocks -> missing inter-stage visibility boundary
```

## 7. Spatial map assembly

Assemble filterable repeating textures after the IFFT:

```text
displacement.rgba =
  [lambda * Dx, height, lambda * Dz, foamHistory]

derivatives.rgba =
  [dHeight/dx, dHeight/dz, lambda * dDx/dx, lambda * dDz/dz]
```

Half-float storage textures are a strong bandwidth/quality compromise when the
target backend supports storage writes and filtered sampling for that format.
Verify capabilities rather than assuming them.

## 8. Jacobian whitecaps with history

Choppy horizontal displacement can fold. Build the 2×2 horizontal mapping
Jacobian:

```text
jxx = 1 + lambda * dDx/dx
jzz = 1 + lambda * dDz/dz
jxz = lambda * dDz/dx
J = jxx * jzz - jxz²
```

Low or negative `J` identifies real fold/compression regions. Store a persistent
per-texel history initialized to `1`.

One effective update shape is:

```text
historyNext =
  min(
    currentJacobian,
    historyPrevious
      + dt * recoveryRate / max(currentJacobian, 0.5)
  )
```

This snaps toward a breaking event and recovers gradually. Keep simulation
history separate from the display threshold:

```text
foamCoverage =
  smoothstep(lowCoverage, highCoverage,
    sum(saturate((foamThreshold - history) * foamScale)))
```

Do not include a finest cascade that produces constant speckle merely because
it is available. Validate each cascade’s foam contribution separately.

## 9. Fold-aware surface normal

Sum derivative maps across cascades. Horizontal compression changes the height
slope denominator:

```text
slopeX = sum(dHeight/dx) / (1 + sum(lambda * dDx/dx))
slopeZ = sum(dHeight/dz) / (1 + sum(lambda * dDz/dz))
normal = normalize([-slopeX, 1, -slopeZ])
```

This keeps normals coupled to choppy displacement. A normal derived from height
alone misses overturning/compression behavior.

Add sub-grid normal detail only after this resolved normal exists. Sample a
seamless detail field at two independently scrolling scales and keep its
strength low enough that it cannot rewrite the swell direction.

## 10. Optical composition

Use one sky-radiance function for both the dome and reflected ray:

```text
sky(direction) =
  horizon-to-zenith gradient
  + narrow sun disc
  + broad sun halo
```

Water-air Fresnel:

```text
F = 0.02 + 0.98 * (1 - saturate(N·V))^5
```

Build the body term from deep color plus crest scatter. The reviewed mechanism
uses a view/sun/normal half-vector response weighted by crest height, then:

```text
water = mix(body, sky(reflect(-V, N)), F)
```

Foam changes the final response rather than adding a white texture. Shade it
with sun/sky incidence and modulate brightness with a separate bubbly detail
field. Do not punch noisy holes in the physically derived foam coverage.

The visible sky and reflected sky must share:

```text
sun direction
sun color
horizon color
zenith color
```

Otherwise the reflection will appear pasted onto the surface.

## 11. Runtime order

Use this order each frame:

```text
update time and dt uniforms
compute all time-dependent spectra
submit horizontal FFT stages
submit vertical FFT stages
submit centering permutations
assemble maps and update foam history
update optional spray
render ocean and sky
resolve GPU timing asynchronously
```

Sea-state changes that alter `h0` should recompute the initial spectrum on
interaction release, not continuously while dragging a control.

## 12. Geometry, camera, and fog

The reviewed presentation uses:

```text
camera FOV: 55°
camera: (0, 16, 68)
target: (0, 0, -20)
surface: 400 m square, 900 × 900 subdivisions
fog: horizon-colored exponential fog
```

The dense plane is justified because displacement is evaluated per vertex.
Scale tessellation against the smallest resolved cascade and camera distance.
Fog must hide the finite mesh edge before the plane ends.

Lower-cost modes should preserve the mechanism:

```text
high: 256², 3 cascades, dense mesh, persistent foam
medium: 256², 2 cascades, lower mesh tessellation, persistent foam
low: 128², 2 cascades, no spray, reduced detail texture
```

Do not call a four-wave analytic surface a low-quality FFT tier; that is a
different representation and should be routed to `$threejs-water-optics`.

## 13. Required diagnostics

Expose:

```text
FFT test errors
Gaussian seed field
per-cascade in-band spectrum
time-evolved frequency magnitude
spatial height
horizontal displacement
height slopes
horizontal derivatives
Jacobian determinant
foam history
foam display coverage
resolved normal
sub-grid normal contribution
final without foam
final without detail
GPU milliseconds by compute and render phase
```

Capture a fixed camera at multiple times. A single attractive frame cannot
prove temporal stability, transform correctness, or foam persistence.

## 14. Failure diagnosis

```text
periodic square tiles:
  cascade lengths or camera coverage expose repetition; add disjoint scales

all waves travel in one artificial line:
  directional spread is too narrow or wind/swell angles are identical

energy explodes near the center:
  DC/small-k singularities are evaluated before masking

surface moves but normals lag:
  derivative maps are stale or sampled with different coordinates

white noise foam:
  thresholding finest-cascade compression without temporal filtering

foam disappears instantly:
  history is not persistent or recovery is interpreted as decay-to-zero

foam never clears:
  recovery sign or Jacobian denominator clamp is wrong

glitter detached from sun:
  visible sky and reflection use different sun direction or color

GPU corruption after increasing N:
  FFT stage count, butterfly table, index type, or scratch allocation is wrong
```

