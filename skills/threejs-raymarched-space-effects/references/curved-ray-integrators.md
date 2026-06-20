# Curved-ray integrators

## 1. Full-screen ray contract

Reconstruct a world ray from the inverse projection and camera transform:

```glsl
vec4 view = inverseProjection * vec4(uv * 2.0 - 1.0, 1.0, 1.0);
vec3 rayDirectionView = normalize(view.xyz / view.w);
vec3 rayOriginWorld = cameraPosition;
vec3 rayDirectionWorld = normalize((cameraWorld * vec4(rayDirectionView, 0.0)).xyz);
```

Transform origin and direction into effect space once. Keep the black hole, disk, or wormhole near a numerically stable origin.

## 2. Integration state

Track:

```glsl
struct RayState {
  vec3 p;
  vec3 v;
  vec3 radiance;
  vec3 throughput;
  float traveled;
  int termination;
};
```

Do not hide state mutation in unrelated shading functions.

## 3. Physically inspired bending

A practical artistic acceleration toward a compact mass:

```glsl
vec3 toCenter = -p;
float r2 = max(dot(toCenter, toCenter), radiusEpsilon);
vec3 perpendicular = toCenter - v * dot(toCenter, v);
vec3 acceleration = bendStrength * perpendicular / (r2 * sqrt(r2));
```

Integrate with a stable method:

```glsl
v = normalize(v + acceleration * ds);
p += v * ds;
```

This is not a general-relativity solver. Name it “physically inspired” unless implementing a validated geodesic equation.

For hero scientific work, integrate the selected metric's geodesics and validate against known deflection or photon-sphere behavior.

## 4. Adaptive step policy

Use distance to important structures:

```text
ds = clamp(
  min(distanceToMass * massStepFactor,
      distanceToDisk * diskStepFactor,
      distanceToBoundary * boundaryStepFactor),
  minStep,
  maxStep
)
```

Limit the rate of step-size change to avoid skipping after a close encounter.

Use fixed compile-time maximum iterations with runtime early exit for broad shader compatibility.

## 5. Termination

Record distinct reasons:

```text
escaped effect bounds
crossed event boundary
entered wormhole throat
throughput exhausted
distance budget exhausted
iteration cap
```

Render termination IDs as debug colors. If many pixels hit the iteration cap, the integrator is not production-ready.

## 6. Thin disk crossing

Track previous and current signed distance to the disk plane:

```glsl
float d0 = dot(previousP - diskCenter, diskNormal);
float d1 = dot(currentP - diskCenter, diskNormal);
bool crossed = d0 * d1 <= 0.0;
float t = d0 / (d0 - d1);
vec3 hit = mix(previousP, currentP, clamp(t, 0.0, 1.0));
```

Then test radial bounds and disk thickness. This remains stable when `ds` exceeds the geometric thickness.

## 7. Accretion disk shading

Use disk-local radius and azimuth:

```text
temperature(radius) → blackbody-inspired color
density(radius, azimuth, time) → optical depth/emission
velocityDirection → Doppler-inspired asymmetry
```

Front-to-back emission:

```glsl
float alpha = 1.0 - exp(-density * pathLength);
state.radiance += state.throughput * emission * alpha;
state.throughput *= 1.0 - alpha;
```

Use turbulence to distort coherent spiral/band structure. Raw noise alone reads as a glowing fog ring.

## 8. Background sampling

When the ray escapes, sample an environment using the final bent direction:

```glsl
vec3 background = texture(environmentMap, finalDirection).rgb;
color = accumulatedRadiance + throughput * background;
```

For stars, use a filtered cubemap or procedural field designed to avoid subpixel flicker. Tiny unfiltered point stars alias severely under lensing.

## 9. Wormhole mapping

Define two exterior frames and a throat coordinate. On throat entry:

1. map the entry point to throat coordinates;
2. evolve through the throat or apply an explicit transfer map;
3. transform the exit position and direction into the destination frame;
4. continue integration or sample the destination environment.

Preserve orientation deliberately. An arbitrary UV rotation at the seam makes the effect feel like a portal texture.

For an artistic tunnel, use a signed distance or parametric tube with:

- longitudinal coordinate;
- local radial coordinate;
- transported frame without sudden twist;
- emission/density bands tied to curvature and flow.

## 10. Temporal and spatial quality

Ray integration can run:

- at reduced resolution with edge-aware reconstruction;
- with interleaved steps and temporal accumulation;
- in a bounded screen region;
- only for a hero object, with a cheaper displacement material elsewhere.

History rejection must consider camera motion and large changes in final ray direction.

## 11. Debug output

Expose:

```text
iteration count
minimum radius
step length
integrated bend angle
disk crossing count
throughput
termination reason
final direction
NaN/invalid-state mask
```

Add CPU-side reference tests for a few rays if the bending model claims physical behavior.
