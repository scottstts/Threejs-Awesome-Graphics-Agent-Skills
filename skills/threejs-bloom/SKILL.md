---
name: threejs-bloom
description: Implement production bloom in advanced Three.js scenes. Use for HDR signal ordering, physically grounded veiling glare, bloom-node controls, dual selective bloom with guaranteed material restoration, scene-relative emissive hierarchy, off-screen pop prevention, sprite depth ownership, and effect-isolation diagnostics.
---

# Bloom

Bloom is a camera/display **veiling glare** response to bright HDR signal — a wide, low-energy spread above a high threshold, never a grey film over ordinary surfaces. Establish scene exposure and emissive luminance hierarchy before tuning blur.

## Workflow

1. Inspect pre-tone-map luminance and separate atmospheric sun aureole from lens bloom so glow is not double-counted.
2. Choose which HDR values should bloom (`sun > practical fixtures > luminous signs > ambient surfaces`).
3. Choose a single-node HDR bloom pass or a dual selective-render ownership model.
4. Calibrate threshold above the brightest non-glowing surface, plus radius, smooth width, and low-energy strength in HDR.
5. Restore all substituted materials transactionally (`try/finally`) for selective passes.
6. Ensure transparent glow sprites own valid depth (or composite after DOF) when depth-based passes run alongside bloom.
7. Composite before exposure/tone mapping, then validate base, contribution, final, and turning-past-edge motion views.

Read [references/hdr-bloom-system.md](references/hdr-bloom-system.md) for the
HDR ordering, veiling-glare calibration, dual selective-bloom transaction,
compact emissive hierarchy, off-screen pop safeguards, and ownership limits.

Apply the material substitution/restoration ownership pattern in the
reference before adding selective bloom to a composed scene.

## Failure conditions

- bloom creates the only visible form of an effect or veils the whole frame in grey glare;
- all bright materials share one arbitrary emission multiplier instead of a physical hierarchy;
- threshold is tuned after tone mapping or set low enough to bloom sunlit white stone/clouds;
- sky aureole and wide lens bloom stack together into an oversized washed-out sun halo;
- bloom pops or flickers abruptly as a bright emitter crosses the viewport edge;
- emissive sprites bloom or blur inconsistently depending on background depth behind them;
- selective bloom mutates scene materials without `try/finally` restoration guarantees;
- bloom radius changes wildly with resolution or highlights turn grey from early clamping.

## Routing boundary

Use `$threejs-exposure-color-grading` for metering, adaptation, tone mapping,
and LUTs; `$threejs-atmosphere-aerial-perspective` for physical sky sun aureole;
`$threejs-temporal-stability` for edge-pop and guard-band stability; and
`$threejs-image-pipeline` only when bloom must be composed with several shared
image-space systems. A per-pixel ray integrator that owns its own reduced-resolution
target and accumulation history keeps its bloom internal; route that to
`$threejs-raymarched-space-effects`.
