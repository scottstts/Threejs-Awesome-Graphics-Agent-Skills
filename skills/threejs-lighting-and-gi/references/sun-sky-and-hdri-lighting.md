# Sun, sky, and HDRI lighting

Use this reference to anchor outdoor and mixed Three.js lighting in physical sun-to-sky ratios, eliminate the HDRI second-sun defect, and diagnose flat or overcast renders quantitatively.

## Contents

- Clear-sky physical anchors
- Mapping irradiance to Three.js lights
- HDRI as fill and second-sun removal
- Alignment, lower hemisphere, and calibration
- Diagnosing flat or overcast lighting
- Orbit-safe stylized lighting deviations
- Observed limits and defects
- Diagnostics and failure diagnosis

## Clear-sky physical anchors

Whether a daylight scene reads as crisp sun or dull overcast depends primarily on the **diffuse-to-direct ratio** rather than absolute intensity units. Clear-sky sea-level anchors from Kasten–Young air mass, Meinel direct normal irradiance (`DNI = 1361 * 0.7^(AM^0.678)`), and Haurwitz global horizontal irradiance (`GHI = 1098 * cos(z) * exp(-0.057 / cos(z))`), computed by `scripts/sun-sky.mjs`:

| Sun elevation | Air mass | Direct normal (W/m²) | Diffuse horizontal (W/m²) | Diffuse / Direct | Lit:Shade (up-facing) | Lit:Shade (sun-facing wall) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `70°` | `1.06` | `940` | `90` | `0.10` | `11:1` | `~21:1` |
| `45°` | `1.41` | `860` | `100` | `0.12` | `7:1` | `~18:1` |
| `18°` | `3.19` | `620` | `90` | `0.15` | `3:1` | `~15:1` |
| `10°` | `5.60` | `430` | `60` | `0.14` | `2:1` | `~15:1` |

Below roughly `10°` elevation, the Haurwitz fit under-predicts twilight diffuse light; take twilight ratios directly from a physical scattering sky model (`$threejs-atmosphere-aerial-perspective`). Increasing atmospheric turbidity raises the diffuse share smoothly until full overcast (`DNI = 0`).

## Mapping irradiance to Three.js lights

```js
// Single authoritative sun vector shared by DirectionalLight, sky model, and water/cloud shaders
const sunDir = new THREE.Vector3(
  Math.cos(elevRad) * Math.sin(azimRad),
  Math.sin(elevRad),
  Math.cos(elevRad) * Math.cos(azimRad),
).normalize();

const sunIntensity = 3.0; // scene illuminance anchor; exposure places sunlit mid-albedo
sunLight.position.copy(sunDir).multiplyScalar(100);
sunLight.intensity = sunIntensity;
// Sun color comes from atmospheric transmittance: ~5500-6000 K high, warm orange near horizon
```

Match sky fill to the chosen `sunIntensity` (`S`):

- **Up-facing sky irradiance target:** `E_sky = S * (DHI / DNI)` (roughly `0.10 * S` to `0.15 * S` in clear sun).
- **Uniform sky radiance equivalent:** because an upper hemisphere of constant radiance `L` delivers irradiance `pi * L`, set uniform environment radiance scale near `E_sky / pi`.
- **`HemisphereLight` fallback:** set sky intensity near `E_sky` with sky-blue color from the atmosphere model, and ground color equal to `groundAlbedo * groundIrradiance` (never arbitrary bright grey).
- **Warm/cool separation:** sunlit highlights carry warm-to-neutral solar transmittance (`5500–6000 K` high, `2800–4000 K` low), while shadow pockets receive cool blue sky fill. This produces natural warm-lit / cool-shade modeling without faking color splits in post-processing.

## HDRI as fill and second-sun removal

In Three.js, `scene.environment` supplies prefiltered diffuse irradiance and prefiltered specular radiance mips. It **does not** cast shadows, occlude interiors, or compute multi-bounce GI.

**The second-sun problem:** outdoor HDRIs contain an extreme-luminance solar disc (`10^3–10^5` relative to sky). PMREM convolution smears that energy into a broad directional lobe that illuminates shadowed geometry from the sun side with zero shadow attenuation, washing out terminators and flattening cast shadows.

Strip solar energy before generating the PMREM environment:

