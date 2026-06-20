---
name: threejs-procedural-materials
description: Author coherent procedural PBR materials in Three.js. Use for shared material fields, layered surface identity, causal wear and wetness, derivative-aware filtering, specular antialiasing, triplanar or atlas sampling, custom shadow modulation, and extending physical materials without losing their lighting model.
---

# Procedural Materials

Build a material from surface identity and causes. Color, roughness, metalness, normal, transmission, and emission should describe the same surface—not unrelated noise textures.

## Material graph order

```text
stable coordinates
  → structural fields
  → material identity weights
  → causal modifiers
  → filtered microstructure
  → PBR channels
  → lighting/shadow extensions
```

Read [references/procedural-pbr-system.md](references/procedural-pbr-system.md).

## Required controls

- real or perceptual texture scale;
- material identity weights;
- roughness range and micro-normal strength;
- wear, cavity, wetness, dust, or oxidation causes;
- distance/derivative filtering;
- specular antialiasing;
- channel and mask debug modes.

## Failure conditions

- every PBR channel samples independent noise;
- roughness is a scalar afterthought;
- high-frequency normals survive below one pixel;
- triplanar projection has visible orientation or scale seams;
- atlas padding is ignored under mipmapping;
- custom lighting removes energy conservation without an explicit stylized goal;
- post-processing is used to hide unstable highlights.
