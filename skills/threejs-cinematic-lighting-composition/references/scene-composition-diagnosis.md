# Scene composition diagnosis

## Dependency order

Fix:

1. camera and framing;
2. large masses and silhouette;
3. value/depth hierarchy;
4. material hierarchy;
5. lighting direction;
6. atmosphere;
7. post-processing.

Effects cannot repair an unreadable frame.

## Taste-to-implementation table

| Problem | Likely causes | Technical fixes |
| --- | --- | --- |
| scene feels flat | frontal camera, no overlap, ambient-heavy light, similar roughness/value | move camera off-axis; add foreground occlusion; establish key direction; reduce fill; separate material values |
| scene lacks scale | no familiar reference, weak perspective/parallax, uniform detail | lower camera; add human-scale elements; repeat smaller details; strengthen depth haze; vary detail density |
| scene looks cheap | primitive silhouettes, paper-thin edges, default materials/lights | author profiles/bevels; add thickness/joints; build material roles; replace equal lights with motivated hierarchy |
| scene looks generic | no visual premise or motif | define shape/material/camera sentence; repeat a distinctive motif; remove unrelated decorative language |
| visually noisy | equal contrast everywhere, random emissive/particles/detail | reserve contrast/saturation; reduce background frequency; cluster detail; simplify light count |
| material looks plastic | uniform roughness and weak reflected structure | load material-lookdev; calibrate roughness, micro-normal, environment, and substrate |
| lighting feels random | lights lack visible/motivated sources | choose one key; assign every other light a fill, rim, practical, or gameplay role |
| camera feels debug-like | default FOV/height, centered subject, no foreground | choose lens and subject distance; lower/raise viewpoint intentionally; frame with layers; control headroom |
| post feels overdone | bloom/fog/DOF solve missing hierarchy | disable passes; fix frame and lighting; reintroduce one effect at a time |
| important object unreadable | silhouette overlap, value match, background motion | move camera/object; rim or local contrast; reduce background; reserve accent color |
| no focal point | multiple equal contrast peaks | choose primary/secondary/tertiary hierarchy; move or suppress competing accents |

## Thumbnail and grayscale test

Shrink the frame until detail disappears. The subject, path, threat, or product should still read through large value groups and silhouette. Convert to grayscale to reveal color-dependent hierarchy.

## Before/after reasoning

Do not report “added cinematic lighting.” Report:

```text
Before: equal ambient and frontal key flatten the subject into the background.
Change: move key 60° to camera-left, lower fill, add dark foreground frame,
and lift the subject rim one value group above the background.
Expected result: stronger form, depth, and focal separation without more lights.
```
