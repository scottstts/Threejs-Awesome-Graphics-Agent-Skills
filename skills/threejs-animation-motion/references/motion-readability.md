# Motion readability

## Silhouette and pose

The important action should read from silhouette and major line of action before particles or camera shake. Avoid poses where limbs overlap the torso or action direction is hidden by the camera.

## Timing hierarchy

Important motion needs:

- preparation;
- clear action;
- readable contact;
- follow-through;
- recovery.

Shorten or skip phases for repeated low-value actions. Preserve anticipation for hazards and high-impact moves.

## Movement feels weightless

Inspect:

- acceleration/deceleration too linear or short;
- world motion and animation speed mismatch;
- no vertical compression on landing;
- no foot/contact lock;
- camera tracks transform rigidly;
- no environment reaction;
- weak audio transient;
- no follow-through in secondary parts.

Fix the causal chain, not just the animation clip.

## Camera motion

Apply motion in layers:

- stable framing;
- target damping;
- intentional lead/look-ahead;
- event impulse;
- shake noise with envelope;
- comfort clamp.

Use rotational shake sparingly. Translational camera noise, FOV kick, and target response can communicate force with less nausea.

## UI motion

UI movement should communicate state:

- appear: where it came from and why;
- update: what changed;
- warning: urgency and direction;
- dismiss: whether it completed or was cancelled.

Use short, interruptible transitions. Respect reduced-motion settings and never delay interaction until decorative animation finishes.

## Interruption

Design for:

- action cancellation;
- rapid state reversal;
- teleport/reset;
- pause/resume;
- frame spike;
- death/failure;
- asset unload.

Springs and mixers must reset or preserve velocity intentionally.

## QA

- view without VFX/audio;
- view at gameplay camera and speed;
- test 30/120 Hz;
- test abrupt input reversal;
- test repeated interrupt/restart;
- inspect contact frames and motion trails.
