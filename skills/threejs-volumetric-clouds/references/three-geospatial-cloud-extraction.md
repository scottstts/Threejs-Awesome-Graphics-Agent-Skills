# `three-geospatial` cloud extraction

Use this reference when building planetary or large-world volumetric clouds
close to the reviewed `three-geospatial` architecture.

Reviewed source:

```text
repository: https://github.com/takram-design-engineering/three-geospatial
revision: b012ad06d858fc035d88aacfd73f092f93c994e4
beauty march: packages/clouds/src/CloudsMaterial.ts, shaders/clouds.frag
density: packages/clouds/src/CloudLayers.ts, CloudLayer.ts, DensityProfile.ts,
         uniforms.ts, shaders/clouds.glsl
procedural fields: shaders/localWeather.frag, cloudShape.frag,
                   cloudShapeDetail.frag, turbulence.frag
temporal: CloudsPass.ts, CloudsResolveMaterial.ts,
          shaders/cloudsResolve.frag, varianceClipping.glsl
shadows: ShadowMaterial.ts, shaders/shadow.frag,
         structuredSampling.glsl, CascadedShadowMaps.ts
quality: qualityPresets.ts
```

## 1. Preserve the four-layer vector model

The reviewed implementation evaluates four layers in parallel as `vec4`
channels. Do not collapse them into one scalar weather field before applying
per-layer altitude, profile, shape, and detail controls.

Default active layers:

| Channel | Altitude | Height | Density | Shape | Detail | Coverage width | Shadow |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| R low | 750 m | 650 m | 0.2 | 1.0 | 1.0 | 0.6 | yes |
| G middle | 1000 m | 1200 m | 0.2 | 1.0 | 1.0 | 0.6 | yes |
| B high | 7500 m | 500 m | 0.003 | 0.4 | 0.0 | 0.5 | no |
| A spare | disabled | disabled | default | default | default | default | no |

Each layer also owns:

```ts
type Layer = {
  weatherChannel: "r" | "g" | "b" | "a"
  weatherExponent: number
  shapeAlteringBias: number
  densityProfile: {
    exponentialTerm: number
    exponent: number
    linearTerm: number
    constantTerm: number
  }
}
```

Default density profile:

```text
profile(h) =
  expTerm * exp(exponent * h)
  + linearTerm * h
  + constantTerm

default = 0.75 * h + 0.25
```

The profile is not a generic bottom/top smoothstep. It is a compact
artist-authored function that can produce rising, falling, or exponential
density by layer.

## 2. Understand the packed interval subtlety

The layer system sorts all lower/upper altitude endpoints and merges occupied
ranges. It then packs up to three intervals where the active-layer balance is
zero.

Those packed intervals are **empty gaps**, despite names such as
`minIntervalHeights` and `insideLayerIntervals`.

Beauty and shadow marches use:

```glsl
if (height is inside any packed gap) {
  skip density work;
}
```

For the default layers, the low and middle ranges merge into one occupied band
from 750–2200 m, followed by an empty gap before the 7500–8000 m high layer.

If adapting the system:

1. merge occupied layer ranges on CPU;
2. pack the complementary gaps;
3. verify the debug view labels them as skipped intervals;
4. do not accidentally skip the occupied bands.

## 3. Generate field assets once

The reviewed system renders procedural textures into repeatable targets, then
samples them during the expensive march.

### Local weather RGBA

The procedural weather texture assigns:

```text
R: low-cloud Worley FBM
G: middle-cloud Worley FBM
B: high-cloud anisotropic Perlin
A: auxiliary Perlin variation
```

Low and middle fields are intentionally separated:

```text
middle = smoothstep(1.0, 1.4, WorleyFBM(point + 0.5))
low = saturate(
  smoothstep(0.8, 1.4, WorleyFBM(point))
  - middle
)
```

The source later forces alpha to `1`, so the default spare A layer is not a
second generated weather population. Preserve observed behavior when matching
the reviewed revision.

### Base shape volume

The 3D base texture combines Perlin-Worley and Worley FBM:

```text
perlinWorley =
  remap(perlin, 0, 1, worleyFBM, 1)

baseShape =
  remap(perlinWorley, worleyFBM - 1, 1)
```

The reviewed octave weights are dominated by low frequencies:

```text
0.625, 0.25, 0.125
```

### Detail volume

The detail volume is Worley-only and builds three progressively finer FBM
bands from frequencies `2, 4, 8, 16`, again weighted toward low frequencies.

### Turbulence

The 2D turbulence texture stores a normalized curl field derived from three
offset Perlin channels. It warps shape coordinates; it is not multiplied into
final density as arbitrary noise.

