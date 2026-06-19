---
name: threejs-animation-motion
description: "Build and diagnose expressive Three.js motion using AnimationMixer and clips, skeletal blending, crossfades, additive layers, locomotion state, root motion decisions, procedural animation, exact dampers and springs, quaternion motion, anticipation, follow-through, two-bone IK, terrain-adaptive foot placement, camera motion, UI motion, and motion readability. Use when animation pops, slides, feels weightless, ignores contact, lacks state coherence, or must respond procedurally to gameplay."
---

# Three.js Animation and Motion

Treat motion as a communication and control surface, not property interpolation.

## Workflow

1. Identify authored, simulated, procedural, and corrective motion layers.
2. Decide who owns root translation and rotation.
3. Build a state graph around intent and contact, not clip filenames.
4. Establish pose continuity before adding secondary motion.
5. Use frame-rate-independent dampers or springs with interpretable controls.
6. Apply IK after base animation and before final attachments/effects.
7. Validate silhouette, contact, timing, interruption, and low-frame-rate behavior.

## Load focused references

- Mixer ownership, clips, crossfades, additive layers, and root motion: [mixer-clips-blending.md](references/mixer-clips-blending.md)
- Exact damping, springs, anticipation, overlap, and procedural motion: [springs-procedural-motion.md](references/springs-procedural-motion.md)
- Analytical two-bone IK and terrain foot placement: [two-bone-foot-ik.md](references/two-bone-foot-ik.md)
- Camera/UI motion and readable timing: [motion-readability.md](references/motion-readability.md)
- Animation quality gate: [animation-rubric.md](references/animation-rubric.md)

Use the runnable [spring motion lab](examples/spring-motion-lab/index.html) to compare frame-dependent lerp, exact damping, and spring response.

## Guardrails

- Do not call `clipAction` repeatedly in the frame loop.
- Do not crossfade without resetting/playing the target action and managing weight.
- Do not let root motion and gameplay movement both author the same transform.
- Clamp unreachable IK targets and preserve a stable pole plane.
- Prefer motion parameters such as half-life, frequency, damping ratio, and duration over unexplained interpolation constants.
