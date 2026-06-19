# Camera, spatial readability, and collision fairness

## Camera supports the verb

The camera must show:

- current player state;
- next relevant decision;
- incoming threat;
- target or destination;
- available recovery space.

A beautiful camera that hides the landing point or attacker is wrong.

## Third-person structure

Use:

- target/look anchor;
- desired boom position;
- collision sweep/raycast;
- occlusion handling;
- smoothed final camera;
- contextual offsets;
- user orbit with limits;
- emergency reset.

Camera collision should use a radius/sphere-like volume rather than a single center ray when walls and corners matter.

## Spatial metrics

Derive level dimensions from movement:

- jump distance and apex;
- stopping distance;
- dodge range;
- turn radius;
- camera distance/FOV;
- reaction time at target speed;
- player/collider radius.

Build traversal kits in multiples of these metrics.

## Fair collision

Fairness requires:

- collider matches perceived shape;
- anticipation precedes danger;
- contact moment is legible;
- damage direction is clear;
- recovery or invulnerability is communicated;
- edge cases do not contradict visual expectation.

For fast motion, use swept tests/CCD or larger telegraph space.

## Telegraphing

Encode danger using multiple channels:

- wind-up pose/motion;
- shape expansion;
- value/color;
- sound;
- ground decal/area preview;
- camera framing;
- timing rhythm.

Do not use color alone.

## Occlusion

Possible strategies:

- camera reposition;
- shorten boom;
- fade/dither occluder;
- hide selected geometry;
- outline player;
- level-design exclusion.

Choose the least disruptive strategy and avoid rapid toggling.

## Source basis

- [Fundamentals of Real-Time Camera Design](https://media.gdcvault.com/gdc05/slides/GD_Haigh-Hutchinson_FundamentalsReal-TimeCameraDesign2.pdf)
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/)
