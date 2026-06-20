# Transition field recipes

## 1. Height sweep

Normalize object height:

```glsl
float h = saturate((positionObject.y - boundsMinY) / (boundsMaxY - boundsMinY));
float warpedH = h + lowFrequencyNoise(positionObject * noiseScale) * warpAmount;
float d = warpedH - progress;
```

Use actual object bounds. Raw world height makes differently sized objects transition inconsistently.

## 2. Directional plane

```glsl
float field = dot(positionObject - pivot, normalize(sweepDirection)) / sweepExtent;
float d = field + noise * warpAmount - progress;
```

This supports diagonal scans and materialization fronts.

## 3. Radial reveal

```glsl
float field = length((positionObject - center) * anisotropy) / maxRadius;
float d = progress - field + noise * warpAmount;
```

Use anisotropy to fit non-spherical subjects rather than accepting a generic spherical wipe.

## 4. Boundary decomposition

Create independent masks:

```glsl
float visible = smoothstep(-feather, feather, d);
float edge = 1.0 - smoothstep(edgeWidth, edgeWidth + edgeFeather, abs(d));
float leadingEdge = edge * step(0.0, d);
float trailingEdge = edge * step(d, 0.0);
```

Possible channels:

- base material × visible;
- emission × leading edge;
- particles spawned from CPU/GPU samples near `abs(d) < edgeWidth`;
- displacement concentrated near the boundary;
- distortion behind the boundary.

## 5. Vertex displacement

Concentrate deformation near the transition:

```glsl
float displacementMask = pow(edge, edgeFocus);
vec3 displaced = positionObject
  + normalObject * noise * normalDisplacement * displacementMask
  + glitchDirection * glitchOffset * glitchBand * displacementMask;
```

Broad displacement over the whole object destroys recognition. Boundary-local displacement communicates conversion.

## 6. Scanlines

Build screen or world scanlines deliberately:

```glsl
float line = 0.5 + 0.5 * sin(worldPosition.y * lineFrequency - time * lineSpeed);
line = smoothstep(lineThreshold, 1.0, line);
```

World/object scanlines remain attached to the subject. Screen scanlines read as a display artifact. Choose one.

Antialias high frequencies with derivatives:

```glsl
float width = fwidth(phase);
float line = smoothstep(threshold - width, threshold + width, sin(phase));
```

## 7. Fresnel shell

```glsl
float fresnel = pow(1.0 - saturate(dot(normalWorld, viewDirectionWorld)), fresnelPower);
```

Use Fresnel to reinforce silhouette or transparency. Do not let it replace the transition field.

## 8. Glitch bands

Quantize a stable axis:

```glsl
float bandId = floor((positionObject.y + time * bandSpeed) * bandCount);
float trigger = step(glitchThreshold, hash(bandId + floor(time * glitchRate)));
float offset = (hash(bandId * 7.13) - 0.5) * glitchAmplitude * trigger;
```

Gate glitch by:

- transition edge;
- sparse time windows;
- upper/lower regions;
- effect intensity.

Constant full-body jitter reads as broken tracking rather than authored interference.

## 9. Transparency and depth

Choose explicitly:

### Opaque dissolve

- discard removed fragments;
- keep depth write;
- stable sorting;
- best for solid material burn-away.

### Additive hologram

- transparent;
- additive or custom blend;
- usually depth test on;
- depth write often off;
- may need a depth prepass or back/front shell strategy for readable volume.

### Refractive transition

- render scene color first;
- output distortion separately;
- composite with depth-aware validity.

Avoid rendering a complex double-sided additive mesh in one pass without checking backface contribution and ordering.

## 10. Color hierarchy

Separate values:

```text
base hologram color
edge emission color
scanline modulation
glitch flash
Fresnel reinforcement
```

Use luminance hierarchy. If every term reaches the same HDR intensity, the boundary disappears in bloom.

## 11. Debug views

Expose:

```text
raw field
threshold distance
visible mask
edge mask
glitch bands
scanlines before color
Fresnel
vertex displacement magnitude
raw alpha
raw emission
```
