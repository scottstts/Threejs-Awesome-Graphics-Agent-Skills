# Playtest and release

## Playtest scenarios

- first-time load on cold cache;
- normal success path;
- deliberate failure and retry;
- pause/background/resume;
- resize and orientation change;
- rapid repeated input;
- low frame rate or throttled device;
- offline or asset failure;
- repeated restart or route mount;
- reduced-motion and keyboard-only use.

## Observe

- time until the user understands what to do;
- control errors and camera loss;
- missed feedback;
- unreadable targets;
- pacing dead zones;
- restart friction;
- performance spikes tied to specific events;
- confusion between visual decoration and interaction.

## Evidence

Capture:

- build/typecheck results;
- console and page errors;
- representative desktop and mobile states;
- frame and renderer metrics;
- main interaction path;
- failure/retry;
- teardown or restart behavior;
- known limitations.

## Prioritization

1. crashes, blank output, corrupt state;
2. blocked interaction or inaccessible controls;
3. severe performance and memory defects;
4. unreadable gameplay or content;
5. inconsistent visual system;
6. polish and optional detail.

Release notes should distinguish verified behavior from assumptions.
