# Shader workflow

## Choose the integration level

- Standard material parameters: physically based surface, no custom math.
- Material hook: small local modification with accepted coupling to Three.js chunks.
- TSL node material: portable node-authored surface and WebGPU path.
- ShaderMaterial: full custom vertex/fragment behavior with Three.js-provided transforms.
- RawShaderMaterial: complete shader control and complete responsibility.

Prefer the highest-level option that preserves the intended look.

## Coordinate-space ledger

Write down every vector:

| Value | Space |
| --- | --- |
| position attribute | object |
| transformed normal | object/world/view depending on stage |
| camera direction | world or view |
| light vector | match the normal space |
| screen UV | normalized screen |
| depth | nonlinear clip or reconstructed view |

Many “lighting bugs” are space mismatches.

## Debug progression

1. Solid output.
2. UV gradient.
3. Normal visualization.
4. World or view position visualization.
5. One term at a time.
6. Final composition.

Use toggles or debug modes; do not diagnose a complex final shader as one opaque expression.

## Stability

- Clamp denominators.
- Avoid normalizing near-zero vectors.
- Keep raymarch loops bounded.
- Handle camera-inside-volume cases.
- Use precision appropriate to mobile.
- Avoid NaN propagation; a single invalid value can poison later passes.
- Update uniforms in place rather than replacing uniform objects.

## Compilation

Changing defines, material classes, and shader source can trigger compilation. Warm critical variants before first interaction when startup budget allows.
