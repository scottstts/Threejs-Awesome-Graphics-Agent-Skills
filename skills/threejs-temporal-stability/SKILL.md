---
name: threejs-temporal-stability
description: Keep Three.js scenes crisp and artifact-free in motion, not only in converged stills. Use for antialiasing strategy (MSAA and specular AA versus TAA smear), stochastic and amortised raymarching contracts, full-quality still paths, screen-space guard bands, update-rate parity for moving shadows and reflections, detail-tier hysteresis, preventing camera-following artifacts and wrap seams, motion bisection, and animation plausibility.
---

# Temporal Stability

Judge every stochastic, screen-space, camera-dependent, or animated system **in motion and close up**. A still frame captured after `N` identical frames hides grain, disocclusion stripes, reprojection smear, and stepped updates.

## Build order

1. Inventory every temporal surface in the scene: antialiasing, stochastic passes, amortised or accumulated buffers, per-N-frame updates, detail-tier handovers, screen-space lookups, camera-dependent terms, periodic procedural wraps, and object animations.
2. Choose MSAA on the scene pass plus specular AA and anisotropic mipmaps in materials; keep TAA light or off so moving edges stay sharp.
3. For every stochastic or amortised pass, define its per-frame stability plan, disocclusion fallback, and a full-quality non-amortised path for stills and offline captures.
4. Add a `15–20%` screen-space guard band (cropped on output) and graceful pixel-position fallbacks for screen-space refraction, SSR, AO, and blur.
5. Update moving shadows, moving reflections, and live simulations every frame; remove horizontal distance-from-camera clearing or darkening hacks.
6. Verify stability with a 6-move motion capture suite stepped frame-by-frame at real frame rate, bisecting any artifact by freezing time and toggling passes one at a time.

Read [references/temporal-stability-and-aa.md](references/temporal-stability-and-aa.md) for the AA hierarchy, amortised-pass contract, guard-band sizing, update-rate parity, periodic-wrap alignment, and temporal failure catalogue.

Read [references/motion-bisection-and-plausibility.md](references/motion-bisection-and-plausibility.md) for the motion capture protocol, frame-stepped bisection workflow, secondary-motion physics, and per-frame clearance verification.

## Non-negotiable rules

- **MSAA + specular AA first:** TAA alone smears thin edges and foliage during motion; never substitute TAA or reduced render resolution for geometric MSAA and material roughness filtering.
- **Amortised passes must be invisible in motion:** 1-in-N pixel tracing or staggered updates are valid only when untraced pixels fill from a matching current trace, disocclusions fill from a direction-correct sky/probe fallback, reprojection does not blur on turns, and a full-quality path exists.
- **Guard bands on screen-space lookups:** render internal scene/depth targets `15–20%` wider than the viewport and crop on output; fall back smoothly toward the pixel's own UV rather than clamping to a single edge row.
- **No camera-following shading hacks:** camera-dependent terms must be physically view-dependent (Fresnel, specular, parallax), never horizontal distance-from-camera clearing discs or darkening bands.
- **Moving content updates every frame:** shadows of wind-blown foliage, characters, and vehicles plus reflections of moving scenes update every frame — never stepped over `N` frames or rotating one cube face per frame.
- **Every lookup wraps identically:** for endless roads, scrolling surf, or periodic loops, wrap geometry, textures, foam, and shadows on the exact same period.

## Failure conditions

- grain or fireflies appear only while moving because temporal accumulation resets on camera motion;
- edges and fine detail smear during camera pans due to TAA without MSAA or eased camera velocity never reaching zero;
- slanted stripes trail behind fast turns because disoccluded pixels sample stale previous-direction history;
- vertical streaks or ghost trails appear along viewport borders from unclamped screen-space refraction/SSR lookups;
- a bare circular disc or shadow pole travels underneath the camera when looking downward;
- shadows, reflections, or detail tiers step or pop noticeably during smooth travel;
- periodic loop seams flash because one texture or shadow lookup wraps at a different offset than the others;
- animated parts interpenetrate mid-cycle or ignore physical timescales.

## Routing boundary

This skill owns general frame-to-frame stability, AA policy, guard bands, amortised/accumulated pass contracts, and motion bisection across the whole renderer. Use `$threejs-temporal-surfaces` for view-aligned screen-space persistent effects (touch-history frost, wet-window rain droplets); `$threejs-procedural-animation` for authored transform timelines, docking, springs, and quaternions; `$threejs-image-pipeline` for multi-pass render-target ownership; `$threejs-volumetric-clouds` for cloud-specific temporal upscaling; and `$threejs-visual-validation` for deterministic capture harnesses and quantitative image metrics.
