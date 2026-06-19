# Water, oceans, foam, and caustics

## Decompose water

Water combines:

- geometric displacement;
- small-scale normal detail;
- reflection and Fresnel;
- refraction/depth color;
- absorption and scattering;
- foam and shoreline interaction;
- caustic light where visible.

One scrolling normal map is a stylization, not a complete water model.

## Waves

The GPU Gems approach separates:

- a small number of geometric waves for silhouette and parallax;
- higher-frequency waves in a dynamic/animated normal field.

Gerstner waves add horizontal displacement, concentrating vertices at sharper crests. Keep combined steepness below looping/self-intersection conditions.

Use directional waves for wind-driven open water and circular/local waves for impacts, waterfalls, and confined pools.

## Normals

Derive tangents/normals analytically from the wave function when practical. This keeps lighting coherent with displacement. Blend additional normal detail with scale and directional logic.

## Foam

Generate foam from causes:

- high curvature or crest steepness;
- shallow depth/shoreline;
- collision/wake fields;
- temporal accumulation and decay.

Avoid static white noise. Foam has birth, advection, breakup, and fade.

## Refraction and depth

Use scene depth to estimate water thickness when the pipeline supports it. Apply stronger absorption through longer paths. Fade screen-space distortion at edges and when source data is unavailable.

## Caustics

Cheap: projected animated texture tied to water motion.  
Standard: derive focusing from surface normals and project onto receivers.  
High-end: wavefront/derivative or light-space simulation with temporal filtering.

## Quality ladder

- Cheap: vertex sine/Gerstner waves, two normal maps, Fresnel color.
- Standard: analytic normals, depth absorption, shoreline foam, planar/environment reflection.
- High-end: FFT or compute waves, wake fields, caustics, temporal reflection/refraction.

## Source basis

- [GPU Gems water chapter](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) for geometric versus texture waves, parameterized authoring, derivatives, and Gerstner waves.
- [Evan Wallace realtime caustics](https://medium.com/@evanwallace/rendering-realtime-caustics-in-webgl-2a99a29a0b2c) and [Martin Renou caustics](https://medium.com/@martinRenou/real-time-rendering-of-water-caustics-59cda1d74aa) as browser-oriented caustic references.
