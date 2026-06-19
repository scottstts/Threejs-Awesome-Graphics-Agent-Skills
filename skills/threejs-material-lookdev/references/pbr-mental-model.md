# PBR mental model

## What the shader is approximating

A surface response combines diffuse and specular reflection. A common real-time specular model is microfacet-based:

- `D`: distribution of microfacet orientations;
- `G`: masking and shadowing between facets;
- `F`: Fresnel reflectance by view/light angle.

Roughness changes the distribution and visibility of specular reflection; it is not merely “blur.” Fresnel causes reflectance to increase toward grazing angles. Energy conservation keeps reflected energy from exceeding incoming energy.

## Dielectric versus conductor

Dielectric:

- colored diffuse response;
- generally achromatic incident specular;
- typical reflectance near a few percent;
- examples: plastic, ceramic, stone, paint, wood.

Conductor:

- no ordinary diffuse lobe;
- colored specular response;
- base color represents conductor reflectance;
- examples: bare gold, copper, aluminum, iron.

Painted metal is normally dielectric paint over metal. Unless the metal is exposed, the visible surface should not be metallic.

## Roughness

Roughness must vary by material history and scale:

- macro: large polished versus worn zones;
- meso: brushing, fingerprints, orange peel, pores;
- micro: fine scratches and normal breakup.

One uniform roughness value makes different substrates converge visually.

## Material layers

Modern artist-friendly models use a small set of meaningful lobes:

- base diffuse/specular;
- clearcoat;
- sheen;
- anisotropy;
- transmission/volume;
- subsurface approximation.

Use only layers visible in the reference and justified by the surface construction.

## Three.js translation

- `MeshStandardMaterial`: standard metal/rough PBR.
- `MeshPhysicalMaterial`: clearcoat, transmission, IOR, sheen, iridescence, anisotropy, dispersion, and volume-related features depending on version.
- Node materials/TSL: procedural slot control.
- Custom extension: preserve built-in transforms, shadows, IBL, and light integration.

## Source basis

- [Filament rendering notes](https://google.github.io/filament/main/filament.html) for microfacet BRDF, energy conservation, IBL, camera, and mobile-quality principles.
- [Disney physically based shading](https://disneyanimation.com/publications/physically-based-shading-at-disney/) for measured-material observations and principled artist controls.
- [pbrt v4](https://pbr-book.org/4ed/contents) for deeper BSDF/light-transport reference.
