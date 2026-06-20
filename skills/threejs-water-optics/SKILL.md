---
name: threejs-water-optics
description: Build bounded or analytic procedural water in Three.js. Use for Gerstner wave bundles, stable analytic normals, screen-space refraction, depth thickness, Beer-Lambert absorption, shore and wake foam, sun glitter, underwater handoff, and distance-filtered detail.
---

# Water Optics

Treat water as geometry motion, surface orientation, and a participating optical layer. A blue transparent material is not a water system.

For large stochastic seas driven by directional spectra and GPU FFTs, use
`$threejs-spectral-ocean` instead.

## Build order

1. Define wave bands and evaluate displacement.
2. Derive the normal analytically from the same waves.
3. Establish scene color and depth inputs for refraction.
4. Reconstruct water thickness.
5. Apply absorption and in-scattering.
6. Blend reflection/refraction through Fresnel.
7. Add foam and glints from physical or geometric causes.
8. Filter wave bands by distance and pixel footprint.

Read [references/water-surface-system.md](references/water-surface-system.md).

## Failure conditions

- normal texture motion does not agree with displaced crests;
- refraction samples foreground objects;
- shallow and deep water have the same transmission;
- micro-waves alias into sparkling noise;
- foam is a scrolling texture unrelated to crest, shore, or wake;
- Fresnel is replaced by constant opacity;
- reflection, refraction, and transparency are all added without energy control.
