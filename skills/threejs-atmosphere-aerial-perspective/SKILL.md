---
name: threejs-atmosphere-aerial-perspective
description: Implement physically motivated sky and aerial-perspective systems in Three.js. Use for planetary atmospheres, ground-to-space transitions, Rayleigh/Mie scattering, precomputed LUTs, depth-based transmittance and inscattering, sun/moon discs, and atmosphere-aware lighting.
---

# Atmosphere and Aerial Perspective

Treat sky rendering and aerial perspective as two views of the same scattering model. They must share radii, density profiles, coefficients, sun direction, exposure scale, and coordinate transforms.

## Choose the implementation tier

- Small scene with no orbital camera: analytic height/distance approximation.
- Planetary ground-to-space camera: ray integration or precomputed LUTs.
- Large geospatial world: LUTs plus world-to-planet transform, altitude correction, and depth-aware aerial perspective.

Read [references/atmosphere-system-contract.md](references/atmosphere-system-contract.md)
before implementation. It separates the LUT/ellipsoid architecture from
dynamic integration and the shell/post handoff.

Read the [LUT sky and aerial-perspective implementation](examples/lut-aerial-perspective/atmosphere-effect.js)
for shared transmittance/scattering lookup coordinates, sky-ray reconstruction,
surface-segment transmittance, and inscattering.

## Required outputs

- sky radiance;
- sun transmittance/color;
- segment transmittance from camera to visible surface;
- segment inscattering;
- optional sky irradiance for materials;
- explicit scale conversion between world units and atmosphere units.

## Failure conditions

- sky and terrain haze use different sun directions or coefficients;
- the atmosphere is a uniformly transparent sphere;
- camera altitude is measured in a local flat frame during orbital motion;
- scene depth is treated as linear when it is not;
- exposure is used to hide incorrect radiance scale;
- atmosphere fades abruptly at shell entry.

## Routing boundary

This skill owns molecular/aerosol sky scattering and surface-segment aerial
perspective. Use `$threejs-volumetric-clouds` for weather-shaped cloud density,
temporal cloud reconstruction, and cloud shadows.
