---
name: threejs-lighting-and-gi
description: Author physically coherent Three.js lighting, HDRI fill, global illumination, and real-time reflections. Use for single-sun direction alignment, clear-sky sun-to-sky irradiance ratios, removing the HDRI second-sun, practical and emissive fixtures lighting surroundings, character lighting, GPU-baked irradiance probe grids (LightProbeGrid), planar and cube-probe reflections, and diagnosing flat or overcast scenes.
---

# Lighting, Global Illumination, and Reflections

Establish coherent direct light, sky fill, occluded indirect bounce, and real reflections before tuning tone mapping or color grading. Contrast, warmth, and depth belong in the light transport first.

## Build order

1. Define one authoritative sun/key direction in one place so visible disc, directional light, shadows, light patches, and sky glow agree from every angle.
2. Compute physical sun-to-sky irradiance ratios with [scripts/sun-sky.mjs](scripts/sun-sky.mjs) (`diffuse/direct ≈ 0.10–0.20` for clear sky) and calibrate `DirectionalLight.intensity` against `scene.environment` / `HemisphereLight`.
3. Prepare the HDRI as image-based fill only: remove its sun energy before prefiltering, align `scene.environmentRotation` to sun azimuth, and fix mismatched lower-hemisphere ground.
4. Validate direct + sky lighting in a neutral clay render (plus grey card `0.18` and white/mirror spheres) before adding surface textures or grade.
5. Add occluded indirect light — GPU-baked irradiance probes (`LightProbeGrid` or custom SH atlas) over reachable spaces — so recesses darken and colored bounce reaches soffits and alcoves.
6. Add practical fixtures and emissive-to-world lighting with inverse-square falloff and real-extent reflections.
7. Configure real reflections per surface class (planar mirror, cube/box-projected probes, or fallback-safe SSR) and verify them at full resolution and in motion.

Read [references/sun-sky-and-hdri-lighting.md](references/sun-sky-and-hdri-lighting.md) for clear-sky irradiance anchors, Three.js unit mapping, HDRI second-sun removal, flat/overcast lighting diagnosis, and orbit-safe stylized light deviations.

Read [references/irradiance-probes-and-reflections.md](references/irradiance-probes-and-reflections.md) for GPU-baked `LightProbeGrid` setup, probe cell sizing and leak prevention, SSGI trade-offs, planar/probe/SSR reflection ownership, and full-resolution diagnostics.

Read [references/practical-emissive-and-subject-lighting.md](references/practical-emissive-and-subject-lighting.md) for practical fixtures, static light baking, sub-pixel bulb energy conservation, emissive-to-world illumination, and subject/character key-fill-rim lighting.

Run `node scripts/sun-sky.mjs <elevationDeg> [sunIntensity]` (or `--self-test`) to derive clear-sky direct/diffuse ratios and Three.js sky-fill targets.

## Non-negotiable rules

- **One sun:** derive the directional light, sky model, aureole, and shadow direction from one shared vector. Verify with a mirror sphere and vertical stick shadow.
- **Physical sun-to-sky ratio first:** an overly bright HDRI or hemisphere fill is the primary cause of flat, overcast renders. Measure an up-facing shaded white swatch rather than trusting raw HDRI intensity.
- **HDRI is fill and reflection, never a visible backdrop or second sun:** strip the HDRI sun disc before PMREM prefiltering so it never casts a shadowless competing glow, and keep the visible sky on a sky model (`$threejs-atmosphere-aerial-perspective`).
- **Occlude indirect light:** uniform environment/hemisphere light makes alcoves and undersides glow like open roofs. Pair probe grids with contact AO (`$threejs-screen-space-ambient-occlusion`).
- **Emitters light their surroundings:** lanterns, windows, glowing water, fire, and screens must illuminate nearby surfaces and reflect with their real extent rather than sitting in an unlit world.
- **Update moving reflections continuously:** render all `6` cube faces every frame when reflected content moves; never step cube faces across frames or hide geometry bugs behind reflection blur.
- **Verify installed Three.js APIs:** `LightProbeGrid` and TSL `reflector` are version-sensitive; inspect the target project's installed Three.js build before writing imports.

## Failure conditions

- visible sun disc, shadows, specular highlights, and sky glow disagree on direction;
- HDRI sun energy floods shadow regions with unshadowed light, or the HDRI is used directly as the visible sky;
- raising fill to see poorly lit forms instead of fixing a misplaced key light;
- interiors, loggias, and under-hangs read as bright as open sunlit walls due to unoccluded fill;
- glowing fixtures or emissive surfaces cast zero light on adjacent geometry;
- characters or hero subjects use self-lit fills that ignore cast shadows, or accidental horror under-lighting;
- planar reflections leak below-plane geometry or normal-offset past wall bases into bright dashed seams;
- color grading or exposure is abused to manufacture missing key-to-fill contrast.

## Routing boundary

This skill owns direct lighting, sky/HDRI fill calibration, practical/emissive lighting, irradiance-probe GI, and reflections. Use `$threejs-shadow-systems` for shadow map coverage, cascades, clipmaps, bias, and caster update policies; `$threejs-screen-space-ambient-occlusion` for small-scale contact AO; `$threejs-atmosphere-aerial-perspective` for visible sky scattering and aerial haze; `$threejs-exposure-color-grading` for exposure, tone mapping, and LUT/grade; `$threejs-bloom` for HDR glare; and `$threejs-reference-reading` to decode lighting evidence from a visual reference.
