# Procedural PBR system

## 1. Material bundle

Keep material identity separate from final channels:

```ts
type SurfaceFields = {
  identityWeights: Node[]
  height: Node
  cavity: Node
  convexity: Node
  exposure: Node
  wetness: Node
  dust: Node
  microHeight: Node
}

type PBRChannels = {
  baseColor: Node
  roughness: Node
  metalness: Node
  normal: Node
  transmission: Node
  emission: Node
}
```

The material layer decides the dry clean surface first. Environmental modifiers operate afterward.

## 2. Identity before variation

For each base material, define:

```text
color family
roughness range
metalness
normal spectrum
edge response
porosity
wet response
wear response
```

Example:

```text
stone:
  broad mineral color variation
  high average roughness
  low metalness
  chipped convex edges
  dark wet response with lower roughness
  cavity dirt
```

Do not begin with “add noise to color.” First define what changes together.

## 3. Layer weights

Create soft weights for surface identities:

```glsl
vec3 raw = max(vec3(stoneWeight, mortarWeight, metalWeight), 0.0);
vec3 w = raw / max(raw.x + raw.y + raw.z, 1e-4);
```

Blend base channels by the same weights. Normals require reorientation or height blending rather than naïve linear interpolation when layers are strong.

For height-aware blending:

```text
adjustedWeight_i = weight_i * exp(height_i * contrast)
normalize(adjustedWeights)
```

## 4. Causal modifiers

Useful causes:

```text
cavity dirt = cavity * materialPorosity * dirtAvailability
edge wear = convexity * exposure * contactExclusion
wetness = rainExposure * lowDrainage + waterProximity
dust = upwardFacing * sheltered * dryness
oxidation = metalIdentity * moistureHistory * exposureTime
burn = heatHistory * oxygenAccess
```

Apply coupled responses:

```text
wetness:
  color darkens/saturates
  roughness falls
  normal contrast may fall under a film
  clearcoat/specular lobe may rise

edge wear:
  coating weight falls
  substrate color appears
  roughness changes
  local normal profile chips
```

## 5. Coordinate strategy

Choose by surface:

- object UV: authored seams and anisotropy;
- world/object triplanar: seamless solids and generated meshes;
- cylindrical: trunks, pipes, columns;
- profile coordinates: trim and sweeps;
- planet direction: spherical bodies;
- screen projection: only for explicitly screen-space effects.

Triplanar weights:

```glsl
vec3 w = pow(abs(normalObject), vec3(blendSharpness));
w /= max(w.x + w.y + w.z, 1e-4);
```

Use consistent units for all axes. Rotate tangent-space normals from each projection into a shared frame before blending.

## 6. Derivative-aware texture sampling

For an atlas tile, compute derivatives before applying tile scale and offset:

```glsl
vec2 uvTile = uv * tileScale + tileOffset;
vec2 dx = dFdx(uv) * tileScale;
vec2 dy = dFdy(uv) * tileScale;
vec4 value = textureGrad(atlas, uvTile, dx, dy);
```

Clamp sampling to padded interiors:

```text
safeMin = tileMin + paddingTexels / atlasResolution
safeMax = tileMax - paddingTexels / atlasResolution
```

The atlas needs duplicated border texels through every mip level. Shader clamping cannot repair contaminated offline mips.

## 7. Procedural antialiasing

For thresholded fields:

```glsl
float width = max(fwidth(field) * filterScale, minimumWidth);
float mask = smoothstep(threshold - width, threshold + width, field);
```

For band-limited noise, attenuate octaves whose projected frequency exceeds the pixel footprint. A practical fBm loop should stop contributing before Nyquist rather than always running all octaves.

## 8. Specular antialiasing

Normal variance should increase effective roughness:

```text
normalVariance = estimate from derivatives or normal-map statistics
roughnessAA = sqrt(saturate(roughness² + varianceScale * normalVariance))
```

With shader derivatives:

```glsl
vec3 dndx = dFdx(normalWorld);
vec3 dndy = dFdy(normalWorld);
float variance = max(dot(dndx, dndx), dot(dndy, dndy));
float filteredRoughness = sqrt(clamp(roughness * roughness + variance * aaStrength, 0.0, 1.0));
```

Tune against grazing motion, not a still frame.

## 9. Procedural normal

When height is known:

- use analytic derivatives where possible;
- otherwise finite-difference in the material's stable coordinate frame;
- scale epsilon to represented feature size;
- suppress frequencies smaller than the pixel footprint.

Do not derive a normal from final color. Color boundaries may represent pigment, not height.

## 10. Custom shadow modulation

Procedural cloud or canopy shadow:

```text
shadowCoordinates = worldPosition * worldScale + wind * time
cloudDensity = filteredCloudField(shadowCoordinates)
cloudTransmittance = mix(1, minTransmittance, cloudDensity)
directLight *= cloudTransmittance
```

Apply to direct light, not indiscriminately to emission or already-occluded ambient light.

For cascaded or clipmap shadow sampling, keep the material hook limited to:

- level selection;
- stable coordinate transform;
- depth compare;
- normal/slope bias;
- cross-level blend.

## 11. Physical material extension

Prefer extending the renderer's physical material path through supported node/material hooks. Preserve:

- light loops;
- environment BRDF;
- shadowing;
- fog/atmosphere handoff;
- tone-mapping expectations;
- backend compatibility.

Replace the entire shader only when the surface model genuinely differs, such as water, volume, or stylized non-PBR rendering.

## 12. Debug modes

Expose:

```text
coordinates and scale
identity weights
height/cavity/convexity
wetness/dust/wear
base color
roughness before/after AA
metalness/transmission
geometric and final normal
per-frequency contribution
direct-light shadow modifier
```