1. Locate the peak-luminance solar pixel cluster in the equirectangular HDRI.
2. Measure the angular radius where radiance drops back to the clean surrounding sky gradient.
3. Replace that solar disc (plus a small margin) smoothly with the surrounding sky radiance, or bake the environment from the built sky model with the sun disc excluded.
4. Let the single shadow-casting `DirectionalLight` carry 100% of direct solar irradiance.

## Alignment, lower hemisphere, and calibration

- **Azimuth alignment:** rotate `scene.environmentRotation.y` so the HDRI's warm sunward horizon matches `sunDir`'s azimuth. Never leave the warm side of the sky fill opposite the shadow-casting sun.
- **Lower hemisphere replacement:** many stock HDRIs contain mismatched ground (e.g., an asphalt parking lot under a coastal ocean or snowfield). Replace the lower hemisphere with a luminance-matched tone or darkened reflection of the scene's actual terrain/water so upward bounce and undersides carry coherent color.
- **Measured calibration:** never assume raw HDRI file exposure matches Three.js `DirectionalLight` units. Place a neutral grey card (`albedo = 0.18`) and matte white sphere (`albedo = 0.80`) in the scene, shade one side, and adjust `scene.environmentIntensity` until the shaded up-facing swatch receives `E_sky = S * (DHI / DNI)`.
- **Backdrop separation:** keep `scene.background` on a built sky model (`$threejs-atmosphere-aerial-perspective`), never the low-res or mismatched fill HDRI.

```js
// Concrete calibration helper: align sun-stripped HDRI and compute physical sky fill
import { report as sunSkyReport } from "../scripts/sun-sky.mjs";

export function configureDaylightRig(scene, sunLight, {
  elevationDeg = 32,
  azimuthRad = 0.65,
  sunIntensity = 3.2,
  hdriSunAzimuthRad = 0,
  measuredHdriUpIrradiance = 1.0,
} = {}) {
  const { three } = sunSkyReport(elevationDeg, sunIntensity);
  const elevRad = (elevationDeg * Math.PI) / 180;
  const sunDir = [
    Math.cos(elevRad) * Math.sin(azimuthRad),
    Math.sin(elevRad),
    Math.cos(elevRad) * Math.cos(azimuthRad),
  ];

  sunLight.position.set(sunDir[0] * 120, sunDir[1] * 120, sunDir[2] * 120);
  sunLight.intensity = three.directionalIntensity;

  // Align warm horizon of sun-stripped HDRI with sun azimuth and match physical E_sky
  scene.environmentRotation.set(0, azimuthRad - hdriSunAzimuthRad, 0);
  scene.environmentIntensity = three.skyIrradianceUpFacing / Math.max(measuredHdriUpIrradiance, 1e-4);

  return { sunDir, targetSkyIrradiance: three.skyIrradianceUpFacing };
}
```

### Sun-disc stripping kernel (equirectangular float buffer)

When preparing a float equirectangular HDRI before `PMREMGenerator.fromEquirectangular(...)`:

```js
// Replace pixels within sunConeRad of the peak sun direction with ring-averaged sky radiance
function stripSunDisc(floatRgba, width, height, sunDir, sunConeRad = 0.09, ringOuterRad = 0.16) {
  const ringSum = [0, 0, 0];
  let ringCount = 0;
  const dirAt = (x, y) => {
    const phi = ((x + 0.5) / width) * Math.PI * 2 - Math.PI;
    const theta = ((y + 0.5) / height) * Math.PI;
    const st = Math.sin(theta);
    return [st * Math.sin(phi), Math.cos(theta), st * Math.cos(phi)];
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = dirAt(x, y);
      const ang = Math.acos(Math.max(-1, Math.min(1, d[0] * sunDir[0] + d[1] * sunDir[1] + d[2] * sunDir[2])));
      if (ang > sunConeRad && ang <= ringOuterRad) {
        const i = (y * width + x) * 4;
        ringSum[0] += floatRgba[i];
        ringSum[1] += floatRgba[i + 1];
        ringSum[2] += floatRgba[i + 2];
        ringCount++;
      }
    }
  }
  const sky = ringSum.map((v) => v / Math.max(1, ringCount));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const d = dirAt(x, y);
      const ang = Math.acos(Math.max(-1, Math.min(1, d[0] * sunDir[0] + d[1] * sunDir[1] + d[2] * sunDir[2])));
      if (ang < sunConeRad) {
        const t = Math.min(1, Math.max(0, (ang - sunConeRad * 0.7) / (sunConeRad * 0.3)));
        const i = (y * width + x) * 4;
        floatRgba[i]     = sky[0] * (1 - t) + floatRgba[i] * t;
        floatRgba[i + 1] = sky[1] * (1 - t) + floatRgba[i + 1] * t;
        floatRgba[i + 2] = sky[2] * (1 - t) + floatRgba[i + 2] * t;
      }
    }
  }
}
```

