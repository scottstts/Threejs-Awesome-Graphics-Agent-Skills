# Built sky, veil auditing, and world-space participating media

Use this reference to couple the visible sky and sun aureole to scene lighting units, prevent stacked haze/bloom veils, handle anti-aliased sky boundaries cleanly, and place volumetric god rays, mist banks, smoke, and fire in world space.

## Contents

- Built sky and solar aureole discipline
- Shared sky-to-lighting units and IBL baking
- Sky boundary coverage and veil audit
- World-space participating media
- Observed limits and defects
- Diagnostics and failure diagnosis

## Built sky and solar aureole discipline

- **The visible sky is always built from a scattering model:** never display an HDRI directly as the visible sky backdrop. Use a single-scattering Rayleigh (`lambda^-4`) + Mie forward-peaked model at minimum, or a precomputed multiple-scattering LUT model (`lut-aerial-perspective`) for accurate twilight, horizon brightening, and Earth shadow.
- **Physical sun disc (`0.53°`):** render the solar disc at its real angular diameter (`0.53°`, radius `~0.00462 rad`) with limb darkening (slightly darker, redder limb) and color derived from atmospheric transmittance along the sun path so low suns warm physically without arbitrary tinting.
- **Measured Mie aureole:** aerosol forward scattering produces a bright aureole extending a few degrees around the disc. Measure radial luminance at `10 / 25 / 50 / 90 / 140 px` from the sun (`$threejs-visual-validation` `scripts/measure.py --glow`) so the aureole is neither razor-sharp nor a milky half-sky.
- **Do not double-count lens glow:** keep atmospheric Mie aureole separate from post-process veiling glare (`$threejs-bloom`).
- **Clear sightlines physically:** when the sun should be visible through clouds, clear cloud density along the line of sight in the weather/coverage field rather than drawing a view-dependent cheat over opaque clouds.

## Shared sky-to-lighting units and IBL baking

Keep the visible sky model and scene lighting (`$threejs-lighting-and-gi`) in one shared radiance unit system:

1. Share one authoritative `sunDir` vector across the sky model, aerial perspective, `DirectionalLight`, and water/cloud shaders.
2. Bake the built sky (with the **sun disc stripped out**) into a PMREM `scene.environment` map whenever the sun moves significantly, so glossy reflections and sky fill match the visible zenith and horizon color automatically without introducing a shadowless second sun.
3. Verify the resulting clear-sky diffuse-to-direct ratio sits near `0.10–0.20` at mid-to-high sun elevations (`$threejs-lighting-and-gi` `scripts/sun-sky.mjs`).

## Sky boundary coverage and veil audit

### Coverage-blended sky exclusion
Aerial perspective (`L_seen = L_object * T(d) + L_inscatter(d)`) excludes sky pixels (`depth == far`). However, at anti-aliased silhouettes (roof ridges, tree branches, cables against sky), a binary depth test (`depth < far`) treats mixed edge pixels as either 100% foreground or 100% sky, carving bright or dark halo fringes along silhouettes. Blend aerial perspective smoothly by foreground coverage rather than a single unguarded depth threshold.

### Veil audit
Grey, low-contrast, washed-out scenes almost always come from multiple translucent veils stacking unintentionally:

```text
1. distance aerial perspective / extinction
2. local height fog or valley mist
3. cloud ambient haze
4. wide low-threshold bloom / veiling glare ($threejs-bloom)
5. post-process black-level lift ($threejs-exposure-color-grading)
```

Audit the veil by measuring the darkest `1%` (`p1`) and near-object `8×8` local contrast (`$threejs-visual-validation`), toggling each of the five terms off one by one, and trimming every contributor that exceeds the target atmosphere. Never leave near foreground objects veiled in a clear-air scene.

## World-space participating media

Author mist, fog banks, crepuscular god rays, smoke, and fire as **real world-space volumes** lit by scene lights with shadows and composited cleanly by depth — never screen-space streaks, flat painted sheets, or drawn 2D overlay specks:

| Medium | World-space contract | Banned stand-in |
| --- | --- | --- |
| **God rays (crepuscular rays)** | Sunlight in-scattered through thin haze with each march sample shadowed through the sun shadow map and/or cloud-shadow field; forward Henyey–Greenstein phase strongest toward the sun; half-res march + per-pixel offset + depth-aware bilateral upsample | Painted additive starbursts, screen-space radial blurs without real occluder gaps, or static unblurred dither textures |
| **Mist and fog banks** | Altitude-decaying height fog plus local 3D world-space volumes (gorges, waterfall bases, dawn water banks); sun-lit with shadows, forward-scattered toward sun, sky-tinted in shade; soft noisy volume edges | Flat fog-colored planes, cards, or single-ray-direction screen veils |
| **Smoke** | Wind-advected, buoyant 3D density volume (simulated or procedural) with sun-march self-shadowing (dark smoke absorbs; light smoke scatters) | Unshadowed billboard clouds |
| **Fire** | Emissive turbulent volume mapping temperature to blackbody color with smoke above, paired with a flickering local light illuminating surroundings (`$threejs-lighting-and-gi`); for interactive coupled voxel fluid fire, use `$threejs-procedural-vfx` | Unlit sprite-sheet loops in realistic scenes |
| **Spray, dust, bubbles** | Depth-tested, scene-lit, motion-blurred 3D world particles | Screen-space 2D overlay dots |

## Observed limits and defects

- **Fixed per-pixel raymarch dither:** using a static Bayer/hash start offset in half-resolution god rays without temporal variation or bilateral filtering leaves a visible stippled screen door over the light shafts; combine blue-noise/IGN start offsets with depth-aware bilateral upsampling (`$threejs-temporal-stability`).
- **Sea-fog overhang artifact:** a sea-fog bank whose density profile is widest high above the water curves inward underneath and looks like it is hovering above the waves; place the widest profile low near the waterline with gentle upward taper.
- **Unshadowed fog volumes:** adding world-space mist without shadow-map sampling washes shadows out inside sunlit valleys instead of carving crisp light shafts.

## Diagnostics and failure diagnosis

Expose these inspection views:

```text
sky + aureole only           checks zenith/horizon gradient and radial glow profile (10-140 px)
aerial perspective only      displays transmittance T(d) and directional inscatter color
veil toggle checklist        individually toggles distance haze, height fog, cloud haze, bloom, black lift
participating-media pass     isolates shadowed volumetric god rays / mist before bilateral upsample
```

Failure diagnosis:

- **Scene reads foggy, grey, and flat despite strong sun:** multiple haze/glare terms are stacking; run the 5-term veil audit and measure `p1` black level.
- **Sun glow fills half the sky in white haze:** Mie `g`/turbidity is too wide or atmospheric aureole and post bloom are double-counted; measure radial falloff and narrow each stage independently.
- **Sky looks painted or flat:** hand-picked RGB gradient instead of scattering model, or raw HDRI used as visible sky; replace with shared scattering sky model.
- **God rays appear with no real gap in clouds or architecture:** screen-space radial smear used instead of shadowed world-space in-scattering; sample sun shadow map / cloud optical depth per step.
