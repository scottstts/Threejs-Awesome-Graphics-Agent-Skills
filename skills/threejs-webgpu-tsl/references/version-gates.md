# Version gates

TSL and WebGPU APIs evolve quickly. Exact imports, class names, node slots, post-processing managers, and compute helpers can change between Three.js releases.

## Before implementation

1. Read the installed `three` version from the lockfile.
2. Inspect package exports for `three/webgpu`, `three/tsl`, and relevant add-ons.
3. Search the installed package source and examples for the exact symbol.
4. Confirm the official docs page corresponds to the same release when possible.
5. Run a minimal import/build test before writing a large feature.

## Compatibility contract

Record:

- Three.js version;
- browser and OS matrix;
- required WebGPU features and limits;
- WebGL fallback expectations;
- material and post-processing path;
- device-loss behavior;
- quality reductions.

## Feature detection

Distinguish:

- browser exposing `navigator.gpu`;
- adapter availability;
- required adapter features;
- required numeric limits;
- Three.js backend successfully initializing;
- the specific scene rendering correctly.

Do not infer the later stages from the first.

## Fallback

Choose one:

- WebGPURenderer's built-in WebGL 2 backend fallback;
- a separate full WebGLRenderer equivalent;
- a separate visually reduced WebGLRenderer path;
- static or video fallback;
- explicit unsupported message.

As of Three.js r184, `WebGPURenderer` attempts WebGPU and falls back to a
WebGL 2 backend by default; `forceWebGL` selects that backend explicitly. This
does not guarantee that every node, post-processing path, or project
integration behaves identically. Test the actual backend and keep a separate
renderer implementation only when feature compatibility requires it.

Test fallback intentionally. A nominal fallback that imports unsupported materials is not a fallback.
