# Glass, volume, anisotropy, and cloth

## Glass and transmission

Believable glass needs context:

- visible thickness or a justified thin-surface model;
- environment and objects to refract/reflect;
- Fresnel reflection at grazing angles;
- attenuation/absorption over distance;
- roughness appropriate to polishing or frost;
- stable sorting and sufficient render resolution.

IOR and specular reflectance represent related physical behavior. Avoid independently pushing both to arbitrary extremes.

For colored solid glass, attenuation should increase with traveled thickness. Uniform tinting of every fragment reads like transparent plastic.

## Thin versus volume

Use thin transmission for windows, sheets, or bubbles where internal distance is negligible. Use volume/thickness for bottles, gems, liquids, and solid transparent forms.

Transmission is expensive because it depends on background rendering and often additional sampling. Provide lower-cost alpha/reflection approximations where needed.

## Anisotropy

Anisotropy stretches highlights along a tangent direction:

- brushed metal;
- machined circular grooves;
- satin and woven cloth;
- hair-like aligned fibers.

The tangent direction is part of the material. Incorrect or discontinuous tangents produce visibly rotating highlights. Generate or author tangents and inspect them.

## Cloth and sheen

Cloth often has a soft grazing response from fibers. Use sheen as a controlled grazing lobe, not general brightness. Pair with weave-scale normal/roughness structure and avoid hard plastic highlights.

## Coated surfaces

Clearcoat adds a second usually smooth dielectric lobe above the base:

- car paint;
- varnished wood;
- lacquered plastic;
- coated carbon fiber.

The coat changes visible response of the base. Keep coat normal and roughness distinct when the implementation supports it.

## Quality ladder

- Cheap: transparent/reflection approximation, isotropic highlights.
- Standard: physical transmission/IOR, thickness proxy, clearcoat or sheen.
- High-end: volume absorption, dispersion, anisotropy, separate layer normals, path-traced lookdev validation.

## Source basis

- [Filament Materials Guide](https://google.github.io/filament/Materials.md.html) for transmission, absorption, thickness, micro-thickness, IOR, anisotropy, cloth, and dispersion concepts.
- [Khronos glTF material extensions](https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/) for portable clearcoat, transmission, volume, IOR, sheen, specular, anisotropy, and iridescence semantics.
