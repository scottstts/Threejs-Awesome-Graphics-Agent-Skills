# Depth-based effects

## Required data

Depth of field, AO, SSR, fog, outlines, and motion reconstruction may require depth, normals, velocity, camera matrices, and previous-frame data. Verify the pipeline actually produces them.

## Depth of field

- Focus the subject or interaction plane.
- Keep blur radius modest for real-time navigation.
- Avoid blurring HUD and interaction affordances.
- Handle transparent objects and particles explicitly.
- Reduce or disable during fast camera movement when readability suffers.

## Ambient occlusion

AO should reinforce contact and local depth, not dirty every surface. Tune radius to world scale. Large radius produces haloing; excessive intensity flattens lighting.

## Screen-space reflections

Expect missing offscreen data, edge fading, roughness limits, temporal instability, and transparent-surface complications. Provide environment fallback.

## Motion blur

Use velocity-aware blur when available. Camera-only blur cannot represent independently moving objects correctly. Cap blur under teleports, pause/resume, and large frame gaps.

## Outlines

Prefer outlines that communicate selection, state, or style. Control hidden-edge behavior and thickness across resolution. Avoid outlining every mesh edge in dense scenes without hierarchy.
