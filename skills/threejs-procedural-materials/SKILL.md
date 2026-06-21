---
name: threejs-procedural-materials
description: Author production procedural materials in Three.js. Use for atlas filtering and specular AA, planet-space material fields, terrain wetness, per-instance dissolve, authored PBR identities, derivative normals, and custom direct-light shadow modulation.
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

Read [references/procedural-pbr-system.md](references/procedural-pbr-system.md)
for atlas filtering, specular AA, planetary coordinates,
world-height wetness, per-instance dissolve, and authored PBR response bundles.

Read the
[sculpted gallery frame geometry](../threejs-procedural-geometry/examples/sculpted-gallery-frame/frame-geometry.js)
for walnut, antique-gold, and ebony texture/roughness/metalness/clearcoat
bundles under a grazing-light setup.

Read the
[procedural planet surface](../threejs-procedural-planets/examples/procedural-planet-surface/planet-system.js)
for shared geological, climate, water, biome, roughness, and derivative-normal
causes on a procedural planetary surface.

Read the
[analytic wave optics](../threejs-water-optics/examples/analytic-wave-optics/water-system.js)
for coupled reflection, refraction, absorption, filtered microstructure,
resolved crest response, and their diagnostic channels.

## Required controls

- real or perceptual texture scale;
- material identity weights;
- roughness range and micro-normal strength;
- the causal fields required by the selected material pattern;
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

## Routing boundary

Use `$threejs-procedural-fields` when the main problem is designing shared
scalar/vector causes. Use `$threejs-procedural-planets` for a complete
orbit-to-close-approach body, not merely its material.
