# Authored water surface contract

Use this reference for bounded analytic water surfaces with shared displacement
and normals, derivative-filtered detail, analytic reflection, heuristic
refraction, absorption, and crest foam. For the bounded pool heightfield
simulation and its volume optics, read the `interactive-pool-volume` example.
Use `$threejs-spectral-ocean` for stochastic FFT seas and open interfaces.

## Contents

- Multi-wave displaced surface
- Shared displacement/normal contract
- Optical hierarchy
- Normal-only wave bundle
- Side-aware refraction and absorption
- Guard bands, shadowed caustics, fountains, and luminous water
- Foam and distance response
- Objective limits
- Diagnostics

## Multi-wave displaced surface

Represent the resolved surface as a small authored set of directional waves.
Each wave stores a unit XZ direction `d`, amplitude `A` in metres, wavelength
`λ` in metres, steepness `q`, and phase speed derived from gravity. Define:

```text
k = 2π / λ
ω = sqrt(g * k)
phase = k * dot(d, xz) - ω * time
horizontal offset = d * q * A * cos(phase)
vertical offset = A * sin(phase)
```

Use the same wave list for geometry, normals, crest response, and any CPU
clearance query. The mesh extent and segment count are scene-owned; keep them
large enough for the intended camera while preserving a bounded volume.

## Shared displacement/normal contract

Accumulate the tangent terms from the same phases used by displacement:

```text
Nx += d.x * k * A * sin(phase)
Ny += q * k * A * cos(phase)
Nz += d.y * k * A * sin(phase)
normal = normalize((-Nx, 1 - Ny, -Nz))
```

Do not update a normal texture, vertex deformation, or CPU height function from
an independent wave bundle. If a wave parameter changes, every consumer must
see that change in the same frame. A normal-only surface may omit horizontal
and vertical displacement, but it must still derive its normal and crest from
one shared evaluation.

## Optical hierarchy

Build the response in this order:

1. Resolve the displaced macro normal.
2. Add only the micro-wave bands that the pixel footprint can resolve.
3. Evaluate side-aware Fresnel from the camera medium.
4. Mix analytic sky reflection with transmitted scene color.
5. Apply absorption and forward scatter to the transmitted body.
6. Add crest response, glints, and foam from shared surface metrics.

Use screen derivatives to attenuate unresolved bands before they contribute to
the normal or crest. Reflection must sample the same sky radiance and sun
direction used by the visible surround. Keep reflection, transmission, and
surface response energy-controlled; constant opacity is not a Fresnel model.

## Normal-only wave bundle

For a flat mesh, evaluate directional bands in world XZ and return a packed
normal plus crest metric:

```text
RGB = normalize((-sum(d.x * k * a * sin(phase)),
                 1 - sum(q * k * a * cos(phase)),
                 -sum(d.y * k * a * sin(phase))))
A = crest metric derived from the same slopes and phases
```

Filter each high-frequency band with a footprint-aware factor such as
`1 - smoothstep(0, cutoff, footprint * k)`. Foam consumes the returned crest;
it must not scroll independently of the wave field. Do not claim geometric
parallax or silhouette displacement for this tier.

## Side-aware refraction and absorption

Classify the whole draw from one camera-medium state. With air index `n₁` and
water index `n₂`, use:

```text
eta = n₁ / n₂              above water
eta = n₂ / n₁              below water
F0 = ((1 - eta) / (1 + eta))²
F = F0 + (1 - F0) * (1 - abs(dot(N, V)))⁵
```

Sample a clamped scene-color offset from the refracted direction only for a
bounded camera-in-air volume. When scene depth is unavailable, make the
fallback explicit:

```text
path = fallbackDepth / abs(refractedDirection.y)
transmittance = exp(-absorptionPerMetre * path)
```

This is a depth estimate, not reconstructed object thickness. An open ocean or
a camera that crosses the interface needs forward projection and the optical
contract owned by `$threejs-spectral-ocean`.

## Guard bands, shadowed caustics, fountains, and luminous water

- **Screen-space refraction guard band (`15–20%`):** render the opaque scene buffer `15–20%` wider and taller than the viewport and crop on output (`$threejs-temporal-stability`). For extreme refraction rays that still exit the overscan margin, blend smoothly back toward the pixel's own UV rather than clamping to a single edge row (clamping smears vertical border stripes).
- **Sun-shadowed bed caustics:** derive caustics on shallow beds from surface curvature or refracted-ray convergence, blur by the sun's angular **radius** (`~0.265°`, half the `0.53°` disc), and mask strictly by the sun shadow map so caustics never appear inside shadows.
- **Planar reflection of surroundings:** give pools and calm rivers a waterline-clipped planar mirror reflection updated every frame (or a local probe for tiny basins) so nearby architecture and foliage reflect authentically.
- **Fountains and ballistic jets:** model water jets as ballistic streams of drops following gravity arcs, motion-blurred across frame shutter time, width-clamped near `~1 px` at distance with energy conserved, paired with an impact splash ring and spreading heightfield ripples.
- **Emissive or luminous water:** glowing water or illuminated reefs must illuminate nearby banks and rocks via local lights or probes (`$threejs-lighting-and-gi`), with underwater glow attenuated through real Beer–Lambert absorption rather than painted onto the water surface.

## Foam and distance response

Derive crest from resolved slope, Jacobian, or another surface quantity that is
already shared with displacement. Break it up with bounded noise only after the
causal crest signal exists:

```text
foam = smoothstep(threshold, 1, crest * noiseModulation)
```

Distance haze or horizon opacity may be applied to a bounded surface, but it
must remain separate from absorption and must not hide missing scene depth.

## Objective limits

- Authored waves are not a directional spectrum or an FFT sea state.
- A flat normal-only surface cannot produce geometric crest parallax.
- Screen-space refraction can sample foreground objects without depth rejection.
- Fallback path length is not measured scene thickness.
- Instantaneous crest foam has no persistent build and decay state.
- Route to `$threejs-spectral-ocean` for open-water spectral or cross-interface
  rendering.

## Diagnostics

Expose enough channels to isolate geometry, optics, and filtering:

```text
wave-band contributions
displaced position and analytic normal
normal-only versus displaced mode
derivative attenuation per micro band
crest metric before noise
Fresnel and camera-medium classification
raw refraction UV and validity
fallback path length and transmittance
reflection, transmission, scatter, glint, and foam separately
CPU versus GPU height at a camera probe
```
