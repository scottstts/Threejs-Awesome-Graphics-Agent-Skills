# `procedural-bank` GTAO and bent-normal extraction

Use this reference for a bounded-cost WebGPU/TSL screen-space ambient
visibility pass with directional ambient tint.

Reviewed source:

```text
repository: https://github.com/vibe-stack/procedural-bank
revision: 0034e80a61f02b88dbe13a385bdab734a365b82d
gather:
  src/scene/post-processing/gtao.ts
composite:
  src/scene/post-processing/gtao-composite.ts
depth contract:
  src/scene/post-processing/depth-constants.ts
```

## 1. Preserve the actual budget

The reviewed gather uses:

```text
resolution scale     0.5 × 0.5
slices               2
steps per side       4
sides per slice      2
depth taps           16 per half-resolution pixel
target               RGBA16F
RGB                   bent direction encoded to [0, 1]
A                     scalar visibility, 1 = open
```

Half linear resolution means one quarter of full-resolution fragments.

The source targets an approximately `2 ms` budget by combining:

- half-resolution gather;
- few slices;
- interleaved-gradient-noise rotation;
- direct UV marching;
- one view-position reconstruction per tap;
- sky early-outs in gather and composite.

Do not increase slices first. Validate whether the bilateral pass and stable
rotation already remove directional structure.

## 2. Use the source depth convention

The source uses reversed depth:

```text
sky threshold          0.000001
maximum reconstruction 0.999999
```

Sky is cleared to zero. Far terrain remains above the sky threshold.

Gather:

```text
if rawDepth <= 1e-6:
  output visibility = 1
  output encoded bent = encoded view normal
  skip all 16 taps
```

Composite clamps depth to `[0, 0.999999]` before linearization so sky
neighbours do not create extreme view-Z values.

Do not port these thresholds to a forward-depth target unchanged.

## 3. Preserve world-radius projection

Default controls:

```text
radius              0.5 m
intensity           1.0
power               1.6
thickness           0.35 m in view Z
bentNormalStrength  0.6
```

The horizontal projection scale is cached from:

```text
camera.projectionMatrix.elements[0]
```

and refreshed every frame.

World radius becomes UV reach:

```text
radiusUv =
  radius
  * projectionScaleX
  / max(-viewPosition.z, 0.0001)
  * 0.5

radiusUv = clamp(radiusUv, 0.004, 0.08)
```

This clamp prevents near surfaces searching half the screen and stops far
surfaces collapsing to a useless footprint.

Observed adaptation issue: only the X projection term is used, then one scalar
radius is applied to both UV axes. At unusual aspect ratios or asymmetric
projections, derive a `vec2` reach from both projection axes.

## 4. Rotate two horizon slices per pixel

For slice `i`:

```text
noise = interleavedGradientNoise(screenCoordinate)
angle = (i / 2 + noise) * PI
sliceDirection = (cos(angle), sin(angle))
```

The axis covers both positive and negative directions, so angles only span
`PI`, not `2 * PI`.

Step spacing:

```text
t = (stepIndex + noise + 0.5) / 4
stepUv = sliceDirection * radiusUv * t
```

The shared noise rotates slices and jitters their radial positions.

The reviewed pass has no temporal accumulation. Its stability depends on the
noise being screen-stable and the full-resolution spatial composite.

## 5. Keep horizon angle and distance falloff separate

For each positive and negative sample:

```text
delta = sampleViewPosition - centerViewPosition
distance = max(length(delta), 0.0001)
falloff = saturate(1 - distance / max(radius, 0.0001))
```

Accept the sample only when:

```text
abs(delta.z) < thickness
```

Raw horizon cosine:

```text
cosine = dot(delta, viewDirection) / distance
```

Apply distance falloff by mixing toward fully open:

```text
horizon = mix(-1, cosine, falloff)
maxHorizon = max(maxHorizon, horizon)
```

Do not multiply the cosine directly by falloff. Mixing toward `-1` weakens a
distant occluder without changing the angle of a nearby one.

Per slice:

```text
positiveAngle = acos(clamp(positiveHorizon, -1, 1))
negativeAngle = acos(clamp(negativeHorizon, -1, 1))
visibility += saturate((positiveAngle + negativeAngle) / PI)
```

Final scalar:

```text
visibility = visibility / 2
visibility = visibility ^ power
visibility = saturate(mix(1, visibility, intensity))
```

Disabling the pass sets intensity to zero; the gather still runs unless the
owner removes or bypasses the node. If disabled cost matters, bypass the pass
at pipeline construction or add an update/render gate.

## 6. Treat the bent direction as an observed heuristic

For accepted samples, the source accumulates:

```text
bentDirection +=
  normalize(delta)
  * saturate(cosine * falloff)
```

Then:

```text
bent = normalize(
  mix(
    viewNormal,
    normalize(viewDirection + bentDirection),
    bentNormalStrength
  )
)
```

The output stores `bent * 0.5 + 0.5`.

Important objective finding: the accumulated vectors point toward accepted
sample positions. A physically derived bent normal normally points toward
unoccluded directions, so do not assume this sign convention is correct in an
adaptation.

Required validation:

```text
place a flat receiver beside one vertical wall
show geometric normal
show decoded bent direction
show environment sample direction
verify the direction turns away from the blocked hemisphere
```

