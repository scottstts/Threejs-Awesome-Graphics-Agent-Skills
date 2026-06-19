# Atmosphere and volumetrics

## Atmosphere

Atmospheric appearance comes from extinction and in-scattering along view and light paths.

- Rayleigh scattering: small molecules, stronger at short wavelengths; blue sky and red sunsets.
- Mie scattering: larger aerosols; haze and bright forward halo near the sun.
- Ozone/absorption: affects spectral color, especially twilight.
- Density generally falls with altitude.

For ground scenes, an artistic sky plus height fog may be sufficient. Use full spherical atmosphere only when altitude, sunsets, planets, or space views demand it.

## Implementation tiers

- Cheap: analytic gradient sky, sun disc, exponential height fog, distance haze.
- Standard: low-sample ray integration through spherical atmosphere.
- High-end: precomputed transmittance/scattering LUTs, aerial perspective volume, multi-scattering approximation.

The classic numerical model samples the camera ray and accounts for light arriving from the sun and attenuation on both sun-to-sample and sample-to-camera paths. LUT approaches trade memory and precomputation for stable runtime quality.

## Volumetric fog and light

Integrate density and lighting through a bounded volume. Use:

- height and distance density;
- local noise/erosion;
- phase function for directional scattering;
- shadow/light visibility;
- early exit when transmittance is negligible;
- temporal jitter/accumulation for low sample counts.

## Clouds, smoke, and fire

Clouds:

- macro weather/coverage field;
- base shape density;
- erosion detail;
- lighting and silver lining;
- temporal wind coherence.

Smoke:

- source shape;
- buoyant advection;
- curl/turbulence;
- expansion and dissipation;
- self-shadow or light attenuation.

Fire:

- combustion shape and upward flow;
- emissive temperature ramp;
- distortion/heat haze;
- smoke and sparks;
- fast rise, breakup, and decay.

## Failure diagnosis

- gray flat sky: no sun-angle/phase distinction;
- fog pasted over image: no depth/height relation;
- clouds look like solid marble: density threshold too hard, no erosion hierarchy;
- smoke boils randomly: no coherent advection;
- god rays everywhere: scattering not tied to occlusion/light direction;
- temporal trails: history rejection insufficient.

## Source basis

- [GPU Gems accurate atmospheric scattering](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering)
- [Bruneton precomputed atmosphere](https://ebruneton.github.io/precomputed_atmospheric_scattering/)
- [Maxime Heckel sky, sunsets, and planets](https://blog.maximeheckel.com/posts/on-rendering-the-sky-sunsets-and-planets/)
