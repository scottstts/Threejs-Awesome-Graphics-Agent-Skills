---
name: threejs-exposure-color-grading
description: Build a measured exposure, tone-mapping, and color-grading path in Three.js. Use for deliberate AgX, ACES, and Neutral tone-mapper selection, RenderPipeline outputColorTransform ownership, scene-referred contrast, TSL gamut-limited class-aware saturation, encoded 64x36 luminance metering, asymmetric eye adaptation, 3D LUT grading, and subtle photographic lens and sensor traits.
---

# Exposure and Color Grading

Treat exposure, tone mapping, grading, and lens traits as distinct stages applied **on top of correct lighting**. A grade never substitutes for key-to-fill lighting (`$threejs-lighting-and-gi`) or atmospheric clarity.

## Order

```text
HDR scene (after AO / atmosphere / HDR bloom)
  → anchored or adapted exposure + scene-referred contrast
  → single tone map (AgX / ACES / Neutral)
  → display-referred grade (gamut-limited class-aware saturation / 3D LUT)
  → subtle photographic lens & sensor traits
  → final output conversion
```

Read [references/tonemapping-grading-and-lens.md](references/tonemapping-grading-and-lens.md) for choosing between `AgXToneMapping`, `ACESFilmicToneMapping`, and `NeutralToneMapping`, `RenderPipeline.outputColorTransform` ownership, avoiding post-tonemap S-curve flatness, TSL `saturateInGamut`, and restrained lens/sensor traits.

Read [references/scene-referred-color-pipeline.md](references/scene-referred-color-pipeline.md) for the `64×36` encoded luminance meter, asynchronous readback, asymmetric eye adaptation, display-domain `32³` LUT construction, and metering diagnostics.

## Failure conditions

- tone mapping occurs twice (e.g., `outputColorTransform = true` alongside an explicit `renderOutput` or material tone map);
- a heavy post-tonemap S-curve flattens shadow and highlight surface texture (measured by `8×8` local contrast dropping after grade);
- exposure or grading is abused to repair physically inconsistent light ratios or stacked fog/glare veils;
- naive saturation clips channels, shifts hues, or tints sunlit whites and neutral stone;
- brightness-keyed teal/orange tinting overrides light-driven color;
- adaptation speed is symmetric toward light and dark, or meter weighting is uninspected;
- a display-domain LUT or `[0, 1]` gamut clamp is run on unbounded scene-referred HDR;
- unrequested lens flares, sunbursts, dirty-lens overlays, or heavy film grain hide render noise.

## Routing boundary

This skill owns exposure anchoring/adaptation, tone-map ownership, scene- and display-referred grading, LUTs, and subtle lens/sensor traits. Use `$threejs-lighting-and-gi` for key-to-fill contrast and warm/cool light balance; `$threejs-bloom` for HDR veiling glare; `$threejs-procedural-vfx` for standalone filmic HDR lens-flare compositors; `$threejs-temporal-stability` for AA and motion noise; and `$threejs-image-pipeline` when coordinating shared buffers across multiple image-space systems.