If it turns toward the wall, negate/rederive the directional accumulator
before using it for environment lighting.

## 7. Own gather rendering state

`GtaoNode.updateBefore()`:

1. saves/reset renderer state through `RendererUtils`;
2. reads drawing-buffer dimensions;
3. resizes the half-resolution target;
4. refreshes projection scale;
5. renders one fullscreen `QuadMesh`;
6. restores renderer state.

Dispose both the target and node material.

Do not let a post node leak render target, viewport, or material state into the
main pipeline.

## 8. Upsample with the exact reviewed kernel

The full-resolution composite gathers eight neighbours:

```text
left, right, up, down
four diagonals
center omitted
```

Each weight is depth-only:

```text
weight = exp(-abs(sampleViewZ - centerViewZ) / 0.5)
```

If total weight is above `0.01`, normalize the eight-sample sum. Otherwise use
the center AO texel.

The source comment calls this a `3×3 cross`, but it is the eight-neighbour ring
with the center skipped.

The rationale is to cover the four-pixel interleaved-gradient-noise repeat
while sampling across half-resolution AO texels.

Observed limitation: `screenTexelHint()` returns only:

```text
1 / screenWidth
```

and uses that scalar for both X and Y offsets. At non-square viewports the
vertical step is wrong. Adapt as:

```text
texel = vec2(1 / width, 1 / height)
```

Observed limitation: the filter has no normal-similarity weight despite having
the normal buffer available later in the composite. Thin foreground/background
contacts may need:

```text
weight *= pow(saturate(dot(centerNormal, sampleNormal)), normalPower)
```

Add this only after confirming the depth-only kernel causes cross-edge leakage;
normal buffers can be noisy at hard edges.

## 9. Apply AO only to reconstructed indirect light

The source does not multiply final scene color by AO.

It approximates indirect light:

```text
irradiance =
  PMREM sampled along bent direction at texture level 1
  or fallback cavity color (0.55, 0.62, 0.78)

indirectEstimate =
  albedo
  * environmentIntensity
  * irradiance

indirect = min(indirectEstimate, sceneColor)
direct = sceneColor - indirect
```

The clamp ensures direct light never becomes negative.

Then:

```text
occludedIndirect = indirect * visibility

deviation =
  saturate(1 - dot(decodedBentView, geometricViewNormal))

tintAmount =
  deviation
  * (1 - visibility)
  * bentTintStrength

bentTintStrength default = 0.35

tintedIndirect =
  mix(
    occludedIndirect,
    occludedIndirect * irradiance,
    saturate(tintAmount)
  )

output = direct + tintedIndirect
```

This keeps direct sun and most specular response out of the AO multiply.

The indirect reconstruction is still approximate because it works from a
forward-shaded scene color and an albedo MRT. Specular energy can leak into
the `direct` residual. Prefer a renderer-provided indirect-diffuse signal when
available.

## 10. Verify view/world transform semantics

The reviewed composite decodes the bent direction in view space and calls:

```text
transformDirection(bentView, cameraViewMatrix)
```

while describing the result as view-to-world.

Matrix-direction semantics in TSL are version-sensitive. Verify the installed
Three.js behavior with axis probes:

```text
camera facing -Z:
  view (0, 0, 1) maps to expected world direction

camera rotated 90 degrees:
  decoded bent direction rotates with the camera exactly once
```

Do not copy the matrix expression solely from the comment.

## 11. Temporal behavior

The reviewed revision has no motion vectors, history target, reprojection,
neighborhood clamp, or disocclusion rejection.

Do not describe it as temporally accumulated GTAO.

If adding temporal accumulation:

1. preserve raw half-resolution visibility and bent direction;
2. add representative depth/normal validity;
3. reproject with velocity;
4. clamp scalar visibility to the current neighborhood;
5. constrain bent history by angular deviation;
6. reset on camera cuts and resolution changes.

First verify whether the current stable-noise plus bilateral pass already meets
the target. Temporal history adds ghosting risk to moving procedural geometry.

## 12. Required diagnostics

Expose:

```text
raw reversed depth and linear view Z
sky classification
view normal
projected radius UV/pixels
slice angle and jitter
positive/negative horizon cosine
thickness acceptance
distance falloff
visibility before power/intensity
raw encoded and decoded bent direction
one-sided-wall bent-direction test
eight bilateral sample depths and weights
X/Y texel offsets
upsampled visibility
albedo and environment irradiance
indirect estimate before/after scene-color clamp
direct residual
tint deviation and amount
final direct versus indirect contribution
GPU time for gather and composite
```

Failure diagnosis:

```text
AO radius changes with distance incorrectly:
  world radius was replaced by a fixed pixel radius

far surfaces lose all contact:
  projected radius was not clamped to a minimum

thick silhouette halos:
  thickness or depth-only bilateral weights cross discontinuities

vertical blur differs from horizontal blur:
  width-derived scalar texel size was used for Y

bent tint points into walls:
  the observed accumulator sign was accepted without a one-sided-wall test

sunlit surfaces become gray:
  visibility multiplied final scene color instead of reconstructed indirect

disabled AO still costs the full pass:
  intensity was set to zero without bypassing gather rendering

camera rotation changes tint incorrectly:
  view-to-world direction transform semantics were not verified
```
