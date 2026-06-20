# Procedural VFX system

## 1. Event state

Represent each effect instance with stable data:

```ts
type EffectEvent = {
  origin: THREE.Vector3
  direction: THREE.Vector3
  startTime: number
  duration: number
  seed: number
  strength: number
  radius: number
}
```

In shader:

```glsl
float age = time - startTime;
float life = saturate(age / duration);
float alive = step(0.0, age) * step(life, 1.0);
```

All layer timing should derive from `life`.

## 2. Named envelope curves

Useful reusable shapes:

```glsl
float impulse(float t, float attack, float decay) {
  return smoothstep(0.0, attack, t)
    * (1.0 - smoothstep(attack, decay, t));
}

float bell(float t) {
  return 4.0 * t * (1.0 - t);
}

float tail(float t, float power) {
  return pow(1.0 - t, power);
}
```

Name curves by perceptual role:

```text
flashEnvelope
shockwaveRadius
sparkEmission
plasmaTail
smokeGrowth
residueFade
```

## 3. Layer decomposition

For an impact:

- core flash: short, compact, high luminance;
- expanding shell: silhouette and timing;
- directional sparks: velocity/energy cue;
- debris: scale and persistence;
- smoke/dust: volume and environmental coupling;
- ground residue: aftermath.

For reentry plasma:

- compressed leading sheath;
- side ribbons advected around the body;
- turbulent wake;
- detached sparks;
- heat/emission field on the body;
- atmosphere-dependent intensity.

Delete any layer that does not add a distinct cue.

## 4. Initial distributions

Avoid uniform random sphere placement by default.

Directional cone:

```text
direction = normalize(eventDirection * forwardBias + tangentDiskSample * spread)
speed = mix(minSpeed, maxSpeed, pow(random, speedExponent))
```

Surface shell:

```text
position = origin + sampledDirection * radius * radialDistribution
```

Ring:

```text
position = origin + tangentX * cos(angle) * radius + tangentY * sin(angle) * radius
```

Stratify angle and radius where visible clumping would look accidental.

## 5. Motion fields

Compose named forces:

```text
velocity =
  initialVelocity
  + gravity * age
  + drag
  + curlAdvection
  + attraction/repulsion
  + eventFlow
```

For analytic particles:

```glsl
vec3 p = p0 + v0 * age + 0.5 * acceleration * age * age;
```

For richer GPU simulation, store position/velocity in ping-pong textures or storage buffers. Keep reset/spawn state separate from continuous integration.

Use curl noise for advection, not as a direct position offset every frame. Direct offsets make particles vibrate instead of flow.

## 6. Representation choice

| Need | Representation |
| --- | --- |
| many tiny sparks | instanced quads/points with streak orientation |
| thick trails | strip/ribbon with previous positions |
| shockwave | mesh shell or projected ring |
| plasma sheath | deformed surface shell |
| smoke volume | billboards, slice volume, or raymarch |
| residue | decal or temporal surface field |

Use velocity-aligned streaks:

```text
screenLength = clamp(projectedSpeed * shutterScale, minLength, maxLength)
```

Keep width energy-conserving enough that distant sparks do not become brighter simply because the streak grows.

## 7. Trail construction

Store a fixed-length circular history per trail. Generate a ribbon frame from:

```text
tangent = normalize(next - previous)
side = normalize(cross(viewDirection, tangent))
```

Handle near-parallel view/tangent with a transported fallback side vector.

Taper width and opacity independently. A trail can retain a faint wide haze after its luminous core contracts.

## 8. Shading and emission

Separate:

```text
surfaceColor
opacity/coverage
HDR emission
distortion
```

HDR emission should have calibrated ranges. Inspect:

- pre-bloom luminance;
- bloom threshold contribution;
- tone-mapped result.

Do not multiply emission by arbitrary values until bloom appears. Set exposure first, then choose effect luminance relative to scene lights.

## 9. Soft particles and depth

Fade intersections using linear depth difference:

```glsl
float separation = sceneLinearDepth - particleLinearDepth;
float softFade = smoothstep(0.0, softnessDistance, separation);
```

Reject foreground depth and verify reversed-depth conventions. This removes hard billboard intersections without making the entire particle translucent.

## 10. Distortion

Render a distortion vector and confidence/mask into a separate target. Composite scene color with:

```text
uv' = uv + distortionVector * distortionScale * mask
```

Blur or limit the vector field. Raw high-frequency refraction aliases and leaks foreground/background boundaries.

## 11. Pooling and budgets

Preallocate by representation:

```text
max active events
max particles per class
max trail points
max translucent pixels
max simulation steps
```

Recycle slots by generation ID. A stale GPU/CPU update must not mutate a reused effect instance.

Prefer dropping secondary sparks over extending frame time. Preserve the flash and main silhouette layer.

## 12. Debug contract

Expose:

```text
event life
layer IDs
spawn density
velocity
curl field
depth softening
overdraw
raw emission luminance
bloom contribution
active/pool counts
```
