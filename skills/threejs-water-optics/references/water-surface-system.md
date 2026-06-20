# Water surface system

## 1. Wave bundle

Use a small authored set of directional waves plus optional stochastic detail:

```ts
type Wave = {
  direction: THREE.Vector2
  wavelength: number
  amplitude: number
  steepness: number
  speed: number
  phase: number
}
```

For each Gerstner-like component:

```glsl
float k = TAU / wavelength;
float omega = speed * k;
float theta = k * dot(direction, xz) - omega * time + phase;
float q = steepness / max(k * amplitude * waveCount, 1e-4);

position.xz += q * amplitude * direction * cos(theta);
position.y  += amplitude * sin(theta);
```

Keep large swell, middle chop, and capillary detail in separate bands. Do not use many waves with near-identical wavelength and direction.

## 2. Analytic tangent and normal

Accumulate derivatives while accumulating position:

```glsl
vec3 dPdx = vec3(1.0, 0.0, 0.0);
vec3 dPdz = vec3(0.0, 0.0, 1.0);

// For every wave, add its partial derivatives to dPdx and dPdz.
vec3 normal = normalize(cross(dPdz, dPdx));
```

This preserves agreement at crests and avoids the repeated field evaluations required by finite differences.

If small normal-only waves are added, apply them in the analytic surface frame rather than in static object tangent space.

## 3. Distance and derivative filtering

For each band, estimate whether its wavelength survives the pixel footprint:

```text
coverage = projectedWavelengthPixels
weight = smoothstep(minPixels, fullPixels, coverage)
```

At minimum, fade micro-wave amplitude by distance. Preserve swell at the horizon so the surface does not become a static plane.

Reduce steepness before amplitude when filtering; unresolved steep crests create normal flicker.

## 4. Refraction contract

Render opaque scene color and depth before water. At the water fragment:

1. project the undisplaced or current surface point to screen UV;
2. offset UV by view-space surface normal and a thickness-aware scale;
3. sample scene depth at the refracted UV;
4. reject or reduce the offset if sampled geometry lies in front of the water;
5. sample scene HDR color.

Use a conservative fallback near screen edges and depth discontinuities.

Do not read from the target currently being written. Use an explicit scene-color input or render pipeline texture.

## 5. Thickness

Reconstruct linear view-space positions for:

- water surface depth;
- opaque scene depth behind water.

Then:

```text
thickness = max(distanceAlongView(scenePosition - waterPosition), 0)
```

If no opaque surface exists behind the water, clamp to a configured deep-water distance rather than using far-plane infinity.

Depth conventions differ between perspective, reversed depth, and backend. Verify the installed renderer and inspect a linear-depth debug view.

## 6. Beer-Lambert absorption

Use per-channel extinction:

```glsl
vec3 transmittance = exp(-absorptionCoefficient * thickness);
vec3 transmitted = refractedScene * transmittance;
vec3 waterInscatter = waterBodyColor * (1.0 - transmittance);
vec3 refracted = transmitted + waterInscatter * scatteringStrength;
```

This makes red light disappear faster in deep water without an arbitrary depth-color lerp.

Keep artistic control through:

- absorption color/coefficient;
- scattering color;
- deep-distance clamp;
- turbidity;
- shallow-bed tint.

## 7. Fresnel and energy split

Schlick approximation:

```glsl
float NoV = saturate(dot(normal, viewDirection));
float F = F0 + (1.0 - F0) * pow(1.0 - NoV, 5.0);
```

For water-air, `F0` is low at normal incidence. Use:

```text
surfaceColor = refracted * (1 - F) + reflected * F
```

Reflection may come from:

- environment map;
- planar reflection for bounded flat water;
- screen-space reflection;
- a hybrid with validity confidence.

Do not add all sources at full weight.

## 8. Sun glitter

Create glints from the reflected sun alignment and unresolved wave-slope distribution:

```text
sunAlignment = dot(reflect(-view, normal), sunDirection)
glint = pow(saturate(sunAlignment), glintSharpness)
glint *= microSlopeMask * sunVisibility
```

Filter or stochastic-sample the micro slope field so glints converge rather than crawl.

## 9. Foam causes

Combine meaningful sources:

```text
crestFoam = highSteepness * upwardVelocity * curvature
shoreFoam = shallowThickness * shorelineNoise
wakeFoam = injectedWakeField
impactFoam = temporalInteractionField
```

Foam changes more than albedo:

- raises roughness;
- suppresses refraction;
- increases opacity/scattering;
- may emit slightly into bloom only for a stylized result.

## 10. Underwater handoff

When the camera crosses the surface:

- switch the medium classification robustly with hysteresis;
- apply water extinction to scene segments;
- move the dominant reflection/refraction interpretation;
- change fog/scattering and sun treatment;
- avoid a one-frame feedback or history discontinuity.

## 11. Debug modes

Expose:

```text
wave bands
analytic normal
projected wavelength weight
raw scene depth
linear thickness
refracted UV and validity
transmittance
Fresnel
reflection source confidence
foam causes
```

Tune optics with post-processing and bloom disabled first.
