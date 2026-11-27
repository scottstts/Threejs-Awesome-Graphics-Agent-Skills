# Temporal stability, antialiasing, and guard bands

Use this reference to prevent frame-to-frame rendering defects — shimmer, moving grain, reprojection smear, disocclusion stripes, border trails, stepped updates, and camera-following artifacts — before they ship.

## Contents

- Temporal surface inventory
- Antialiasing hierarchy
- Stochastic and amortised pass contract
- Screen-space guard bands and edge fallbacks
- Update-rate parity and detail-tier stability
- Camera-dependent bans and periodic wrap invariance
- Temporal failure catalogue
- Observed limits and defects
- Diagnostics and failure diagnosis

## Temporal surface inventory

Before tuning post-processing or performance, list every subsystem in the scene that depends on frame index, camera velocity, or screen boundaries:

```ts
type TemporalSurfaceEntry = {
  subsystem: string
  category: "aa" | "stochastic" | "amortised" | "periodic-update" | "lod" | "screen-space" | "wrap" | "animation"
  inMotionStrategy: string
  disocclusionFallback: string
  fullQualityPath: string
}
```

Every item in the table must have both a verified **in-motion stability strategy** and an explicit **full-quality switch** for stills and offline captures.

## Antialiasing hierarchy

Layer antialiasing by defect mechanism rather than expecting one post-process pass to solve all aliasing:

1. **Geometric edges — MSAA (`samples: 4` on scene pass):** resolves silhouette edges and thin architectural bars cleanly without motion blur.
2. **Dense specular detail — Specular AA in materials (`$threejs-procedural-materials`):** increases effective roughness from screen-space normal variance (`fwidth(normalWorld)`) so gold relief, wet pavement, and fine mouldings do not sparkle in motion.
3. **Texture minification — Mipmaps + anisotropic filtering (`anisotropy: 8–16`):** prevents crawling brick courses and floor tiles at grazing angles.
4. **Optional light TAA:** use TAA only as a gentle final refinement after MSAA + specular AA are working. Relying on TAA alone without MSAA produces smeared detail while panning and jagged-to-smooth snapping when the camera stops.
5. **Eased camera settle threshold:** damped orbit/flight cameras whose exponential velocity asymptotically approaches zero (`1e-5` per frame) can keep bilinear temporal reprojection blurring indefinitely. Snap negligible camera translation/rotation deltas (`< 1e-4` units/rad) cleanly to zero.

## Stochastic and amortised pass contract

Stochastic passes (volumetric clouds, participating-media god rays, GTAO, SSR) and amortised passes (`1` pixel in `N` traced per frame, checkerboard tracing) must satisfy four strict invariants:

1. **Per-frame stability:** allocate enough samples or a depth/normal-aware spatial denoise (bilateral filter / bilateral upsample) so a moving frame does not collapse into visible grain while history resets.
2. **Matching untraced fill:** when tracing `1` pixel per `2×2` or `4×4` tile per frame, fill untraced neighbours from the current low-resolution trace — never from a stale or mismatched environment cube that produces a visible dark checkerboard grid.
3. **Direction-correct disocclusion fallback:** on a fast camera turn, newly revealed pixels at the viewport edge have no valid prior-frame history. Fill disocclusions from a direction-correct fallback (such as a low-cost baked sky cube or current-frame low-res march) instead of stretching the previous direction's buffer into slanted fading stripes.
4. **Mandatory full-quality path:** every amortised, half-resolution, or temporally accumulated pass must expose a clean flag (`fullQuality = true`) that traces all pixels at full resolution every frame with zero history reuse. The full-quality render must depict the exact same image with higher fidelity, never different lighting or geometry.

## Screen-space guard bands and edge fallbacks

Screen-space lookups — refraction through thick glass or bounded water, SSR, GTAO, and wide screen-space blurs — sample neighbours offset from the current pixel UV. Near the viewport border, those offsets step outside `[0, 1]`.

```text
Internal render dimensions:
  guardMargin = 0.15 to 0.20   (15-20% wider and taller than display viewport)
  renderWidth  = round(displayWidth  * (1 + guardMargin))
  renderHeight = round(displayHeight * (1 + guardMargin))
  expand projection FOV to match overscan ratio, then crop center display region on output
```

When an extreme refraction or reflection ray still exits the guard band:

- **Blend smoothly toward the pixel's own screen position** or a matched local reflection probe.
- **Never clamp directly to the border texel (`clamp(uv, 0, 1)`):** clamping maps an entire strip of out-of-frame rays onto one edge row/column, smearing horizontal/vertical streaks that trail behind camera motion.
- **Disable temporal history inside the guard band** so border fallbacks never smear into the active viewport as the camera turns.

```js
// Overscan camera sizing + smooth guard-band fallback helper
export function computeGuardBandProjection(displayWidth, displayHeight, displayVfovDeg, margin = 0.18) {
  const scale = 1 + margin;
  const renderWidth = Math.round(displayWidth * scale);
  const renderHeight = Math.round(displayHeight * scale);
  const tanHalf = Math.tan(((displayVfovDeg * Math.PI) / 180) * 0.5);
  const overscanVfovDeg = (2 * Math.atan(tanHalf * scale) * 180) / Math.PI;
  const cropMin = (1 - 1 / scale) * 0.5;
  const cropMax = 1 - cropMin;
  return { renderWidth, renderHeight, overscanVfovDeg, cropMin, cropMax };
}

// In shader: compute soft margin validity (1 inside safe band, 0 past edge)
// float edgeDist = min(min(sampleUV.x, 1.0 - sampleUV.x), min(sampleUV.y, 1.0 - sampleUV.y));
// float valid    = smoothstep(0.0, 0.04, edgeDist);
// vec2  safeUV   = mix(fragScreenUV, sampleUV, valid);
```

### Full-quality non-amortised switch contract

Every reduced-resolution or amortised subsystem must expose one uniform contract so stills, regression captures, and offline exports bypass all temporal compromises cleanly:

```ts
type TemporalQualityMode = {
  fullQuality: boolean       // true -> 100% pixels traced at full res, zero history reuse
  amortiseTileSize: 1 | 2 | 4 // 1 when fullQuality is true
  historyAlphaMax: number    // 0 when fullQuality is true; <= 0.85 during motion
  settleDeltaPosM: number    // snap camera delta < 1e-4 m to 0
  settleDeltaAngleRad: number // snap camera delta < 1e-4 rad to 0
}
```

Confirm parity by rendering one static frame with `fullQuality = false` (after `30` frames) beside `fullQuality = true` (`1` frame): mean brightness, color, and silhouette placement must match within `< 1%` (`$threejs-visual-validation`), differing only in edge crispness and noise floor.

## Update-rate parity and detail-tier stability

- **Dynamic casters and reflections update every frame:** wind-animated trees, characters, vehicles, and moving water reflections must update at full frame rate (`1:1` with presentation). Updating shadows every `2–4` frames or rotating `1` of `6` cube-map faces per frame produces obvious stepped stutter during smooth pans.
- **Projected-size detail tiers with hysteresis:** switch LOD tiers by projected screen footprint (pixels covered) rather than rigid world-distance rings, and apply hysteresis or a short dithered/geometric blend band so hovering near a threshold never oscillates.
- **Tier parity:** neighbouring LOD tiers must match in mean color, projected coverage, normals, and translucency (`$threejs-procedural-vegetation`, `$threejs-terrain-and-landscapes`). Never distance-cull visible world layers inside the view frustum.

## Camera-dependent bans and periodic wrap invariance

- **No horizontal distance-from-camera shading or clearing:** clearing grass/foliage within a horizontal radius `R` of `camera.position.xz` carves a bare circular disc that travels beneath the viewer when looking straight down. Only hide or fade geometry the camera lens is physically inside (`3D` spherical clearance `< near * 2`).
- **No screen-position fog or haze bands:** fog and aerial perspective belong to world ray distance and altitude (`$threejs-atmosphere-aerial-perspective`), never screen UV offsets that rotate with camera pitch.
- **Identical wrap periods:** in endless roads, repeating surf cycles, or scrolling procedural worlds, every field — displaced mesh coordinates, textures, foam history, wind gusts, and shadow-map projections — must share one exact wrap modulus. If one channel wraps out of phase, a visible flash sweeps across the scene every cycle.

## Temporal failure catalogue

