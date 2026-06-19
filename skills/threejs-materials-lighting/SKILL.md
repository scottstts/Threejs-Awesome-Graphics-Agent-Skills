---
name: threejs-materials-lighting
description: "Establish and diagnose scene-wide Three.js PBR, material roles, texture color spaces, environment lighting, shadows, exposure, and tone mapping. Use for a coherent scene foundation or broad lighting correction; use threejs-material-lookdev to match one specific reference surface or layered material."
---

# Three.js Materials and Lighting

Treat materials, environment, direct light, exposure, and tone mapping as one system.

## Workflow

1. Confirm color-space correctness before changing light intensity.
2. Define material roles such as painted metal, bare metal, rubber, glass, emissive, fabric, skin, or stylized matte.
3. Establish an environment or ambient basis for PBR response.
4. Add the minimum direct lights needed for shape, focus, and narrative.
5. Tune roughness and normal response before adding more lights.
6. Fit shadows tightly and enable them selectively.
7. Tune exposure and tone mapping against representative bright and dark surfaces.
8. Validate from every important camera and on lower-quality targets.

## Material rules

- Metalness is usually categorical: a surface is metal or it is not. Dirt, paint, and oxidation change that classification locally.
- Roughness creates most of the readable surface character. Avoid one roughness value across the world.
- Emissive materials do not automatically illuminate nearby geometry.
- Transmission, clearcoat, iridescence, dispersion, and layered physical features cost more; use them where visible.
- Normal maps require valid tangents or an appropriate derivative path and should not carry color-space tags.
- Use shared material families and controlled variations to preserve cohesion.

Read [references/pbr-material-language.md](references/pbr-material-language.md) and [references/lighting-shadows-environments.md](references/lighting-shadows-environments.md).
