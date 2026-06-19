---
name: threejs-gameplay-interaction
description: "Build responsive Three.js interaction and gameplay systems: pointer and touch input, raycasting, keyboard and gamepad intents, camera rigs, update order, animation state, HUD feedback, accessibility, fail/retry flow, pacing, and game feel. Use when creating interactive scenes or browser games, fixing controls or cameras, adding picking and manipulation, or turning a rendered scene into a playable experience."
---

# Three.js Gameplay and Interaction

Make the core loop playable before expanding content or polish.

## Workflow

1. State the loop in one sentence: action, objective, pressure, reward, failure, retry.
2. Convert device events into stable input intents.
3. Keep input collection separate from simulation.
4. Implement one complete playable slice with feedback and restart.
5. Tune movement and camera together.
6. Add interaction affordances, hover/focus states, and failure recovery.
7. Test keyboard, pointer, touch, gamepad, focus loss, resize, low FPS, and reduced motion as relevant.
8. Iterate one feel variable at a time using short playtests.

## Update order

```text
input intents
→ fixed simulation/physics
→ gameplay state and collisions
→ animation and VFX
→ camera
→ UI/audio bridge
→ render
```

## Rules

- Use raycasting only against intentional targets and layers.
- Normalize pointer coordinates relative to the canvas bounds.
- Clear stuck input on blur, visibility change, pointer cancel, and touch cancel.
- Use exponential damping or equivalent frame-rate-independent smoothing.
- Show cause and effect through motion, sound, camera, VFX, and UI without duplicating noise.
- Keep restart fast and complete; stale timers, listeners, bodies, particles, and state are defects.

Read [references/loop-input-architecture.md](references/loop-input-architecture.md), [references/camera-controls.md](references/camera-controls.md), and [references/game-feel.md](references/game-feel.md).
