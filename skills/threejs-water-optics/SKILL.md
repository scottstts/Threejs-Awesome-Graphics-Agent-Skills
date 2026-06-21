---
name: threejs-water-optics
description: Build production analytic water in Three.js. Use for shared multi-wave displacement and normals, derivative-filtered normal bands, analytic sky reflection, side-aware Fresnel, heuristic screen refraction, fallback Beer-Lambert path length, and crest foam.
---

# Water Optics

Treat water as geometry motion, surface orientation, and a participating optical layer. A blue transparent material is not a water system.

For large stochastic seas driven by directional spectra and GPU FFTs, use
`$threejs-spectral-ocean` instead.

## Build order

1. Define wave bands and evaluate displacement.
2. Derive the normal analytically from the same waves.
3. Choose displaced geometry or explicitly normal-only water.
4. Establish scene-color ownership for heuristic refraction.
5. Declare whether absorption uses true depth or a fallback path-length estimate.
6. Blend analytic reflection/refraction through side-aware Fresnel.
7. Derive foam and glints from the shared wave response.
8. Filter unresolved normal bands from derivatives.

Read [references/water-surface-system.md](references/water-surface-system.md)
for the exact five-wave displaced ocean, six-band normal-only water, optical
hierarchy, and the limits that distinguish both from the spectral-ocean skill.

Read the
[analytic wave optics implementation](examples/analytic-wave-optics/water-system.js) for
shared displacement/normals, derivative filtering, reflection, screen-space
refraction, absorption, Fresnel, and crest-linked foam diagnostics.

## Failure conditions

- normal texture motion does not agree with displaced crests;
- heuristic refraction can sample foreground objects but the limitation is undisclosed;
- fallback path length is presented as reconstructed scene thickness;
- micro-waves alias into sparkling noise;
- foam is a scrolling texture unrelated to the shared crest metric;
- Fresnel is replaced by constant opacity;
- reflection, refraction, and transparency are all added without energy control.

## Routing boundary

Use `$threejs-spectral-ocean` for stochastic directional spectra, FFT
cascades, Jacobian breaking, and persistent ocean foam. This skill owns
authored analytic waves and bounded-water optics.
