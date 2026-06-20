---
name: threejs-stylized-shader-transitions
description: Build controlled stylized shader transitions in Three.js. Use for holograms, dissolves, scans, materialization, glitch bands, edge emission, Fresnel shells, height or field-driven reveals, and transparent effects that need stable geometry-space logic and deliberate depth behavior.
---

# Stylized Shader Transitions

Transitions need a stable scalar field, an authored moving threshold, and separate treatment for intact, boundary, and removed regions.

## Core model

```text
field(position, attributes, noise)
threshold(time, controls)
distance = field - threshold

intact   = smoothstep(-softness, softness, distance)
boundary = 1 - smoothstep(edgeWidth, edgeWidth + feather, abs(distance))
```

Read [references/transition-field-recipes.md](references/transition-field-recipes.md).

## Rules

- Evaluate the reveal field in object or world space, not unstable screen UV, unless screen-space behavior is intentional.
- Distort the field before thresholding; do not only jitter final alpha.
- Keep scanline, Fresnel, glitch, and edge terms independently controllable.
- Decide whether removed fragments discard, fade, refract, or emit.
- Set transparent sorting, depth test, depth write, and blending intentionally.
- Provide a non-additive diagnostic view so shape is not hidden by bloom.