## Diagnosing flat or overcast lighting

Measure these traits on a neutral clay render and final beauty pass (`$threejs-visual-validation`):

| Trait | Measurement | Typical cause when off |
| --- | --- | --- |
| Brightest sunlit mid-albedo | `p95` luminance in a sunlit stone/wall patch | Exposure too low, sun weak, tone curve compressing mid-highlights, or albedo too dark |
| Lit-to-shade ratio | Mean sunlit patch / mean shaded patch on one material | Fill too strong (HDRI/hemisphere), HDRI sun not stripped, or AO missing from indirect fill |
| Shade tint | `B - R` channel balance in shaded neutral regions | Sky fill too neutral, or grading neutralizing/over-boosting shadows |
| Black level (`p1`) | Darkest `1%` of pixels | Stacked fog/haze/glare veil, lifted grade blacks, or unoccluded fill in recesses |
| Sunlit white neutrality | Mean saturation on sunlit white surfaces | Incorrect white balance or global grade tint |
| Terminators and face split | Which face normals are brightest in clay view | Sun placed behind camera (front-lit) instead of side/backlit |
| Alcove/soffit depth | Recess luminance vs open wall of same material | Unoccluded environment fill (needs `LightProbeGrid` + contact AO) |

**Fix order (strict):**
1. Correct sun direction (side/back/front split).
2. Restore physical sun-to-sky ratio and strip HDRI sun energy.
3. Add indirect occlusion (irradiance probes + contact AO on indirect only).
4. Set exposure and tone mapper (`$threejs-exposure-color-grading`).
5. Audit atmospheric and glare veils (`$threejs-atmosphere-aerial-perspective`).
6. Apply restrained color grading last.

**Core trap:** raising ambient/HDRI fill to see dark faces is proof that the key light direction or bounce path is wrong; adding fill destroys contrast and locks in an overcast look.

## Orbit-safe stylized lighting deviations

When a stylized target requires stronger shadow lift, suppressed sky brightness, or exaggerated warm/cool contrast:

- Start from the physical clear-sky baseline so ratios remain intelligible.
- Deviate by measured amounts using real lights and environment scaling rather than per-material self-lit hacks or pixel-keyed tints.
- Avoid no-cast exemptions or hero-angle shadow proxies that break when orbiting; find a consistent sun elevation/azimuth or real bounce surface that achieves the look from all angles.

## Observed limits and defects

- **Clear-sky script validity:** `scripts/sun-sky.mjs` targets clear-sky sea-level elevations from `10°` to `90°`; below `10°` it emits a warning because twilight diffuse fraction rises sharply.
- **Unshadowed IBL:** even a sun-stripped HDRI provides unoccluded sky light everywhere; architectural interiors, caves, and overhangs still require probe grids (`references/irradiance-probes-and-reflections.md`) and contact AO (`$threejs-screen-space-ambient-occlusion`).
- **API sensitivity:** `scene.environmentRotation` and `scene.environmentIntensity` are available on modern Three.js builds; verify exact property support against the project's installed Three.js version.

## Diagnostics and failure diagnosis

Mandatory lighting verification set:

```text
mirror sphere + vertical stick   confirms single sun direction across disc, reflection, and cast shadow
clay view (sun only)             verifies key direction, terminators, and shadow placement
clay view (sun + sky fill)       verifies lit:shade ratio on grey card (0.18) and blue sky shade on white sphere
orbit views (4 quadrants)        confirms no hero-only shadow cheats or misaligned HDRI azimuth
```

Failure diagnosis:

- **Shadows point toward the visible sun or disagree with specular highlights:** directional light and sky model do not share one `sunDir`, or a secondary fill light has `castShadow = true`.
- **Sunny scene looks overcast and washed out:** HDRI sun disc was not stripped before PMREM prefiltering, or `environmentIntensity` exceeds the physical `0.10–0.20` diffuse-to-direct ratio.
- **Warm glow appears on the shadow side of buildings:** `scene.environmentRotation` is misaligned with `sunDir`, or lower-hemisphere HDRI ground is polluting upward reflections.
