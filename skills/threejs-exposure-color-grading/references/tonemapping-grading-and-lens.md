# Tone mapping, scene-referred grading, and photographic lens traits

Use this reference to choose a tone mapper deliberately, place contrast and gamut-limited saturation at the right stage of a Three.js `RenderPipeline`, preserve surface texture through grading, and apply restrained photographic lens and sensor traits.

## Contents

- Tone mapper selection and exposure anchoring
- RenderPipeline outputColorTransform ownership
- Scene-referred contrast versus post-tonemap S-curves
- Gamut-limited class-aware saturation in TSL
- Photographic lens and sensor traits
- Observed limits and defects
- Diagnostics and failure diagnosis

## Tone mapper selection and exposure anchoring

Use **exactly one** tone-mapping step in the entire pipeline. Compare candidates directly on the hero scene for highlight hue preservation (sunlit orange, fire, gold, skin, sky near the sun) and mid-tone contrast:

| Tone mapper (`renderer.toneMapping`) | Visual character | Best suited for |
| --- | --- | --- |
| `AgXToneMapping` | Wide dynamic range, gentle highlight rolloff that preserves hue into bright highlights (sunlit orange stays orange rather than clipping to yellow-white) | Default for bright sunlit scenes, sunsets, strong HDR emissives, and photographic targets |
| `ACESFilmicToneMapping` | Punchier mid-tone contrast with stronger shoulder desaturation and mild hue shift toward yellow-white | Filmic, high-contrast looks; inspect skin, foliage, and gold highlights carefully |
| `NeutralToneMapping` | Faithful base color reproduction with modest dynamic range and minimal hue shift | Stylized, illustrated, UI-adjacent, or product-faithful color targets |
| `NoToneMapping` + custom curve | Full custom highlight curve | Only when owning the full HDR-to-display transform; never stacked on another tone mapper |

**Exposure anchoring:**
- Anchor `renderer.toneMappingExposure` so a sunlit mid-albedo surface (`albedo ≈ 0.18–0.45`, such as neutral stone or wall) lands at its target display value without clipping highlights that should retain detail.
- With physical sun-to-sky ratios (`$threejs-lighting-and-gi`), one exposure fits all sunlit regions coherently. If raising exposure to lift shadows blows out sunlit faces, fix the lighting ratio or GI occlusion rather than hacking local exposure.

## RenderPipeline outputColorTransform ownership

Verify exact `RenderPipeline` behavior in the target project's installed Three.js build (checked against Three.js r187):

```text
Default (pipeline.outputColorTransform = true):
  scenePass -> HDR bloom -> outputNode [SCENE-REFERRED HDR] -> renderer tone map + output color space

Explicit display-referred grading (pipeline.outputColorTransform = false):
  scenePass -> HDR bloom -> scene-referred contrast -> renderOutput(hdr, toneMapping, colorSpace)
    -> display-referred grade (gamut-limited saturation / Lut3DNode) -> subtle lens traits -> outputNode
```

- When `pipeline.outputColorTransform = true`, anything written into `pipeline.outputNode` runs **before tone mapping** in linear scene-referred HDR.
- When applying display-referred transforms (`saturateInGamut`, display-domain `Lut3DNode`, vignette, lateral CA), set `pipeline.outputColorTransform = false` and invoke `renderOutput(...)` exactly once before the display-referred stage.
- Keep pre-grade and pre-tonemap debug taps accessible so grading never masks lighting or material errors.

## Scene-referred contrast versus post-tonemap S-curves

A grade never substitutes for lighting (`$threejs-lighting-and-gi`). Contrast, warm/cool separation, and black depth come from key-to-fill ratios, sky color, and occluded GI first.

```text
Preferred: scene radiance -> [lighting contrast or gentle power curve around 0.18 mid-grey] -> tone map -> [gentle grade]
Trap:      scene radiance -> tone map -> [heavy S-curve]  (steepens mid-tones, crushes shadow & highlight surface texture)
```

Applying a strong S-curve *after* tone mapping makes the overall frame appear punchier while compressing both dark and bright ends where fine masonry, foliage, and cloud detail live — leaving every individual surface looking flatter. Measure `8×8` median local contrast (`$threejs-visual-validation`) before and after grading to confirm grading never reduces surface micro-contrast.

## Gamut-limited class-aware saturation in TSL

A naive saturation multiplier (`mix(vec3(luma), color, amount)`) pushes rich hues outside `[0, 1]`, clipping individual channels and twisting hues (e.g., sky blue turning cyan, warm sunset turning yellow).

Scale saturation per pixel by the largest factor that keeps all three RGB channels strictly inside `[0, 1]` in display-referred space (after `renderOutput`):

