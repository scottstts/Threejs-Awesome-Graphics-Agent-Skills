---
name: threejs-material-lookdev
description: "Match a specific reference with believable Three.js surface response: calibrated roughness, Fresnel, clearcoat, anisotropy, transmission, volume, microdetail, dirt, wear, and wetness. Use when one material looks plastic or generic; use threejs-materials-lighting for scene-wide PBR, lights, shadows, and exposure."
---

# Three.js Material Lookdev

Hyperrealism is primarily a response-to-light problem, not a texture-resolution problem.

## Workflow

1. Collect references under multiple lighting conditions.
2. Separate material identity from lighting and post-processing.
3. Classify the substrate, coating, contamination, age, and scale.
4. Calibrate base response on a neutral sphere before adding storytelling layers.
5. Build roughness and normal structure at macro, meso, and micro scales.
6. Add masks for wear, dirt, moisture, and contact only where physical history supports them.
7. Validate under neutral IBL, grazing light, broad light, and the production scene.
8. Compare raster output against a higher-quality reference renderer when the look is ambiguous.

## Load focused references

- BRDF intuition and parameter meaning: [pbr-mental-model.md](references/pbr-mental-model.md)
- Turning a photograph into material decisions: [material-reference-analysis.md](references/material-reference-analysis.md)
- Glass, volume, IOR, anisotropy, cloth, and coated surfaces: [glass-volume-anisotropy.md](references/glass-volume-anisotropy.md)
- Dust, wear, wetness, oxidation, and layered masks: [layered-materials.md](references/layered-materials.md)
- Extending built-in PBR instead of replacing it: [extending-standard-materials.md](references/extending-standard-materials.md)
- Lookdev diagnosis and QA: [material-rubric.md](references/material-rubric.md)

Use the runnable [material calibration example](examples/material-calibration/index.html) to compare metalness, roughness, clearcoat, transmission, and anisotropy.

## Guardrails

- Keep metallic mostly categorical; use intermediate values for transitions and mixed pixels.
- Preserve plausible dielectric reflectance and grazing response.
- Do not encode lighting, cavities, or contact shadows destructively into base color when lighting must remain dynamic.
- Prefer `MeshPhysicalMaterial`, TSL node materials, or narrow standard-material extension before implementing a full custom BRDF.
- Check installed Three.js support before relying on newer physical-material features.
