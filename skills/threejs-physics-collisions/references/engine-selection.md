# Engine selection

## Custom collision

Use for pickups, lane games, simple projectiles, scripted hazards, rail movement, and low-count overlap checks.

Advantages:

- deterministic authored behavior;
- small bundle and simple debugging;
- no transform synchronization layer.

Risks:

- complexity grows quickly with rotation, stacking, slopes, and many contacts.

## Rapier

Use for robust rigid bodies, sensors, moving platforms, slopes, stacks, balls, fast objects, joints, and many contacts.

Strengths:

- modern WASM implementation;
- strong collider and event model;
- CCD, sleeping, character-controller support;
- good vanilla and R3F ecosystem.

Costs:

- asynchronous initialization;
- WASM delivery;
- separate world ownership and synchronization.

## cannon-es

Use for smaller JavaScript-only rigid-body scenes when simplicity and no WASM are important. Validate required collider and controller behavior before selection.

## Decision questions

- Are contacts physically simulated or rule-based?
- Are stacking and rotation important?
- Are there slopes and moving platforms?
- Can fast objects tunnel?
- How many active bodies and colliders?
- Is deterministic replay required?
- What are bundle and startup constraints?
- Does the project already use a supported wrapper?

Choose from behavior, not popularity.
