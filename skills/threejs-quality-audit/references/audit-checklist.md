# Audit checklist

## Correctness

- installed versions and imports agree;
- one loop and clear update order;
- resize and DPR are correct;
- color textures and output are correct;
- no console, shader, or asset errors;
- loading failure has a visible path;
- teardown releases listeners and owned resources;
- repeated mount/restart does not duplicate state.

## Visual

- focal hierarchy and camera composition;
- authored silhouette and construction;
- coherent material roles;
- readable lighting and shadows;
- effects support rather than conceal;
- interaction states are visually clear;
- UI and world share a design language.

## Performance

- target device and viewport tested;
- frame-time evidence collected;
- draw calls, triangles, textures, and passes understood;
- no hot-loop allocations or React rerender storms;
- quality ladder exists;
- startup and sustained mobile behavior considered.

## Interaction and accessibility

- keyboard/pointer/touch/gamepad as scoped;
- focus, cancel, blur, and pause behavior;
- no critical color-only state;
- reduced motion and readable UI;
- retry/restart path;
- controls and camera remain legible under stress.

## Release

- debug tools and secrets absent;
- asset licenses recorded;
- fallback and unsupported-browser behavior;
- screenshot and capture paths verified;
- cache/versioning behavior;
- error monitoring or diagnostics appropriate to scope.
