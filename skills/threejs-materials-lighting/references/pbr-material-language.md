# PBR material language

## Build roles before instances

Define a small material library with semantic roles. Each role should specify:

- base color range;
- metalness classification;
- roughness range and variation scale;
- normal/detail character;
- edge wear or dirt behavior;
- emissive or transmission behavior;
- expected environment response.

Use parameters and textures to create variants without producing an unrelated material for every mesh.

## Diagnostic order

When a surface looks wrong:

1. Verify texture color spaces and UVs.
2. Inspect normals and tangents.
3. View base color without lighting.
4. View roughness and metalness as grayscale debug output.
5. Test with a neutral environment.
6. Check scale: detail frequency must match object size.
7. Check tone mapping and exposure.

## Common material failures

- Everything at roughness 0.5: no material identity.
- Nonmetals with high metalness: dark, implausible response.
- Pure black base color on metals: reflection disappears.
- Excessive normal strength: noisy, crushed highlights.
- Emissive used as a replacement for lighting.
- Glass without thickness, environment, or readable background.
- Unique materials differing only by color: unnecessary program and draw fragmentation.

## Stylization

Stylized PBR can simplify reality while preserving response logic. Control:

- stepped or remapped roughness;
- broad gradient lighting;
- limited hue shifts by normal or height;
- deliberate rim or matcap contribution;
- quantized shadows;
- hand-authored texture scale.

Keep a consistent rule set across the scene.
