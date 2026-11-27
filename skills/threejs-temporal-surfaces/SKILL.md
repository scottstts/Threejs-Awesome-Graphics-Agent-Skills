---
name: threejs-temporal-surfaces
description: Build view-aligned and screen-space surface effects in Three.js. Use for touch-history frost and thaw, ping-pong accumulation, reduced-resolution blur, crystalline masks, two-scale refraction, and procedural rain droplets that refract and blur a background through wet glass.
---

# Temporal Surfaces

Choose persistent history or procedural screen-space evolution explicitly. Do
not fake accumulation with time-only noise, and do not allocate history for an
effect whose complete state is analytic in time.

This skill contains exemplary examples and assets beyond descriptive guidance,
they're worth studying, referencing, or even copying. Use them sufficiently
when relevant and do NOT blindly skip them.

## Pipeline

```text
persistent surface: input -> ping-pong state -> blur -> structure -> refraction
procedural surface: time/coverage -> analytic field -> optical normal -> refraction/blur
```

Read [references/ping-pong-accumulation.md](references/ping-pong-accumulation.md)
for an exact frost pass graph, pointer-history channels, blur and refraction
coupling, and implementation defects that must be corrected.

Read the
[touch-history frost implementation](examples/touch-history-frost/frost-surface-effect.js) for the
previous/deposit/next state transition, reduced blur, static structures,
frost-mask composition, and two-scale refraction.

Read [references/refractive-window-rain.md](references/refractive-window-rain.md)
and the
[refractive window rain implementation](examples/refractive-window-rain/window-rain-effect.js)
for layered static and travelling droplets, finite-difference optical normals,
background refraction, stochastic disc blur, aspect fill, and presentation.

## Rules

- Separate persistent state, analytic procedural state, and scene color.
- Preserve separate visible-mask and tilt-response channels.
- Use half-float for this history path unless a measured lower format is equivalent.
- Convert per-frame history decay to frame-rate-independent decay.
- Run the two-pass scene blur at reduced resolution.
- Pre-render static procedural textures once.
- Define and test resize/reset behavior for both history targets and static targets.
- Do not route world footprints, object-UV paint, or simulation-plane wetness here; this skill is view-aligned or screen-space.

## Routing boundary

Use `$threejs-temporal-stability` for general frame-to-frame antialiasing, guard bands, amortised pass contracts, and motion bisection across the whole renderer. Use `$threejs-procedural-vfx` for world- or object-space residue and particles. Use `$threejs-precipitation-surfaces` for world-space rain, puddles, snow, and weather-surface coupling. Use `$threejs-procedural-materials` when a body must transmit its surroundings through its own volume rather than through a screen-aligned pane. This skill owns view-aligned wet-glass optics and screen-space persistent history.