Generate these textures once or only when their recipes change. The reviewed
3D render-target path requires one draw per Z layer, so regenerating each frame
is unacceptable.

## 4. Weather coverage response

For each sample:

```text
heightFraction =
  remapClamped(height, layerMin, layerMax)
```

Round cloud growth toward the upper portion:

```text
biased = heightFraction ^ shapeAlteringBias
x = clamp(2 * biased - 1, -1, 1)
heightScale = 1 - x²
```

Sample the four selected weather channels, apply each layer’s exponent, then
modulate by global coverage:

```text
factor = 1 - coverage * heightScale
density =
  remapClamped(
    mix(localWeather, 1, coverageFilterWidth),
    factor,
    factor + coverageFilterWidth
  )
```

Global coverage therefore shifts/remaps local weather. It is not a final
density multiplier.

Debug separately:

```text
raw local-weather channels
weather after exponent
heightScale
coverage factor
coverage-remapped density
```

## 5. Base shape and turbulence

Advect fields through offsets rather than regenerating them:

```text
localWeatherOffset += localWeatherVelocity * dt
shapeOffset += shapeVelocity * dt
detailOffset += detailVelocity * dt
turbulenceOffset += turbulenceVelocity * dt
```

The reviewed density path adds a radial “evolution” offset related to weather
speed, then optional turbulence:

```text
surfaceNormal = normalize(position)
evolution = -surfaceNormal * length(weatherOffset) * 20000

turbulence =
  displacement
  * (curlTexture * 2 - 1)
  * lowHeightMask
```

The turbulence mask fades out by roughly the lower 30% of each layer, so it
distorts bases and growth without scrambling the entire cloud.

Base shape:

```text
shapePosition =
  (position + evolution + turbulence)
  * shapeRepeat
  + shapeOffset

density =
  remapClamped(
    weatherDensity,
    (1 - shapeNoise) * shapeAmount,
    1
  )
```

Shape amount is per layer. High cirrus uses less base-shape influence.

## 6. Detail changes topology by height

The reviewed detail modifier is not uniform erosion.

```text
top modifier = detail^6
bottom modifier = 1 - detail

modifier =
  mix(
    top modifier,
    bottom modifier,
    remapClamped(heightFraction, 0.2, 0.4)
  )
```

This makes upper cloud detail fluffy and lower detail whippy/eroded. Then:

```text
modifier *= shapeDetailAmount
density =
  remapClamped(
    density * 2,
    modifier * 0.5,
    1
  )
```

Detail is skipped at coarse mip levels using a jittered threshold. Do not spend
high-frequency texture reads when the sample footprint cannot resolve them.

Finally:

```text
densityVector =
  saturate(
    densityVector
    * densityScales
    * profile(heightFraction)
  )

totalDensity = sum(densityVector)
layerWeight = densityVector / totalDensity
scattering = totalDensity * scatteringCoefficient
extinction =
  totalDensity * absorptionCoefficient
  + scattering
```

Guard zero total density before using layer weights in an independent
implementation.

## 7. Planetary ray interval

Intersect view rays with concentric spheres at:

```text
planet radius
minimum cloud altitude
maximum cloud altitude
shadow top altitude
```

Select near/far based on camera state:

```text
below clouds
inside total cloud layer
above clouds
ray intersects ground
```

Then clamp the far distance against opaque scene depth. The beauty march never
runs beyond the nearest opaque surface.

Return explicit diagnostic flags:

```text
ground intersection
scene occlusion
camera region
near distance
far distance
selected sphere intersections
```

## 8. Primary march policy

High/default reviewed values:

```text
max iterations: 500
minimum step: 50 m
maximum step: 1000 m
maximum ray distance: 200 km
perspective step scale: 1.01
minimum density: 1e-5
minimum extinction: 1e-5
minimum transmittance: 1e-2
```

Initial step size grows with ray entry distance:

```text
step =
  minStep
  + (perspectiveScale - 1) * rayNear
```

Jitter the first step with spatiotemporal blue noise. The reviewed code doubles
the jitter distance to suppress observed spatial aliasing.

At each sample:

1. skip packed empty altitude gaps;
2. sample rough weather;
3. if all layer densities are below threshold, take a longer mip-aware step;
4. otherwise sample base shape, optional turbulence, and detail;
5. if extinction is significant, evaluate lighting and integrate;
6. terminate at the transmittance threshold.

The source notes that long empty-space steps can band and suggests refinement.
Treat this as a known defect, not a solved feature. A robust adaptation can
binary-search the first dense crossing.

## 9. Lighting contract

