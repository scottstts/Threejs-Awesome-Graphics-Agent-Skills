# Material rubric

| Dimension | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| substrate classification | wrong | generic | correct metal/dielectric | layered construction is explicit |
| base color | implausible/baked | approximate | calibrated and color-correct | robust across environments |
| roughness | uniform | single noisy map | scale-structured variation | process/history-driven hierarchy |
| Fresnel/specular | absent/wrong | default without validation | plausible grazing/reflectance | reference-matched response |
| normals/detail | broken/overscaled | one generic normal | scale-correct meso/micro detail | coordinated layered normal system |
| environment response | none | flattering-only | tested under multiple IBL/light rigs | raster/reference comparison |
| age/story | random noise | generic dirt | causal masks | construction/use narrative |
| performance | unknown | visibly excessive | appropriate feature budget | quality ladder and measured variants |

## Fake-looking diagnosis

| Symptom | First checks |
| --- | --- |
| plastic | roughness hierarchy, dielectric specular, micro-normal, IBL |
| flat metal | conductor classification, reflected structure, edge curvature, anisotropy |
| fake glass | thickness, absorption, IOR, background context, sorting |
| waxy everything | excess subsurface/transmission or soft broad lighting |
| glittering | high-frequency normals/roughness without filtering |
| muddy | base color too dark, AO baked twice, overstrong cavity masks |

## Automatic failures

- color/data textures use incorrect color-space annotations;
- nonmetal coating represented as fully metallic;
- no environment or reflection structure for reflective materials;
- procedural masks have no object scale;
- full custom shader discards required shadows/IBL without intent.

## QA

- inspect neutral sphere and production mesh;
- rotate light/environment;
- inspect grazing angles;
- test clean and aged states;
- test low and high quality;
- record texture sizes, material features, shader variants, and draw impact.
