# Material reference analysis

## Collect useful references

Use at least:

- broad diffuse light;
- grazing or directional light;
- close detail with known scale;
- clean and aged examples;
- multiple viewing angles.

A single dramatic photograph mixes material, lighting, exposure, lens, grading, and environment.

## Decompose the surface

1. Substrate: metal, polymer, stone, wood, skin, textile, glass.
2. Manufacturing/growth: cast, machined, brushed, woven, layered, porous.
3. Coating: paint, varnish, oxide, oil, dust, moisture.
4. Damage/history: edge wear, scratches, contact grime, bleaching, fingerprints.
5. Scale: object size and feature wavelengths.
6. Response: highlight width, grazing brightness, reflection distortion, transmission.

## Build order

1. Neutral base color and metalness.
2. Broad roughness.
3. Meso roughness/normal variation.
4. Micro-normal response.
5. Coating or volume.
6. Story masks.
7. Production lighting validation.

Do not start with dirt and scratches; they cannot rescue an incorrect substrate.

## Taste-to-implementation table

| Critique | Inspect | Technical direction |
| --- | --- | --- |
| looks plastic | uniform roughness, broad highlight, weak micro-normal | roughness hierarchy, scale-correct normal breakup, better IBL |
| metal looks flat | no reflected structure, no anisotropy or edge response | structured environment, brushing direction, exposed-edge mask |
| looks procedurally noisy | equal noise at all scales | field-driven masks, scale hierarchy, directional/process logic |
| looks painted-on | no thickness or normal response | geometry/bevels, normal detail, roughness response |
| too clean | no contact/handling history | curvature, upward/downward, cavity, touch, and splash masks |
| too dirty | dirt independent of gravity/contact | reduce coverage and tie masks to plausible accumulation |

## Calibration

Use a sphere, rounded box, plane, and the production mesh. The sphere exposes BRDF response; the production mesh exposes UV, scale, and curvature issues.

Use a neutral HDR environment plus a large area-like highlight and grazing light. Rotate the environment rather than accepting one flattering angle.

## Checklist

- base color remains plausible without lighting baked in;
- roughness contains structured variation;
- detail scale matches object scale;
- grazing response matches reference;
- material remains recognizable under at least three environments;
- story layers follow construction and use.