```js
import { Fn, luminance, vec3, min, max, float } from "three/tsl";

export const saturateInGamut = Fn(([c, amount]) => {
  const l = luminance(c);
  const d = c.sub(vec3(l)); // chroma vector from neutral grey axis
  // Largest k such that l + k * d stays within [0, 1] across R, G, B
  const up = vec3(1).sub(vec3(l)).div(max(d, vec3(1e-6)));
  const dn = vec3(l).div(max(d.negate(), vec3(1e-6)));
  const lim = min(min(min(up.x, up.y), up.z), min(min(dn.x, dn.y), dn.z));
  const k = min(float(amount), max(lim, float(1))); // never desaturate below input
  return vec3(l).add(d.mul(k));
});
```

Color discipline rules:

- **Scale `amount` by surface class, not global brightness:** sky, water, and foliage can carry vivid chroma while stone, plaster, and sunlit white walls stay near neutral (`amount ≈ 1.0`). Drive class weights from depth (sky mask) or material/MRT IDs.
- **Avoid blanket brightness-keyed teal/orange tinting:** pushing dark values teal and bright values orange paints false colors onto dark warm wood or bright cool sky regardless of actual lighting.
- **Fit 3D LUTs last (`Lut3DNode`):** build a display-domain LUT only after lighting, GI, materials, and atmosphere already match; baking a LUT over broken lighting permanently locks the error into every angle.

## Photographic lens and sensor traits

For photographic targets, apply subtle camera traits last so the viewer feels optical capture rather than noticing an effect:

| Trait | Physical mechanism | Implementation range | Guardrail |
| --- | --- | --- | --- |
| Lateral chromatic aberration | Radial wavelength magnification | Scale R/B radially by `±0.05–0.2%` from frame center | Zero at center, faint fringe only at corners; never a uniform RGB offset |
| Vignette | Cos⁴ lens falloff | Smooth elliptical radial darkening toward corners | Gentle frame edge; never a heavy dark ring |
| Sensor noise | Photon + read noise (strongest in shadows) | Luminance-weighted fine grain (stronger in shadows, minimal in highlights), varied cleanly per frame | Never crawl/pattern; never layer film grain over visible render noise (`$threejs-temporal-stability`) |
| Veiling glare | Lens scatter from extreme HDR sources | Wide, low-energy bloom above high HDR threshold (`$threejs-bloom`) | Never wash or grey blacks across the frame |
| Halation | Film/sensor scatter around bright edges | Faint warm halo on high-contrast bright-to-dark edges | Optional; use only when target aesthetic warrants it |
| Depth of field | Finite aperture | Computed from true pixel depth; emissive/glow sprites must carry their own depth or composite after DOF | Omit DOF on all-in-focus targets |

**Avoid unless explicitly requested by the visual target:** artificial sunbursts, aperture diffraction spikes, lens-flare ghost chains (route deliberate filmic lens flares to `$threejs-procedural-vfx`), dirty-lens overlays, and heavy noise hiding unconverged renders.

## Observed limits and defects

- **`saturateInGamut` domain requirement:** the `[0, 1]` gamut bound applies only to display-referred values *after* tone mapping; running it on unbounded linear HDR values will produce invalid limits.
- **Sky shoulder compression:** if sky blue looks dull and desaturated even with `AgX`, inspect pre-tonemap sky radiance; excessively bright sky HDR (`> 4–8`) pushes into the tone mapper's desaturating shoulder.
- **Double tone mapping:** leaving `pipeline.outputColorTransform = true` while also calling `renderOutput(...)` or tone-mapping inside custom materials crushes mid-tones and shifts color unpredictably.

## Diagnostics and failure diagnosis

Expose these inspection captures:

```text
pre-tonemap HDR false color     checks sky radiance, sunlit mid-albedo anchor, and clipping headroom
pre-grade vs final pair         compares percentiles (p1/p25/p50/p75/p95), saturation by class, and 8x8 local contrast
gamut/clipping overlay          highlights any channel >= 0.98 (250/255) or saturated channel clipping
single-tone-map assertion       verifies outputColorTransform flag matches explicit renderOutput usage
```

Failure diagnosis:

- **Image looks flatter and less realistic after grading:** post-tonemap S-curve compressed shadow/highlight texture, or global saturation clipped neighboring tones; move contrast before tone mapping and switch to class-aware `saturateInGamut`.
- **Sunlit white walls or cloud tops turn cream/yellow:** global vibrance or white-balance shift tinted neutrals; keep sunlit whites neutral and isolate saturation boosts by surface class.
- **Frame looks grey and washed out:** stacked fog/haze/bloom veil or unoccluded fill lifting `p1` blacks; fix at lighting/atmosphere rather than crushing blacks in the grade.
- **Glowing sprites blur or bloom inconsistently against different backgrounds:** DOF or post pass reads background depth behind depthless transparent sprites; write sprite depth or composite post-DOF.
