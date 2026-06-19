---
name: threejs-cinematic-lighting-composition
description: "Diagnose and improve Three.js scene aesthetics through camera lens choice, framing, blocking, focal hierarchy, value grouping, motivated key/fill/rim/practical lighting, exposure, color temperature, atmosphere, scale cues, depth layering, tone mapping, and restrained post-processing. Use when a scene feels flat, cheap, generic, noisy, random, overprocessed, scale-less, unfocused, or like a debug camera, and subjective critique must become concrete technical changes."
---

# Three.js Cinematic Lighting and Composition

Translate taste into camera, geometry, light, material, atmosphere, and image-pipeline decisions.

## Workflow

1. Identify the intended subject, emotional beat, interaction path, and target genre.
2. Diagnose the frame in grayscale and at thumbnail size.
3. Fix camera and large masses before adding lights or effects.
4. Establish one dominant light direction and intentional fill.
5. Separate foreground, midground, subject, and background through overlap, value, focus, atmosphere, and motion.
6. Calibrate exposure and tone mapping before bloom or grading.
7. Recheck readability from active gameplay and mobile cameras.

## Load focused references

- Taste-to-implementation diagnosis table: [scene-composition-diagnosis.md](references/scene-composition-diagnosis.md)
- Lens, FOV, camera height, framing, and blocking: [camera-lens-framing.md](references/camera-lens-framing.md)
- Key/fill/rim/practical light, exposure, temperature, depth, and haze: [lighting-exposure-depth.md](references/lighting-exposure-depth.md)
- Genre-oriented scene strategies: [genre-lighting-playbooks.md](references/genre-lighting-playbooks.md)
- Cinematic scene quality gate: [cinematic-rubric.md](references/cinematic-rubric.md)

Use the runnable [flat-to-cinematic comparison](examples/flat-to-cinematic/index.html) to inspect how camera, value separation, lighting direction, atmosphere, and material hierarchy combine.

## Guardrails

- Do not use darkness, fog, bloom, or shallow depth of field to conceal weak modeling.
- Keep motivated and decorative lights distinguishable.
- Avoid changing every variable at once; fix dependency order.
- Preserve game information even when the desired mood is low-key or chaotic.
