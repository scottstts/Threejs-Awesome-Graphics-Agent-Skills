# Camera and controls

## Camera jobs

The camera must:

- show the next decision;
- preserve player orientation;
- communicate speed and impact;
- avoid collision and occlusion;
- maintain comfort and target readability.

## Follow camera

Separate:

- target position;
- look target;
- desired camera position;
- collision-adjusted position;
- final smoothed transform.

Use frame-rate-independent damping. Add look-ahead from velocity or intent, not arbitrary world axes.

## Orbit/product controls

Set:

- polar and azimuth limits;
- distance limits;
- target and framing;
- damping;
- input mappings;
- auto-rotate pause behavior;
- touch gestures;
- reset view.

Prevent controls from fighting object manipulation.

## First-person and pointer lock

Provide an explicit entry action, clear exit behavior, focus recovery, sensitivity, pitch limits, and motion-reduction options. Do not trap the user.

## Camera effects

Apply shake, FOV kick, recoil, and hit impulses as layered offsets with decay. Cap intensity and expose reduced-motion behavior. Persistent noisy camera movement weakens meaningful impacts.

## Tuning sequence

1. Movement acceleration and top speed.
2. Camera distance and height.
3. Follow damping.
4. Look-ahead.
5. FOV.
6. collision/occlusion behavior.
7. impulses and polish.
