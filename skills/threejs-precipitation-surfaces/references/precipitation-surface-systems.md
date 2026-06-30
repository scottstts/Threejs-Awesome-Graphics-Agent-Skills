# Precipitation Surface Systems

Precipitation reads as real only when particles, surface masks, normals,
roughness, and impact residue share the same event state. The following
contracts describe two reusable families: snow accumulation and wet rain
puddles.

## Contents

- Weather state contract
- Wrapped precipitation volume
- Snow accumulation contract
- Object snow capping
- Wet puddle contract
- Rain streaks and splashes
- Debug outputs
- Boundaries and failure modes

## Weather state contract

Use a small shared state object for weather systems. The state is passed by
reference into both particles and surfaces.

```js
const weather = {
  uTime: { value: 0 },
  uWind: { value: new THREE.Vector3(1.2, 0, 0.5) },
  uProgress: { value: 0 },
};

function updateWeather(delta, target) {
  weather.uTime.value += delta;
  weather.uProgress.value = THREE.MathUtils.damp(
    weather.uProgress.value,
    target,
    0.9,
    delta,
  );
}
```

Do not give rain particles one clock and puddle ripples another. Do not sample
wind in screen space for particles and world space for surfaces. The wind vector
is horizontal and is interpreted as world units per second for moving
precipitation, while scalar progress controls wetness or coverage.

## Wrapped precipitation volume

A camera-centered volume avoids finite emitter edges. Each instance stores a
normalized spawn point and a random seed. The vertex shader turns that into a
world position and wraps all axes with `mod`.

```glsl
vec3 origin = uCameraPos - vec3(vol.x * 0.5, vol.y * 0.4, vol.z * 0.5);
float speed = uSpeed * (0.6 + 0.7 * aRand);
vec3 base = aSeed * vol;
vec3 disp = vec3(uWind.x, -speed, uWind.z) * uTime + sway;
vec3 pos = mod(base + disp - origin, vol) + origin;
```

For snow, use soft round camera-facing billboards with opacity around `0.9`,
flake radius around `0.07`, speed around `3.2`, and a horizontal sway near
`0.5`. For rain, use narrow vertical or uneven-capsule billboards and a faster
fall speed, commonly around `5` world units per second in an inspection-scale
scene.

## Snow accumulation contract

Ground snow needs one height function. The same function displaces vertices and
feeds finite-difference normals.

```glsl
float snowMaskAt(vec2 worldXZ) {
  vec2 p = worldXZ * uSnowScale + uSnowSeed;
  float n = fbm(p) * 0.5 + 0.5;
  float threshold = 1.0 - uSnowCoverage;
  return smoothstep(threshold - uSnowEdge, threshold + uSnowEdge, n);
}

float snowHeightAt(vec2 worldXZ) {
  float mask = snowMaskAt(worldXZ);
  float drift = fbm(worldXZ * uSnowBumpScale) * 0.5 + 0.5;
  float h = mask * (1.0 - 0.4 * uSnowBumpStrength +
                    0.4 * uSnowBumpStrength * drift);
  vec2 edge = smoothstep(10.0, 8.0, abs(worldXZ));
  return uSnowDepth * h * edge.x * edge.y;
}

vec3 groundSurfaceNormal(vec2 worldXZ) {
  float e = 0.08;
  float h0 = snowHeightAt(worldXZ);
  float hx = snowHeightAt(worldXZ + vec2(e, 0.0));
  float hz = snowHeightAt(worldXZ + vec2(0.0, e));
  vec2 grad = vec2(hx - h0, hz - h0) / e;
  return normalize(vec3(-grad.x, 1.0, -grad.y));
}
```

The snow material response should override albedo toward a cool white, push
roughness to roughly `0.82`, and add sparse sparkle only inside the snow mask.
The sparkle is a material response, not a separate particle layer.

## Object snow capping

Object snow must be model-locked. Compute a world-to-model matrix for the host
object and sample coverage in that coordinate space so moving or rotating the
object does not slide the snow pattern.

```glsl
float snowAccumAt(vec3 worldNormal, vec2 modelXZ) {
  float up = clamp(worldNormal.y, 0.0, 1.0);
  float top = smoothstep(uSnowFlatThreshold, 1.0, up);
  return top * snowCoverageMask(modelXZ);
}
```

Typical controls are `uSnowFlatThreshold = 0.35`, `uSnowThickness = 0.06`,
`uSnowCoverage = 0.7`, and `uSnowEdge = 0.15`. Displace along the object normal
but convert from world units to local units using the mapped normal length.

## Wet puddle contract

Wet asphalt is a material transition driven by rain progress. Use separate
progress bands: roughness changes early, ripple normals arrive as the rain
becomes heavy.

```glsl
float roughnessProgress = smoothstep(0.0, 0.75, uRainFactor);
float normalProgress = smoothstep(0.75, 1.0, uRainFactor);
float puddleNoise = getPuddle(vPosition.xy * 15.0);
float puddleMask = smoothstep(0.0, 1.0, puddleNoise) * normalProgress;
```

The puddle roughness is intentionally collapsed toward the `0.0..0.1` range
inside the mask. Ripple normals are analytic: every local cell emits expanding
rings with finite-difference slope estimation. Keep the ripple normal separate
from the static asphalt normal until the final normal handoff.

## Rain streaks and splashes

Rain streaks can be instanced quads. Their fragment shape may use an uneven
capsule SDF and alpha around `0.1 * rainProgress`. Splash placement should use
surface sampling weighted by upward normals.

```js
const skyWeight = normal.dot(new THREE.Vector3(0, 1, 0)) >= 0 ? 1 : 0;
geometry.setAttribute("skyWeight", new THREE.BufferAttribute(weights, 1));
sampler.setWeightAttribute("skyWeight");
```

Each splash instance owns a progress attribute. A flipbook shader maps progress
to a tile in a `4 x 5` atlas, fades by rain progress, and uses additive
blending. The splash mesh should face the camera around Y.

## Debug outputs

Expose at least:

- `final`: complete weather and surface response;
- `mask`: snow or puddle coverage only;
- `normals`: accumulated snow normal or ripple normal;
- `particles`: precipitation density and fall volume;
- `progress`: shared rain or snow envelope.

Diagnostics should report active instance count, coverage, and whether the
surface response is reading the same time/wind uniforms as particles.

## Boundaries and failure modes

Use a water-volume skill when the system needs refraction through a bounded
water body, caustics, or Beer-Lambert thickness. Use a general VFX skill for
non-weather particles. Use a screen-space temporal-surface skill for touch
history, not for world-space wetness.

Known failure modes:

- snow silhouettes rise but normals stay flat;
- object snow uses world coordinates and slides under animation;
- puddle masks are independent of roughness and normal changes;
- splashes sample all triangles and appear under objects;
- rain progress affects particles but not the material, or the reverse;
- license notices are stripped from copied GPL-derived rain examples.
