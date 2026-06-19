# Noise, FBM, Voronoi, and domain warping

## Choose the field by visual job

- Hash/value noise: cheap irregularity and seeds.
- Gradient/simplex noise: smooth natural variation.
- FBM: layered frequency detail.
- Ridged noise: creases, mountains, veins.
- Voronoi/cellular: cells, cracks, scales, bubbles.
- Curl noise: divergence-free flow direction.
- Domain warping: bends coordinates before sampling to create organized complexity.

## Frequency hierarchy

```text
macro = noise(p * 0.25)
meso  = noise(p * 1.5 + warp)
micro = noise(p * 12.0)
```

Do not sum octaves with equal semantic weight. Assign each band a purpose. Keep micro detail low enough to filter at the target pixel density.

## Domain warping

```glsl
vec2 q = vec2(
  fbm(p + vec2(0.0, 0.0)),
  fbm(p + vec2(5.2, 1.3))
);
float field = fbm(p + warpStrength * q);
```

Large warp values can fold patterns into indistinct mush. Apply directional or masked warping when the effect has a flow, grain, or growth direction.

## Temporal coherence

Animate an extra noise dimension or advect coordinates. Sliding 2D noise often looks like a texture conveyor belt. For smoke/fire, combine upward advection, turbulence, and shape erosion.

## Anti-aliasing

High-frequency procedural detail shimmers because sampling cannot represent it. Reduce octave count by distance, use derivatives/fwidth for thresholds, prefilter textures, or move microstructure into filtered normal maps.

## Quality ladder

- Cheap: 1–2 noise calls and texture lookup.
- Standard: 4–5 octave FBM, purposeful warp, derivative-aware edges.
- High-end: 3D/4D noise, curl flow, distance-adaptive frequency, temporal accumulation.

## Source basis

- [The Book of Shaders](https://thebookofshaders.com/) for shaping, noise, patterns, and generative composition.
- [Inigo Quilez articles](https://iquilezles.org/articles/) for practical SDF/noise/domain-warping technique.
