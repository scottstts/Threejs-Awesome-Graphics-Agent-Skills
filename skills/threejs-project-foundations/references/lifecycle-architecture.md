# Lifecycle and architecture

## Ownership ledger

For every long-lived object, identify its owner and release path:

| Resource | Typical release |
| --- | --- |
| geometry | `dispose()` after final user |
| material | dispose material and owned textures |
| texture | `dispose()` after final user |
| render target | `dispose()` |
| controls | `dispose()` |
| animation mixer | stop actions, uncache roots/clips |
| event listener | remove with the same target/type/function/options |
| observer | disconnect |
| worker | terminate |
| audio nodes/context | disconnect/close as appropriate |
| renderer | stop loop, dispose, detach canvas |

Shared resources need reference counting or an asset owner. Scene traversal alone cannot determine whether a texture is shared elsewhere.

## Teardown order

1. Stop accepting input.
2. Stop the animation loop and asynchronous updates.
3. Remove listeners, observers, timers, and subscriptions.
4. Stop animation, audio, workers, and physics.
5. Detach scene objects and release owned GPU resources.
6. Dispose renderer-side systems and detach the canvas.
7. Clear application references so garbage collection can proceed.

## Context loss

Listen for loss/restoration when the application is long-running or GPU-heavy. Prevent default only when the app has a real restoration strategy. Keep source asset data or reload paths separate from transient GPU objects.

## Architecture pressure

Extract modules when one of these becomes true:

- more than one feature writes the same state;
- setup and teardown are no longer visibly paired;
- update order matters;
- the same resource is shared by multiple owners;
- tests need to replace a system;
- a renderer or framework migration is plausible.

Avoid an elaborate engine for a one-scene page. Explicit ownership matters more than class count.
