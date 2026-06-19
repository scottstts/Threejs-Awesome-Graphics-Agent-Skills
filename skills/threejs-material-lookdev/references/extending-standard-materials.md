# Extending standard materials

## Decision order

1. Configure built-in material properties and maps.
2. Use `onBeforeCompile` for a narrow, accepted coupling to shader chunks.
3. Use TSL node materials for version-verified procedural slot control.
4. Use a helper such as CustomShaderMaterial when its dependency and version range fit.
5. Write a full custom lighting model only when the standard BRDF is fundamentally unsuitable.

Preserving the built-in model retains shadows, fog, skinning, morphing, IBL, tone mapping, clipping, and renderer integration.

## Good extension targets

- vertex displacement;
- procedural color and roughness masks;
- triplanar mapping;
- custom normal detail;
- dissolve/edge emission;
- curvature/contact fields;
- stylized remapping of standard response.

## Risks

- shader-chunk names can change;
- material program cache keys must include compile-time variants;
- depth/distance/shadow materials may need matching displacement or alpha logic;
- defines create shader variants;
- custom code may bypass color management or tone mapping;
- cloned materials may not preserve external state as expected.

## Verification matrix

Test:

- direct and environment lighting;
- shadows as caster and receiver;
- depth and distance passes;
- fog;
- transparent/alpha-tested mode;
- skinning/morphs if applicable;
- renderer and Three.js version;
- disposal and hot reload.

## Source basis

- [THREE-CustomShaderMaterial](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial), reviewed at version 6.4.0 as an MIT-licensed technique for extending built-in material outputs.
- [Three.js material customization examples](https://threejs.org/examples/) for current renderer-specific patterns.

Treat helper libraries as optional. The durable idea is to alter surface inputs while preserving the renderer’s established lighting pipeline.
