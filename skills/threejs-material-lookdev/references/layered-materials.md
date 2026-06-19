# Layered dirt, wear, wetness, and age

## Build masks from causes

Use meaningful fields:

- curvature/convexity: exposed edge wear;
- cavity/concavity: trapped dirt;
- world-up: settled dust or snow;
- world-down/drip direction: streaking;
- contact and proximity: grime and polish;
- height and splash zones: mud/water;
- authored vertex color: storytelling control;
- UV masks/decals: specific damage.

Noise should break up a cause-driven mask, not replace it.

## Multi-channel effects

A layer changes several responses together.

Wetness:

- darker base color for many porous surfaces;
- lower roughness and stronger coherent reflection;
- possible normal flattening/puddling;
- drip/splash distribution.

Dust:

- lighter or desaturated base;
- higher roughness;
- reduced micro-normal contrast;
- upward accumulation and sheltered cavities.

Edge wear:

- coating removed at exposed edges;
- substrate color/metalness appears;
- local roughness and normal changes;
- directional scratches from use.

Oxidation:

- material-specific color;
- roughness and porous breakup;
- relation to exposure, moisture, and seams;
- often nonmetallic corrosion over metallic substrate.

## Frequency hierarchy

- Macro masks explain where the process happens.
- Meso shapes explain accumulation, streaks, chips, and handling.
- Micro detail explains grain, pits, and scratches.

If all three use the same noise, the result reads synthetic.

## Implementation

Combine textures, vertex colors, world-space fields, and procedural nodes. Preserve standard material slots:

```text
baseColor = mix(substrateColor, layerColor, mask)
roughness = mix(substrateRoughness, layerRoughness, mask)
metalness = mix(substrateMetalness, layerMetalness, mask)
normal = blendNormals(substrateNormal, layerNormal, mask)
```

Use reoriented normal mapping or another correct normal blend rather than adding normal RGB values.

## Failure diagnosis

- random dirt everywhere: missing causal mask;
- scratches visible from orbit: wrong scale/contrast;
- worn paint still metallic: substrate/coating classification wrong;
- wet surface looks black: environment/exposure and roughness too extreme;
- layer floats over detail: no coordinated normal/roughness response.
