---
name: threejs-atmosphere-aerial-perspective
description: Implement physically motivated sky and aerial-perspective systems in Three.js. Use for planetary atmospheres, ground-to-space transitions, Rayleigh/Mie scattering, precomputed LUTs, depth-based transmittance and inscattering, sun/moon discs, and atmosphere-aware lighting.
---

# Atmosphere and Aerial Perspective

Treat sky rendering and aerial perspective as two views of the same scattering model. They must share radii, density profiles, coefficients, sun direction, exposure scale, and coordinate transforms.

This skill contains exemplary examples and assets beyond descriptive guidance,
they're worth studying, referencing, or even copying. Use them sufficiently
when relevant and do NOT blindly skip them.

## Choose the implementation tier

- Small scene with no orbital camera: analytic height/distance approximation.
- Planetary ground-to-space camera: ray integration or precomputed LUTs.
- Large geospatial world: LUTs plus world-to-planet transform, altitude correction, and depth-aware aerial perspective.

Read [references/atmosphere-system-contract.md](references/atmosphere-system-contract.md)
before implementation. It separates the LUT/ellipsoid architecture from
dynamic integration and the shell/post handoff.

Read [references/sky-veil-and-participating-media.md](references/sky-veil-and-participating-media.md)
for built-sky vs IBL-only HDRI discipline, `0.53°` limb-darkened sun disc and
measured Mie aureole, coverage-blended sky boundaries, the 5-term veil audit,
and world-space participating media (shadowed god rays, local mist banks, smoke).

Read the [LUT sky and aerial-perspective entry](examples/lut-aerial-perspective/atmosphere-effect.js)
and its `source/` modules for the SkyMaterial, SkyLightProbe,
SunDirectionalLight, AerialPerspectiveEffect, precomputed-texture loader,
sun/moon direction, lens flare, tone mapping, and dithering path used by the
LUT example.

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
- atmosphere fades abruptly at shell entry;
- a raw HDRI is displayed directly as the visible sky backdrop;
- distance fog, height fog, cloud haze, and wide bloom stack into an unaudited grey veil;
- god rays or mist are faked with painted bursts or screen-space overlays instead of shadowed world-space volumes.

## Routing boundary

This skill owns molecular/aerosol sky scattering, surface-segment aerial
perspective, veil auditing, and world-space participating media (god rays, mist,
fog banks). Use `$threejs-lighting-and-gi` for sun-to-sky irradiance calibration
and sun-stripped HDRI fill; `$threejs-volumetric-clouds` for weather-shaped cloud
density, temporal cloud reconstruction, and cloud shadows; and
`$threejs-procedural-vfx` for emissive aurora curtain volumes, coupled WebGPU
voxel fluid fire/smoke, and standalone filmic HDR lens-flare compositors. Keep
the LUT example's lens flare here when it remains one stage in the sky-scattering
and aerial-perspective composition.
