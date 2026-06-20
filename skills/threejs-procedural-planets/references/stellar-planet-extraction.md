# Stellar planet extraction

Use this reference when adapting the practical planet-space field, material,
LOD, and atmosphere handoff patterns reviewed in
[`scottstts/Stellar`](https://github.com/scottstts/Stellar) at revision
`ad8062b54ec86312d7c028d46727796eb802c9b2`.

Reviewed files:

```text
src/game/runtime/solar/terrain.ts
src/game/runtime/solar/bodySurface.ts
src/game/runtime/solar/bodyMaterial.ts
src/game/runtime/solar/atmosphere.ts
src/game/runtime/solar/definitions/*.ts
```

This is an extraction of effective mechanisms and observed weaknesses. Do not
assume every source choice is the desired endpoint.

## 1. Preserve undeformed sphere direction

At geometry construction, write the normalized pre-displacement direction into
a dedicated attribute:

```ts
surfaceDirection[i] = normalize(originalSpherePosition)
```

Use that attribute for all shader geology:

```ts
const radial = attribute("surfaceDirection", "vec3").normalize()
const terrainCoordinateKm = radial * radiusKm
```

This prevents interpolated displaced positions from stretching noise on steep
slopes. It is stronger than reconstructing direction from `positionLocal`
after displacement.

## 2. Geometry terrain stack

The CPU geometry path uses deterministic value noise:

```text
base frequency:
  moon 12.5
  rocky 10.2
  other solid 8.4

coordinate warp:
  three value-noise channels at 0.75 frequency
  amplitude 2.4 in local noise coordinates

continental:
  5 octaves, frequency multiplier 0.55,
  lacunarity 2.03, gain 0.50

highlands:
  4 octaves, frequency multiplier 1.25,
  lacunarity 2.15, gain 0.55

ridges:
  4 octaves, frequency multiplier 2.7,
  lacunarity 2.08, gain 0.52
  transformed as 1 - abs(2n - 1)

crater-like depression for rocky/moon:
  3 octaves at 6.8
  pow(1 - saturate(noise), 3.2)
```

Composite:

```text
height =
  0.62 * continental
  + 0.24 * highlands
  + 0.34 * ridges
  - 0.30 * craterLike
```

Terrestrial bodies add a small latitude term. Rocky bodies reinforce ridges.
The result is remapped to `[-1, 1]` and multiplied by the body’s
`terrainAmplitude`.

This stack is effective for silhouette-scale relief, but its crater term is a
noise-shaped cavity field, not a crater model with explicit bowl/rim/ejecta
topology.

## 3. Geometry LOD contract

The source builds four complete sphere meshes and switches through `THREE.LOD`
with `0.16` hysteresis.

Terrestrial:

```text
segments: 380, 296, 228, 172
altitude transitions: 2400, 5600, 7600 km
```

Rocky:

```text
segments: 344, 268, 206, 156
altitude transitions: 2200, 5000, 5800 km
```

Generic displaced solid:

```text
segments: 320, 248, 192, 148
altitude transitions: 1800, 4000, 5200 km
```

Distances are converted through the runtime render scale:

```text
distanceWorld = (radiusKm + transitionAltitudeKm) * renderScale
```

The same deterministic CPU height function runs for every LOD, preserving the
macro silhouette across switches.

For a stronger production implementation, avoid storing four full high-density
spheres when a chunked quadtree/icosahedral patch system is required. The source
LOD is practical for whole-body views, not ground-scale terrain streaming.

## 4. Shader tangential warp

The material path starts from radius-scaled sphere direction:

```text
warp coordinate = terrainKm * 0.00115 + seeded offset
warp = three independent noise channels - 0.5
warpTangent = warp - radial * dot(warp, radial)
warpAmplitudeKm = max(radiusKm * 0.012, 36)
warpedKm =
  normalize(terrainKm + warpTangent * warpAmplitudeKm)
  * radiusKm
```

This removes radial warp and reprojects to the shell, preventing region-scale
coordinate dilation.

Base material fields:

```text
macro A frequency 0.00034, weight 0.52
macro B frequency 0.00092, internal scale 0.52, composite weight 0.33
ridge frequency 0.0029, weight 0.25
crater-like frequency 0.0069, exponent 2.9
crater weight:
  rocky/moon 0.34
  other 0.09
```

The material mixes the synthesized macro field with the actual displaced
radius:

```text
macroHeight =
  mix(shaderMacroSynthesis, geometryDisplacementHeight, 0.08)
```

This is a visual alignment correction, not true function parity.

## 5. Objective geometry/material mismatch

The geometry path uses CPU value noise. The material path uses
`mx_noise_float` with different frequencies, seed offsets, warp behavior, and
body-specific fields.

Consequences:

```text
shader ridges can cross geometry valleys
close bump normals can imply relief absent from silhouette
biome altitude can disagree with actual displaced height
LOD silhouette remains stable, but material causes are only approximately tied
```

The source mitigates this by:

- preserving `surfaceDirection`;
- blending 8% actual displacement into material macro height;
- reducing detail by camera altitude;
- keeping geometric terrain amplitude modest.

The target skill should improve this when possible:

1. implement one shared deterministic field in CPU and shader forms;
2. validate sampled parity at fixed directions;
3. derive biome altitude from that shared field;
4. reserve material-only detail for sub-mesh-scale normal/roughness variation.

Do not cite Stellar as evidence that independent geometry/material fields are
ideal.

## 6. Altitude-filtered detail

Compute camera altitude from body center and radius, then clamp against an
external detail-altitude uniform:

```text
detailAltitude =
  min(cameraAltitude, surfaceDetailAltitude)
```

Thresholds:

```text
near = max(radius * 0.022, 6.5 world units)
mid  = max(radius * 0.11, 24 world units)
far  = max(radius * 0.50, 140 world units)

nearWeight = 1 - smoothstep(near, mid, altitude)
farWeight = smoothstep(mid, far, altitude)
midWeight = saturate(1 - nearWeight - farWeight)
```

Use these weights for:

- normal perturbation;
- bump height;
- coastline edge width;
- wave detail;
- clearcoat;
- material micro-variation.

Do not change procedural frequency abruptly. Fade contribution strength.

## 7. Climate and biome causes

The shared solid-body material derives:

```text
humidity =
  0.65 * broadNoise(0.0022)
  + 0.35 * detailNoise(0.0075)

temperature =
  (1 - abs(latitude)^1.35) * 0.85
  + 0.15
  - macroHeight * 0.32

slope =
  1 - abs(dot(localNormal, radialDirection))
```

Biome jitter uses a higher-frequency field at `0.018`.

Generic masks:

```text
snow: latitude + height + cold + small jitter
arid: inverse humidity + warmth - height + jitter
lush: humidity * temperature - aridity - slope + jitter
rock: slope + ridges + inverse humidity + jitter magnitude
```

The body-specific paths expand these causes rather than switching to arbitrary
color noise.

## 8. Pelagia terrestrial path

Pelagia’s definition:

```text
radius 12000 km
terrain amplitude 0.018
atmosphere height 200 km
atmosphere density 1.05
```

Continents use an additional low-frequency three-channel warp with a fixed
`520 km` amplitude, followed by:

```text
continent frequencies: 0.00022, 0.00048, 0.00095
weights: 0.60, 0.28, 0.12
coast jitter: 0.0024
coast micro-jitter: 0.0085
```

The source keeps two coast widths:

```text
visual color edge:
  altitude-filtered 0.016 -> 0.004

physical land/water edge:
  altitude-filtered 0.006 -> 0.0014
```

This prevents orbit-view aliasing while keeping water material classification
sharper.

Terrain causes include:

- ridged tectonic chains and foothills;
- altitude lapse-rate cooling;
- subtropical aridity bands;
- forest coverage fields;
- tropical, temperate, boreal, desert, tundra, ice, rock, snow, and beach
  weights;
- depth-graded ocean color;
- water currents and animated wave detail;
- wetness-driven roughness/specular/clearcoat.

This path is useful because land color, roughness, normal, snow, wetness, and
water identity share causes.

## 9. Astra rocky path

Astra’s definition:

```text
radius 5600 km
terrain amplitude 0.008
thin 45 km atmosphere
```

Its material adds:

```text
basin-scale crater-like field at 0.00028
regional crater-like field at 0.0018
micro fields at 0.012 and 0.035
intercrater plains
bright ejecta-like ridges
lobate scarp-like ridges
volatile-loss hollow masks
three-band surface detail
```

Crater rims are estimated from offset-noise gradient magnitudes. Ejecta rays
are ridged noise correlated with the regional crater field.

This produces a rich Mercury-like material, but the “craters” remain
field-shaped rather than explicit geodesic crater stamps. Use the source as
evidence for multi-scale material causality, not as the final crater geometry
algorithm.

## 10. Verdance rocky path

Verdance’s definition:

```text
radius 13600 km
terrain amplitude 0.02
200 km dusty atmosphere
```

Its Mars-like identity layers:

- hemispheric dichotomy with warped boundary;
- broad volcanic province and caldera mask;
- ridged equatorial canyon system;
- degraded highland and lowland crater fields;
- wind-aligned dunes;
- global dust mantling;
- dark slope streaks;
- limited basalt exposure;
- polar CO2 ice and layered polar terrain.

Wind-aligned dune coordinates are built from a fixed wind basis:

```text
u = dot(position, windDirection)
v = dot(position, perpendicularWindDirection)
```

Macro and meso ridge fields are filtered with derivatives to reduce aliasing.

## 11. Gas and ice giants

Avoid longitude seams by representing longitude on a unit circle:

```text
longitude = atan(z, x)
advectedLongitude = longitude + time * jetSpeed(latitude)
longitudeVector = [cos(advectedLongitude), sin(advectedLongitude)]
```

Build the procedural coordinate from:

```text
[longitudeVector.x, longitudeVector.y, latitude01]
```

The source combines:

- latitude-dependent advection;
- low-frequency warp;
- 20 gas-giant or 16 ice-giant bands;
- band noise;
- turbulent ridges;
- sparse storm masks and internal swirl;
- soft terminator;
- limb darkening and limb haze;
- wrapped diffuse illumination that keeps thick cloud decks faintly luminous
  into the night-side edge.

This is a separate representation from solid terrain. Do not route gas giants
through the rocky biome stack.

## 12. Procedural bump and specular anti-aliasing

The source derives a screen-space bump normal from height derivatives:

```text
sigmaX = normalize(dFdx(positionView))
sigmaY = normalize(dFdy(positionView))
dH = [dFdx(height), dFdy(height)] * bumpScale

r1 = cross(sigmaY, normalView)
r2 = cross(normalView, sigmaX)
det = dot(sigmaX, r1)

bumpNormal =
  normalize(max(abs(det), epsilon) * normalView
            - sign(det) * (dH.x * r1 + dH.y * r2))
```

Blend this with the broader perturbed normal using altitude weights.

Then increase roughness from normal variance:

```text
sigma² = max(dot(dFdx(N), dFdx(N)), dot(dFdy(N), dFdy(N)))
kernelRoughness = min(scale * sigma², 1)
filteredRoughness =
  sqrt(baseRoughness² + kernelRoughness)
```

This is a directly reusable anti-sparkle contract for procedural planets.

## 13. Atmosphere handoff and limb clipping

The material applies distance-gated limb clipping for displaced atmospheric
bodies. It tests whether the camera ray to the fragment misses the base sphere
using an angular discriminant, avoiding catastrophic precision loss at large
distances.

Clip strength grows with:

```text
atmosphere visual height fraction
body radius fraction
minimum world-space fade range
camera detail altitude
```

Pelagia and Verdance disable the clip beyond about `10000 km` altitude with a
`1200 km` fade range.

Atmosphere rendering uses one model across shell and post paths, with
front/back shell opacity blended as the camera crosses the atmosphere. Preserve
that handoff; do not independently tune shell and post colors.

## 14. Refactor guidance

The reviewed `bodyMaterial.ts` is visually rich but very large and body-ID
conditional. Distill it into atomic layers:

```text
shared planet coordinates and altitude LOD
shared climate/biome causes
solid-body material assembly
gas/ice giant band system
rocky cratered identity
terrestrial continent/ocean identity
dusty Mars identity
procedural bump + specular AA
atmosphere limb handoff
```

Keep body presets as data where possible. Use specialized code only when the
representation changes, such as gas giant bands versus solid terrain.

## 15. Required diagnostics

Expose:

```text
CPU geometry height
shader macro height
their absolute difference
tangential warp magnitude
near/mid/far detail weights
continent field and coast widths
climate humidity/temperature
biome masks
rock/snow/wetness
water depth classification
body-specific geological fields
procedural bump height
normal variance roughness
limb clip mask
shell/post atmosphere blend
```

