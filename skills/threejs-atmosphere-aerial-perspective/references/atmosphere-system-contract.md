# Atmosphere system contract

## Shared parameters

Keep one parameter object:

```ts
type Atmosphere = {
  bottomRadius: number
  topRadius: number
  rayleighScattering: THREE.Vector3
  rayleighScaleHeight: number
  mieScattering: THREE.Vector3
  mieExtinction: THREE.Vector3
  mieScaleHeight: number
  miePhaseG: number
  absorptionExtinction: THREE.Vector3
  absorptionLayer: { center: number; width: number }
  groundAlbedo: THREE.Color
  solarIrradiance: THREE.Vector3
}
```

Convert world distances into the units expected by the coefficients exactly once.

## Density

For altitude `h`:

```text
rayleighDensity = exp(-h / rayleighScaleHeight)
mieDensity      = exp(-h / mieScaleHeight)
```

Use a piecewise or shaped absorption layer for ozone-like extinction rather than another ground-heavy exponential.

## Phase functions

Rayleigh favors forward and backward scattering symmetrically. Mie uses an anisotropic phase function controlled by `g`. Keep `g` below the singular range and tune it with sun-disc/glare treatment.

## Sky ray

For each view ray:

1. intersect the atmosphere shell;
2. clamp the segment against the ground sphere;
3. integrate view optical depth;
4. at each sample, integrate or look up sun optical depth;
5. accumulate Rayleigh and Mie inscattering;
6. add sun/moon discs after transmittance;
7. return HDR radiance.

For production, precompute transmittance and scattering LUTs when the camera spans ground to orbit.

## Aerial perspective

Reconstruct world position from depth:

```text
clip = vec4(uv * 2 - 1, depth, 1)
view = inverseProjection * clip
view /= view.w
world = cameraWorld * view
```

Then evaluate only the camera-to-surface segment:

```text
final = sceneColor * transmittance + inscattering
```

Do not apply ground aerial perspective to sky pixels.

## Planet coordinate transform

Maintain:

```text
worldToPlanet
planetToWorld
cameraPlanetPosition
planetCenterWorld
```

For a large ellipsoid or rebased world, calculate altitude from the planet-space surface, not from `worldPosition.y`.

## Shell/post handoff

When using both a shell material and post-process aerial perspective:

- shell handles limb and sky when no scene depth exists;
- post process handles visible geometry segments;
- cross-fade near atmosphere entry/exit;
- avoid double scattering on the planet surface.

## Atmosphere-aware light

Calculate directional-light color from sun transmittance along the path to the observer or local surface. A white directional light under a deeply reddened sunset breaks the model.

## Debug views

Expose:

- altitude;
- shell intersections;
- Rayleigh density;
- Mie density;
- transmittance;
- inscattering;
- sun optical depth;
- sky/surface classification;
- LUT coordinates when applicable.
