# Field stack recipes

## 1. Build a field bundle, not a final color

Keep named nodes or functions:

```js
const fields = {
  macroHeight,
  ridge,
  cavity,
  slope,
  moisture,
  temperature,
  detail,
}
```

Material channels should consume this bundle:

```js
const rock = smoothstep(0.28, 0.72, fields.slope.add(fields.ridge.mul(0.4)))
const snow = smoothstep(0.58, 0.9, latitude.add(fields.macroHeight.mul(0.45)))
const soil = float(1).sub(rock).mul(float(1).sub(snow))

material.colorNode = rockColor.mul(rock)
  .add(soilColor.mul(soil))
  .add(snowColor.mul(snow))

material.roughnessNode = mix(soilRoughness, rockRoughness, rock)
material.normalNode = proceduralNormal(fields.detail, detailStrength)
```

The exact TSL names are version-sensitive. Verify exports before copying syntax.

## 2. Four-band frequency budget

Use perceptual roles:

| Band | Typical role | Geometry? |
| --- | --- | --- |
| macro | silhouette, continents, massing | yes |
| meso | ridges, drainage, bark plates, façade zones | sometimes |
| detail | material breakup, erosion, small cracks | normal/color |
| micro | sparkle, pores, fibers | filtered normal/roughness |

Keep adjacent bands at least roughly 3–8× apart. Frequencies packed too closely read as undifferentiated noise.

## 3. Tangential domain warp on a sphere

Radial warp stretches features in ways that look like broken UVs. Remove the radial component:

```js
function warpSphere(direction, warpVector, amount) {
  const radial = direction.clone().multiplyScalar(warpVector.dot(direction))
  const tangent = warpVector.clone().sub(radial)
  return direction.clone().addScaledVector(tangent, amount).normalize()
}
```

In a shader graph, use the same operation:

```text
tangentWarp = warp - direction * dot(warp, direction)
warpedDirection = normalize(direction + tangentWarp * amount)
```

## 4. Broad region masks

Avoid a single narrow threshold on low-frequency noise. Combine broad signals:

```text
moisture = 0.65 * macroMoisture + 0.35 * detailMoisture
aridity = (1 - moisture) * 0.8 + temperature * 0.2 - height * 0.15 + jitter * 0.12
aridMask = smoothstep(0.34, 0.82, aridity)
```

This produces regions with internal variation instead of isolated circles.

## 5. Causal masks

Use causes rather than decorative randomness:

- exposed edge wear: convexity + world-up rejection + contact exclusion;
- dirt: cavity + downward-facing + water-flow streaks;
- wetness: water proximity + upward-facing + low cavity drainage;
- snow: temperature + altitude + upward-facing + wind exposure;
- foam: crest/curvature + shallow depth + wake field;
- vegetation: moisture + temperature + slope + exclusion zones.

If no causal field exists, add one rather than substituting noise.

## 6. Procedural normal from a height field

For a 2D parameterization:

```glsl
float h  = heightField(p);
float hx = heightField(p + vec2(eps, 0.0));
float hy = heightField(p + vec2(0.0, eps));
vec3 n = normalize(vec3(h - hx, eps, h - hy));
```

For a spherical surface, sample two tangent directions around the sphere direction and transform the gradient into the surface frame. Keep `eps` proportional to the represented feature scale.

Use analytic derivatives when the field already has a closed-form wave or profile. Finite differences multiply field evaluation cost.

## 7. Distance filtering

Compute high-frequency weight from projected scale or camera altitude:

```text
nearWeight = 1 - smoothstep(nearEnd, midEnd, distance)
farWeight  = smoothstep(midEnd, farStart, distance)
midWeight  = clamp(1 - nearWeight - farWeight, 0, 1)
```

Use:

- macro at all distances;
- meso at near and mid;
- detail only near;
- micro only when derivatives indicate it survives the pixel footprint.

## 8. Required debug modes

Expose at least:

```text
0 final
1 coordinates
2 macro
3 ridges
4 cavity/slope
5 categorical masks
6 detail frequency
7 final roughness
8 final normal
```

Debug output is part of the implementation, not temporary scaffolding.
