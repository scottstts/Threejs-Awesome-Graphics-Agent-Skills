# Frame updates, state, and loading

## Frame updates

Use `useFrame` for high-frequency mutations and system updates. Use delta time. Reuse scratch objects.

Avoid:

- `setState` every frame;
- subscribing a component to a large store for one transient value;
- allocating vectors in every callback;
- heavy parsing or pathfinding in the frame loop;
- conflicting writes from multiple `useFrame` callbacks.

Use frame priorities only when order or manual rendering is truly required.

## State stores

Use narrow selectors for React-visible state. For transient per-frame values, read store state directly or subscribe outside React when appropriate. Do not put disposable Three.js resources into persistence by accident.

## Loading

- Use Suspense-aware loaders.
- Preload predictable critical assets.
- Add an error boundary and retry or fallback.
- Avoid remounting an entire Canvas to recover one asset.
- Keep a stable fallback that does not itself require the failing asset.
- Clone cached scenes only to the degree required by mutation and animation.

## On-demand rendering

Use demand rendering for static or event-driven scenes. Invalidate on controls, animation-library changes, asynchronous asset changes, and imperative mutations. Continuous gameplay should use an always-running loop.
