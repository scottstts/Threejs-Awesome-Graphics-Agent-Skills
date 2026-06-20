# Scene-referred color pipeline

## 1. Establish spaces

Record:

```text
material/texture input spaces
working linear primaries
environment-map decoding
HDR render-target format
tone-map operator
grading space
display output space
```

Color textures decode to linear. Data textures such as normals, roughness, depth, masks, and LUT coordinates do not.

## 2. Luminance meter

Compute log luminance:

```glsl
float luminance = max(dot(hdrColor, vec3(0.2126, 0.7152, 0.0722)), minimumLuminance);
float logLuminance = log2(luminance);
```

Reduce into a small target or histogram. Log averaging handles wide dynamic range better than linear averaging.

Mask or weight:

- UI;
- letterbox regions;
- invalid sky/background when appropriate;
- tiny extreme emitters;
- center or subject priority.

For more control, use histogram percentiles and meter between low/high percentile bounds.

## 3. Exposure target

Map measured luminance to a target middle value:

```text
targetExposure = middleGray / measuredLuminance
```

Clamp to artistic/physical limits:

```text
minExposure ≤ targetExposure ≤ maxExposure
```

Apply compensation in stops:

```text
targetExposure *= 2 ^ exposureCompensationEV
```

## 4. Adaptation

Use exponential adaptation independent of frame rate:

```js
const rate = targetExposure > exposure
  ? brightenRate
  : darkenRate
const alpha = 1 - Math.exp(-rate * deltaSeconds)
exposure += (targetExposure - exposure) * alpha
```

Typically adaptation toward darkness and toward bright light use different rates. Add reset/cut handling and guard long suspended-frame deltas.

GPU readback can stall. Options:

- keep exposure entirely on GPU;
- read a tiny target asynchronously at low cadence;
- double-buffer readback;
- accept delayed CPU updates with smooth adaptation.

## 5. Tone-map placement

Apply exposure once:

```text
exposedColor = hdrColor * exposure
displayLinear = toneMap(exposedColor)
```

Tone-map operators differ in highlight roll-off, saturation, and midtone contrast. Validate with:

- neutral gray ramp;
- saturated lights;
- bright sky/sun;
- skin/organic tones when relevant;
- emissive VFX;
- dark interiors.

Do not choose an operator only from a single cinematic frame.

## 6. Creative grading

Prefer operations with explicit purpose:

```text
white balance
lift/gamma/gain or slope/offset/power
contrast/pivot
saturation or chroma shaping
selective hue treatment
3D LUT
```

If using a LUT, document:

- expected input gamut;
- expected transfer curve;
- whether input is scene-linear, log-encoded, or display-linear;
- LUT domain min/max;
- output gamut.

A LUT authored for log footage is not valid on arbitrary tone-mapped sRGB values.

## 7. 3D LUT sampling

Clamp or map color into the LUT domain:

```glsl
vec3 coord = (color - domainMin) / (domainMax - domainMin);
coord = clamp(coord, 0.0, 1.0);
vec3 graded = texture(lut3D, coord).rgb;
```

Use tetrahedral interpolation if supported/implemented and quality warrants it; trilinear interpolation is a reasonable baseline.

Blend:

```text
final = mix(ungraded, graded, lutStrength)
```

## 8. Gamut and saturation

Tone mapping and bloom can produce out-of-gamut colors. Handle them deliberately:

- gamut compression;
- hue-preserving luminance compression;
- controlled desaturation in highlights;
- output-space clipping only as a final safeguard.

Naïve channel clipping shifts hue.

## 9. Output

Perform one output conversion to the target transfer function. Verify renderer defaults and whether the final pass expects linear input.

Add subtle dithering before low-bit output to reduce banding in skies, fog, and dark gradients.

UI strategy:

- composite display-referred UI after scene tone mapping; or
- author UI for the scene pipeline and protect it from bloom/exposure as needed.

Do not mix both without explicit conversion.

## 10. Debug views

Expose:

```text
HDR false-color luminance
meter mask
luminance histogram
measured and target exposure
adapted exposure over time
pre/post tone map
pre/post LUT
out-of-gamut mask
output ramp and banding test
```
