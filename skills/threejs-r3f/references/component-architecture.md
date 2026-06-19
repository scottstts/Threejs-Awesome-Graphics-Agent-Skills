# Component architecture

## Boundaries

Good components own a coherent behavior or asset:

- environment;
- player;
- product model;
- camera rig;
- interaction layer;
- effect system;
- HUD bridge.

Avoid one component per trivial mesh when it obscures shared materials, transforms, or update order.

## State categories

- Declarative application state: mode, selected item, score, menu.
- Transient simulation state: velocity, target transforms, impulses.
- GPU/render state: material uniforms, buffers, visibility.
- Derived UI state: sampled or event-driven values for DOM.

Keep each in the system that updates it most naturally.

## Resource sharing

Memoize or hoist shared geometry and materials. Understand R3F disposal:

- declaratively created resources are generally lifecycle-managed;
- primitives and shared cached assets may require explicit ownership;
- `dispose={null}` prevents automatic disposal but transfers responsibility.

## Canvas boundary

Keep DOM error/loading/accessibility UI outside Canvas when possible. Treat Canvas configuration as application infrastructure, not a convenient place for unrelated business state.

## Escape hatches

Use `primitive`, `extend`, portals, custom render loops, or direct renderer access only when their ownership and update behavior remain explicit.