| Symptom | Root mechanism | Confirmation test | Engineering fix |
| --- | --- | --- | --- |
| Grainy only while camera moves | Low sample count relying on temporal accumulation that rejects during motion (plus film grain stacked on top) | Compare static converged frame vs slow pan | Raise per-frame samples or add bilateral spatial denoise; remove film grain over render noise |
| Soft, smeared edges in motion | TAA without MSAA, or aggressive history alpha (`> 0.9`) | Inspect thin high-contrast silhouettes during pan | Enable `4x` MSAA + specular AA; lighten or disable TAA |
| Blur never settles after stopping | Bilinear reprojection softening every frame while damped camera velocity never hits `0` | Log camera delta per frame; hard-zero camera | Snap sub-threshold camera deltas (`< 1e-4`) to `0`; use sharper history filter (Catmull-Rom) |
| Dark checkerboard/grid in clouds or volumetrics | Amortised `1`-in-`N` tracing filling untraced pixels from mismatched fallback | Freeze frame during turn and inspect `4x` crop | Fill untraced pixels from current low-res trace; verify full-quality still path |
| Slanted fading stripes after fast turn | Disoccluded pixels sampling previous-direction history | Fast `90°` yaw turn stepped frame by frame | Fill disocclusions from direction-correct baked sky cube or current-frame trace |
| Streaks trailing along viewport edges | Screen-space lookup clamped to border texel | Slow pan watching left/right/bottom margins | Render `15–20%` guard band + crop; fade out-of-band samples toward pixel position or probe |
| Bare disc or dark ring under camera | Horizontal `xz` distance clearing or distance-from-camera darkening | Look straight down from `2 m`, `10 m`, and `50 m` | Remove horizontal distance hacks; clear only `3D` lens intersection |
| Stepped shadows or reflections | Shadow maps updated every `N` frames or cube faces rotated across frames | Step consecutive frames during smooth motion | Update dynamic shadows and all `6` cube faces every frame |
| Flashing seam on periodic loop | One lookup (foam, texture, shadow, or noise) wraps with a different period | Step frames across the exact wrap boundary | Derive all periodic wraps from one shared loop constant |

## Observed limits and defects

- **Guard-band fill-rate cost:** a `15–20%` linear overscan increases shaded pixel count by `32–44%` on the passes that require it; apply overscan selectively to opaque/refraction/SSR targets that actually read off-screen pixels, not indiscriminately to unrelated passes.
- **MSAA + deferred/MRT bandwidth:** `4x` MSAA increases MRT memory footprint; validate VRAM usage alongside `samples: 4` when running multiple half-float MRT attachments.
- **Zero-cost amortisation myth:** poorly engineered amortisation costs more debugging and visual quality than a clean, lower-octave per-frame pass.

## Diagnostics and failure diagnosis

Expose these diagnostics whenever temporal stability is audited:

```text
temporal inventory           list of all stochastic, amortised, screen-space, and periodic passes
fullQuality toggle           switches every amortised/reduced pass to full-res every-frame rendering
history rejection mask       highlights disoccluded pixels and fallback path selection
guard-band border overlay    displays overscan crop boundary and out-of-band fallback weight
frame-diff heatmap           amplified |frame[t] - frame[t-1]| during fixed-step motion
```

Failure diagnosis:

- **Static shot looks clean, pan dissolves into grain:** temporal accumulation is hiding an under-sampled stochastic pass; switch `fullQuality = false` while panning slowly, increase per-frame sample count or add bilateral spatial denoising, and verify film grain is not stacked on top of stochastic noise.
- **Edges stay blurry seconds after orbit stops:** damped camera controls still emit tiny per-frame deltas (`1e-5`) that trigger bilinear history resampling; clamp deltas below `1e-4` units/rad to exact zero and replace bilinear history lookup with Catmull-Rom.
- **Horizontal or vertical trails follow screen margins:** a screen-space refraction, SSR, or GTAO pass clamps out-of-bounds UVs to `[0, 1]`; add a `15–20%` overscan guard band and blend out-of-band samples smoothly toward pixel UV or local probe color.
- **Dark checkerboard flashes inside clouds or fog during turns:** amortised `1`-in-`N` tracing fills untraced pixels from a mismatched fallback; fill untraced pixels from the current frame's low-resolution trace and confirm parity against `fullQuality = true`.
- **Single-frame bright flash repeats on a timer:** one wrapped lookup (foam, texture UV, noise phase, or shadow offset) uses a different modulus than the loop period; derive every periodic channel from one shared loop constant.
