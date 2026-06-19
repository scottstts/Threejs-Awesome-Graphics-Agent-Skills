# Game feel, controls, and feedback

## Input-to-response chain

Measure:

- input sampling and buffering;
- dead zone and sensitivity curve;
- acceleration/deceleration;
- state transitions;
- visual motion;
- camera response;
- audio/haptic/VFX;
- consequence and recovery.

Responsiveness is not maximum speed. It is a clear and predictable relation between intent and result.

## Control knobs

Movement:

- max speed;
- time/distance to max speed;
- braking time/distance;
- air control;
- turn radius/rate;
- traction/friction;
- jump height/time-to-apex;
- coyote time;
- jump buffer;
- terminal velocity.

Aim/look:

- dead zone;
- response curve;
- sensitivity;
- acceleration;
- smoothing;
- target friction/assist;
- camera offset and FOV.

## Weight

Weight emerges from coordinated evidence:

- acceleration and stopping distance;
- animation anticipation and follow-through;
- vertical arc and landing compression;
- camera lag and impact;
- contact shadow and ground response;
- sound transient and low-frequency body;
- dust/debris/environment reaction.

Do not use only camera shake.

## Feedback hierarchy

Prioritize:

1. player action acknowledgement;
2. collision/hit result;
3. success/failure;
4. state/resource change;
5. decorative ambience.

Use the largest flash, pause, shake, and sound only for high-value events.

## Timing

- anticipation: warns and prepares;
- contact: exact event instant;
- hit pause: short emphasis, not latency;
- expansion: communicates force/direction;
- decay: restores control and visual clarity;
- residue: preserves consequence.

## Diagnosis

| Symptom | Inspect |
| --- | --- |
| sluggish | input latency, excessive smoothing, slow acceleration |
| twitchy | dead zone, sensitivity, no acceleration curve |
| floaty | vertical timing, ground contact, camera and animation response |
| weak hit | contact synchronization, audio transient, pause, target reaction |
| exhausting | constant high-intensity feedback, no hierarchy |

## Playtest

Tune one axis at a time. Record values and ask whether the verb supports precision, expression, and recovery.