Per occupied sample, evaluate:

```text
sun irradiance
sky irradiance
short optical-depth march toward sun
Beer shadow-map optical depth beyond that short march
multi-scattering approximation
optional ground bounce
sky gradient contribution
powder attenuation
```

The phase function defaults to two Henyey-Greenstein lobes. An optional fitted
large-particle phase path exists, but it requires adequate multiple scattering
to remain plausible.

Multi-scattering uses octave accumulation:

```text
for each octave:
  contribution +=
    attenuationA
    * exp(-opticalDepth * attenuationB)
    * phase(cosTheta, attenuationC)
  attenuation *= 0.5
```

Default high quality uses eight octaves.

Energy-conserving integration:

```text
stepT = exp(-extinction * stepLength)
stepScatter =
  (radiance - radiance * stepT)
  / max(extinction, epsilon)

accumulatedRadiance += accumulatedT * stepScatter
accumulatedT *= stepT
```

Representative depth is a transmittance-weighted sample distance. It is used
for aerial perspective and temporal velocity, not merely visualized.

## 10. Quarter-resolution temporal upscale

The reviewed temporal-upscale path renders the current clouds at one quarter
linear resolution:

```text
lowWidth = ceil(fullWidth / 4)
lowHeight = ceil(fullHeight / 4)
```

A 4×4 Bayer pattern chooses one current full-resolution pixel per low-resolution
texel over 16 frames. Projection jitter follows the same offset.

Current targets store:

```text
RGBA cloud radiance/transmittance
RGB representative depth + velocity
optional shadow length
```

Resolve:

1. use the newly rendered current texel when its Bayer index matches the frame;
2. otherwise choose the closest-depth sample in a 3×3 neighborhood;
3. reproject with velocity;
4. reject history outside the viewport;
5. variance-clip history against current neighbors;
6. write the resolved result and swap history buffers.

For full-resolution TAA, blend clipped history toward current with default
`temporalAlpha = 0.1`.

Reset history on:

```text
camera cut
resolution or render-scale change
weather/shape discontinuity
layer topology change
projection mode change
```

## 11. Cloud shadow representation

The shadow system is not a grayscale beauty march. Each cascade stores:

```text
R front depth
G mean extinction
B maximum accumulated optical depth
A optical-depth tail estimate after early termination
```

Beauty lighting reconstructs optical depth beyond a local short sun march from
this compact representation.

Shadow marching uses structured volume sampling:

1. choose one of three icosahedral structure normals from ray direction and
   jitter;
2. intersect regularly spaced planes perpendicular to that normal;
3. march samples on those planes.

This intentionally trades some spatial aliasing for strong temporal stability,
which matters for low-resolution cascaded shadow maps.

Default shadow budget:

```text
3 cascades
512 × 512 maps
50 iterations
100–1000 m step size
minimum transmittance 1e-4
```

Low tier:

```text
2 cascades
256 × 256 maps
25 iterations
minimum transmittance 1e-2
```

## 12. Quality tiers must remove expensive mechanisms intentionally

The reviewed low tier disables:

```text
light shafts
shape detail
turbulence
ground bounce
accurate sun/sky lookup
```

It keeps:

```text
weather-shaped density
base 3D shape
one short sun march
temporal reconstruction
cloud shadows at reduced quality
```

This is a legitimate fallback because silhouette, weather control, and
directional self-shadowing survive.

## 13. Required diagnostics

Expose:

```text
weather RGBA
per-layer height fractions
packed empty intervals
coverage-remapped density
base shape
detail modifier
turbulence displacement
final per-layer density vector
total scattering/extinction
ray near/far and scene clamp
primary/shape/detail sample counts
sun optical depth
Beer shadow-map channels
transmittance
representative depth
velocity
history UV
variance bounds
history rejection
shadow cascade index
shadow structured-sampling planes
```

## 14. Failure diagnosis

```text
clouds disappear between low and high layers:
  occupied ranges were mistaken for packed empty gaps

all cloud types share one silhouette:
  layer vectors were summed before profile/shape controls

porous smoke:
  detail was added uniformly instead of height-dependent remapping

boiling motion:
  field offsets use unrelated directions/speeds or textures regenerate

bright flat interior:
  short sun optical depth or shadow map is missing

dark featureless cloud:
  multi-scattering, sky light, or powder balance is absent

edge trails:
  representative depth/velocity is wrong or history lacks variance clipping

flickering cloud shadows:
  beauty jitter was reused instead of temporally stable structured sampling

cost scales with view distance:
  shell interval, scene depth clamp, or empty-gap skipping is broken
```

