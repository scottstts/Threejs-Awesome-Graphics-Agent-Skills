# Planet field system

## 1. Planet-space contract

Evaluate every stable surface field from the normalized planet-space position:

```glsl
vec3 pPlanet = (worldToPlanet * vec4(positionWorld, 1.0)).xyz;
vec3 dir = normalize(pPlanet);
float altitude = length(pPlanet) - planetRadius;
```

Do not use model UVs for geological structure. UV seams and pole distortion are unnecessary when a direction vector is available.

Keep one result structure:

```ts
type PlanetFields = {
  macroHeight: Node
  ridgeHeight: Node
  craterDepth: Node
  craterRim: Node
  elevation: Node
  slope: Node
  cavity: Node
  latitude: Node
  moisture: Node
  temperature: Node
  coast: Node
  biomeWeights: Node[]
  detailHeight: Node
}
```

## 2. Tangential domain warp

Create low-frequency vector noise `w(dir)`, remove its radial component, and return to the sphere:

```glsl
vec3 tangentWarp = w - dir * dot(w, dir);
vec3 warpedDir = normalize(dir + tangentWarp * warpAmount);
```

Use one or two warps for the coordinate domain. Re-warping each downstream field independently destroys geological continuity.

## 3. Macro silhouette

A useful macro field combines broad continents with directional structures:

```text
continent = remap(fbm(warpedDir * continentFrequency))
ridgeBase = 1 - abs(noise(warpedDir * ridgeFrequency))
ridge = pow(saturate(ridgeBase), ridgeSharpness) * continentInterior
macroHeight = continent * continentHeight + ridge * ridgeHeight
```

Shape the continent field before thresholding:

```text
land = smoothstep(seaLevel - coastWidth, seaLevel + coastWidth, continent)
continentInterior = smoothstep(seaLevel + coastWidth, seaLevel + 4 * coastWidth, continent)
```

The coastline must have enough width for antialiasing, wet shore, foam, or shallow-water color.

## 4. Crater profile

For a crater center direction `c`, use geodesic or chord distance:

```glsl
float d = acos(clamp(dot(dir, c), -1.0, 1.0)) / angularRadius;
```

Build separate profile terms:

```glsl
float bowl = -depth * pow(saturate(1.0 - d), bowlPower);
float rim = rimHeight * exp(-pow((d - 1.0) / rimWidth, 2.0));
float floorLift = floorHeight * (1.0 - smoothstep(0.0, floorRadius, d));
float ejecta = ejectaHeight
  * exp(-max(d - 1.0, 0.0) * ejectaFalloff)
  * radialStreakField(dir, c);
float crater = bowl + rim + floorLift + ejecta;
```

Vary age through erosion, rim sharpness, and ejecta visibility. Vary size with a heavy-tailed distribution and enforce spatial budgets; uniform random radii read as stamped decoration.

For many craters:

- place a small number of hero craters explicitly;
- use a deterministic CPU spatial index for medium craters;
- reserve high-frequency crater noise for normal-scale micro-pitting;
- avoid evaluating hundreds of independent crater functions per fragment.

## 5. Derive causes

Derive rather than decorate:

```text
slope = 1 - dot(surfaceNormal, dir)
cavity = positive part of local average height - elevation
latitude = abs(dir.y)
coast = 1 - smoothstep(0, coastWidth, abs(elevation - seaLevel))
temperature = latitudeGradient - altitudeCooling + broadVariation
moisture = oceanProximity + circulationBands - rainShadow + variation
```

If rain shadows or circulation are not represented, do not pretend the result is a physical climate simulation. Keep the rule stylized but internally causal.

## 6. Biome weights

Use soft competing weights:

```text
ocean = 1 - land
beach = land * coast * lowSlope
rock = land * smoothstep(rockSlopeMin, rockSlopeMax, slope)
snow = land * cold * highAltitude * upwardFacing
desert = land * hot * dry * (1 - snow)
vegetation = land * temperate * moist * lowSlope
```

Normalize overlapping positive weights:

```glsl
vec4 w = max(rawWeights, 0.0);
w /= max(dot(w, vec4(1.0)), 1e-4);
```

Preserve wide interiors. If all transitions are narrow, the planet becomes a ringed contour map.

## 7. Geometry and normal agreement

Displaced radius:

```text
radius = planetRadius + macroHeight + ridgeHeight + largeCraterHeight
positionPlanet = dir * radius
```

Do not displace geometry with detail smaller than the local edge length.

For a shader normal, construct an orthonormal tangent frame:

```glsl
vec3 helper = abs(dir.y) < 0.95 ? vec3(0, 1, 0) : vec3(1, 0, 0);
vec3 tx = normalize(cross(helper, dir));
vec3 ty = cross(dir, tx);

float h0 = height(dir);
float hx = height(normalize(dir + tx * eps));
float hy = height(normalize(dir + ty * eps));
vec3 displacedTx = tx + dir * ((hx - h0) / eps);
vec3 displacedTy = ty + dir * ((hy - h0) / eps);
vec3 nPlanet = normalize(cross(displacedTx, displacedTy));
```

Use an analytic gradient where available. Re-evaluating a large field stack twice per fragment can dominate cost.

## 8. Altitude filtering

Define weights from camera altitude or projected feature size:

```text
orbit: macro only
approach: macro + meso
surface: macro + meso + detail + filtered micro
```

Fade detail amplitude before changing frequency. Sudden frequency changes cause swimming.

If geometry LOD changes:

- preserve the exact macro field across all levels;
- geomorph or cross-fade displacement;
- keep material masks in planet space;
- measure normal strength against the current represented scale.

## 9. Material coupling

Drive:

- base color from normalized biome weights;
- roughness from material identity plus wetness/ice/cavity;
- normal from detail height gated by biome;
- emission only from a physical/stylistic source such as lava or city lights;
- atmosphere ground albedo from the same broad surface color family.

Avoid adding independent high-frequency noise to every channel. A rock feature should perturb color, roughness, and normal in related ways.

## 10. Diagnostic contract

Expose:

```text
0 final
1 warped direction
2 macro height
3 ridges
4 crater components
5 slope/cavity
6 temperature/moisture
7 biome weights
8 displacement bands
9 procedural normal
10 distance-filter weights
```

Also provide `heightExaggeration` and `freezeCameraAltitude` controls. They reveal field discontinuities and LOD transitions quickly.
