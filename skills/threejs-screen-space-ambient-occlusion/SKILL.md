---
name: threejs-screen-space-ambient-occlusion
description: Implement and tune screen-space ambient occlusion in Three.js. Use for GTAO-style horizon sampling, bent normals, depth and normal reconstruction, thickness control, temporal denoising, bilateral upsampling, indirect-light application, contact grounding, and diagnosing halos or view-dependent darkening.
---

# Screen-Space Ambient Occlusion

AO estimates missing ambient visibility. It must modulate indirect lighting, not repaint all scene color with a dark multiply.

## Workflow

1. Verify linear depth and view-space normals.
2. Reconstruct view position consistently.
3. Sample horizon visibility in a controlled radius.
4. Estimate AO and optional bent normal.
5. Denoise with depth/normal-aware filters.
6. Reproject only when motion/history validity exists.
7. Apply to indirect diffuse and environment response.

Read [references/gtao-bent-normal-pipeline.md](references/gtao-bent-normal-pipeline.md).

## Failure conditions

- direct light and emission are darkened;
- radius is specified only in pixels;
- foreground silhouettes cast thick screen-space halos;
- depth discontinuities are blurred together;
- AO remains strong at distances where its world radius is subpixel;
- bent normals are treated as ordinary geometric normals;
- temporal history survives disocclusion.
