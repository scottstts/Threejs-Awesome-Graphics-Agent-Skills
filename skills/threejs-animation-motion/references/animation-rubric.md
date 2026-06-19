# Animation rubric

| Dimension | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| state coherence | broken | clip switching | explicit transitions | layered intent/contact graph |
| pose continuity | pops | broad fades | action-specific blending | phase-aware/inertialized |
| weight | floaty | clip-dependent | coordinated timing/contact | responsive multi-system evidence |
| contact | sliding/intersecting | approximate | planted and aligned | terrain/pelvis/toe aware |
| procedural response | none | fixed offsets | damped/spring layers | constrained expressive motion |
| IK | broken | reaches target | stable pole/reach | contact-aware and blended |
| readability | unclear | visible | anticipation/action/recovery | camera- and gameplay-aware hierarchy |
| performance/lifecycle | leaks/recreates | functional | cached actions and bounded updates | scalable LOD/update policy |

## Automatic failures

- action creation in frame loop;
- two systems author the same root transform;
- unreachable IK causes NaNs or flips;
- foot sliding contradicts movement;
- camera/UI animation ignores reduced motion;
- pause/restart leaves active mixer or spring state unexpectedly;
- fixed-factor lerp changes behavior by refresh rate.

## QA checklist

- inspect action weights and time scales;
- test transitions in both directions;
- test interruption at start/middle/end;
- test locomotion at multiple speeds;
- test uneven terrain;
- test large delta and pause/resume;
- verify teardown and clip/root uncaching.
