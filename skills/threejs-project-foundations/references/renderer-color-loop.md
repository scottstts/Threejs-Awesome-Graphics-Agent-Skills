# Renderer, color, and loop

## Renderer selection

Use WebGLRenderer when broad compatibility, established add-ons, and ordinary rendering are sufficient. Use WebGPURenderer when the project needs TSL-first materials, compute, or a specific capability that has been verified against target browsers.

Current WebGPURenderer releases can target WebGPU and fall back to a WebGL 2
backend. Do not confuse that backend fallback with maintaining a separate
WebGLRenderer application path. Create both renderer implementations only when
materials, post-processing, browser coverage, or behavior require it, and
encapsulate renderer-specific setup behind a narrow interface.

## Color pipeline

Three.js performs lighting in a linear working space. Keep:

- color textures such as base color and emissive in sRGB;
- normal, roughness, metalness, AO, height, masks, and packed data without a color-space annotation;
- HDR environment data in its intended linear encoding;
- output conversion and tone mapping exactly once.

If the entire image is wrong, inspect output conversion and tone mapping. If one asset is wrong, inspect that texture or material. Do not compensate for color mistakes with stronger lights.

## Timing

Maintain separate concepts:

- `elapsed`: deterministic periodic functions and timelines;
- `delta`: integrating velocity, damping, mixer updates, and timers;
- `fixedDelta`: physics and deterministic simulation.

Clamp long frame gaps before simulation. When using a fixed step, limit catch-up iterations to avoid a spiral of death.

Use frame-rate-independent damping:

```js
const alpha = 1 - Math.exp(-lambda * delta);
current.lerp(target, alpha);
```

## Resize and DPR

Observe the rendering container. Update:

- renderer drawing size;
- camera aspect or orthographic bounds;
- projection matrix;
- composer or render-target size;
- screen-space uniforms.

Choose a DPR ceiling from measured GPU cost. A high-density phone can have far more pixels than a desktop viewport.

## Baseline verification

- no console or shader errors;
- expected canvas dimensions and DPR;
- correct appearance of a known sRGB color and a neutral PBR material;
- stable speed at 30, 60, and 120 Hz;
- correct pause/resume behavior;
- no duplicate animation loop after hot reload or remount.
