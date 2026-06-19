# Loop and input architecture

## Input intents

Map devices to semantic values:

```text
moveX, moveY
lookX, lookY
jumpPressed
primaryHeld
interactPressed
pausePressed
```

Keyboard, pointer, touch, and gamepad adapters write intents. Simulation consumes them. This keeps gameplay independent of device events.

## Event hygiene

- Attach to the narrowest useful target.
- Use pointer events for unified mouse, pen, and touch where appropriate.
- Track pointer capture for drags.
- Clear held state on blur, hidden document, cancel, and disconnect.
- Prevent scrolling only on the intended interactive surface.
- Preserve keyboard focus and visible focus affordances.

## Raycasting

- Convert coordinates from canvas bounds.
- Filter by layers or explicit target collections.
- Use bounding proxies or BVH acceleration for large meshes.
- Decide whether hits should recurse.
- Distinguish hover, press, drag, and activation.
- Reuse the raycaster and vectors.

## First playable slice

Include:

- one controllable action;
- one objective;
- one challenge;
- one reward or progress signal;
- one fail or completion state;
- restart;
- visual and audio feedback hooks;
- diagnostics.

A rendered environment without a controllable loop is not a game slice.

## State boundaries

Use explicit states such as loading, ready, playing, paused, failed, and complete. Gate input and updates by state instead of scattering booleans.
