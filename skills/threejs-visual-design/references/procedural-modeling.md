# Procedural modeling

## Author forms, not primitive names

A procedural prop should express construction:

- primary body and load-bearing structure;
- seams, panels, joints, trim, fasteners, or growth logic;
- bevels or curvature that catch light;
- contact points and attachment logic;
- controlled asymmetry and wear;
- a readable silhouette at intended distance.

## Reusable kit design

Build parameterized families:

- profile and proportions;
- segment count and curvature;
- attachment sockets;
- material role indices;
- damage/wear seed;
- LOD level;
- collision proxy.

Reuse geometry and materials through instancing or batching when variation permits.

## Variation

Use seeded variation for reproducibility. Vary a few meaningful dimensions rather than every property:

- height, width, taper;
- rotation and spacing;
- one material accent;
- attachment presence;
- wear amount;
- animation phase.

Keep silhouettes and interaction classes distinct.

## Detail budget

Prefer geometry for silhouette and major shading changes. Prefer normal maps, decals, vertex colors, or shaders for fine surface detail. Avoid subpixel geometry.

## Quality gate

- reads without bloom or fog;
- has nonuniform silhouette;
- shows plausible construction;
- shares a coherent family language;
- avoids visible intersections and paper-thin surfaces;
- has an efficient collider and LOD/instancing strategy.
