# Lighting, shadows, and environments

## Lighting hierarchy

- Environment: overall reflection and ambient basis.
- Key: dominant direction and focal modeling.
- Fill: controls contrast; often environment or bounce is enough.
- Rim/accent: separation or narrative cue.
- Practical/emissive: visible source tied to world logic.

Add a light only when it has a distinct job.

## Environment lighting

Use a suitable HDR environment for PBR. Match environment brightness and direction to visible background or art direction. Blur or lower resolution when sharp reflections are not visible.

## Shadows

Shadow quality depends more on fit than raw resolution.

- Tighten near/far and orthographic extents.
- Enable casting only on meaningful objects.
- Enable receiving only where visible.
- Avoid PointLight shadows unless six-face cost is justified.
- Use baked, blob, contact, or screen-space shadows for secondary detail.
- Freeze shadow updates when lights and casters are static.

## Exposure workflow

1. Use a neutral reference material.
2. Set environment and key direction.
3. Choose tone mapping.
4. Adjust exposure to protect important highlights.
5. Tune light intensities and material roughness.
6. Recheck darkest readable areas.

Do not continually alternate exposure and arbitrary light intensities without a reference.

## Readability

For gameplay, lighting must reveal:

- traversable surfaces;
- threats and rewards;
- depth discontinuities;
- player silhouette;
- upcoming decisions.

Cinematic contrast that hides necessary information is a design failure.
