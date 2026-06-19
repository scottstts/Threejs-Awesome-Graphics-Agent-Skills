---
name: threejs-physics-collisions
description: "Choose, implement, tune, and debug collision and physics systems for Three.js and React Three Fiber, including custom overlap tests, Rapier, cannon-es, rigid bodies, kinematic controllers, fixed timesteps, interpolation, sensors, collision groups, CCD, and collider design. Use when gameplay requires reliable contacts, slopes, moving platforms, projectiles, balls, vehicles, triggers, or physics performance work."
---

# Three.js Physics and Collisions

Choose the lightest reliable model. Three.js renders; a separate system owns simulation.

## Selection ladder

1. Use custom sphere, AABB, capsule, ray, lane, or trigger logic for simple arcade rules.
2. Prefer Rapier for robust new browser-game rigid-body work.
3. Consider cannon-es for small JavaScript-only simulations with modest complexity.
4. Use another engine only for a project-specific capability or existing dependency.

## Workflow

1. Define required behavior, determinism, body counts, contact complexity, target devices, and failure cases.
2. Establish world scale and units.
3. Use a fixed simulation step with a clamped accumulator.
4. Build simple collision proxies independent of render meshes.
5. Centralize body creation, stepping, event consumption, transform sync, and removal.
6. Use sensors for gameplay triggers and CCD only for fast bodies.
7. Interpolate visuals when fixed-step motion is visibly uneven.
8. Test restart, tunneling, low-FPS spikes, sleeping, moving platforms, and collision filtering.

## Rules

- Never step serious physics with raw variable frame delta.
- Avoid dynamic triangle-mesh colliders.
- Keep one authority for transforms; do not alternately move a dynamic body and its mesh.
- Use kinematic control for authored movement and dynamic bodies for simulated response.
- Dispose bodies, colliders, joints, event queues, and debug visuals.

Read [references/engine-selection.md](references/engine-selection.md) and [references/fixed-step-colliders.md](references/fixed-step-colliders.md).
