# Camera lens and framing

## Perspective choices

Three.js `PerspectiveCamera.fov` is vertical field of view. FOV, aspect ratio, camera distance, and subject size jointly determine perspective.

- Wider lens/FOV near subject: exaggerated depth, speed, spatial energy, edge distortion.
- Longer lens/FOV farther away: compressed depth, graphic layering, calmer motion, harder occlusion.
- Orthographic: diagrammatic, isometric, UI-like, or deliberately flattened.

Do not change FOV merely to fit the subject; consider camera distance and composition.

## Camera height

Camera height changes power and scale:

- low: monumentality, speed, foreground dominance;
- eye-level: familiarity and spatial legibility;
- high: overview, tactical clarity, reduced intimacy.

Use familiar scale anchors and horizon placement intentionally.

## Framing

Control:

- subject size and headroom;
- lead room in motion/look direction;
- foreground occlusion;
- overlapping silhouettes;
- tangent collisions;
- depth layers;
- safe zones for HUD and touch controls.

Centering is appropriate for symmetry, confrontation, inspection, and UI stability. Off-center composition is useful for movement, tension, and environmental context.

## Interactive cameras

The camera must not require unnecessary manipulation merely to play. Established real-time camera principles include:

- keep the player/critical target visible;
- prevent near-plane/environment penetration;
- minimize unnecessary movement;
- smooth motion without allowing the target to escape;
- limit automatic reorientation speed;
- avoid roll except when justified;
- design levels with camera constraints from the start.

## Motion

Layer:

1. base framing;
2. follow target;
3. collision/occlusion correction;
4. input orbit/look;
5. contextual offset;
6. impact/shake;
7. final comfort clamp.

Each layer needs ownership and decay. Avoid multiple systems writing camera transform directly.

## Source basis

- Mark Haigh-Hutchinson, [Fundamentals of Real-Time Camera Design](https://media.gdcvault.com/gdc05/slides/GD_Haigh-Hutchinson_FundamentalsReal-TimeCameraDesign2.pdf).
