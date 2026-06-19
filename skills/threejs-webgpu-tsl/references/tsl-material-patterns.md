# TSL material patterns

Verify exact symbol names against the installed Three.js version.

## Prefer material slots

Use node-material properties such as color, roughness, metalness, normal, emissive, opacity, and position displacement before replacing complete outputs. This preserves more of the standard lighting model.

## Organize nodes

- Inputs: uniforms, textures, attributes, time, camera, object data.
- Fields: noise, masks, gradients, distances.
- Surface: color, roughness, normal, emission.
- Geometry: displacement and deformation.
- Output: standard slot composition or explicit override.

Build reusable node functions with explicit inputs rather than closing over many global nodes.

## Update frequency

Classify values:

- static at graph construction;
- uniform changed by application;
- frame-updated;
- object-updated;
- render-updated;
- storage data written by compute.

Avoid rebuilding node graphs for changing values that should be uniforms.

## Migration from GLSL

1. Port math, not syntax.
2. Identify standard material behavior that GLSL previously reimplemented.
3. Replace coordinate and texture access with TSL nodes.
4. Port one visual term at a time.
5. Compare output under a neutral test scene.
6. Keep raw WGSL/GLSL interop as a narrow escape hatch.

## Debugging

Route intermediate nodes to color output, inspect generated shader diagnostics, and reduce to a minimal graph. Verify data type and vector width at every composition boundary.
