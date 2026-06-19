# Fixed stepping and colliders

## Fixed-step loop

```js
const step = 1 / 60;
const maxFrame = 0.1;
const maxSubsteps = 5;
let accumulator = 0;

function update(frameDelta) {
  accumulator += Math.min(frameDelta, maxFrame);
  let substeps = 0;

  while (accumulator >= step && substeps < maxSubsteps) {
    simulate(step);
    accumulator -= step;
    substeps += 1;
  }

  const alpha = accumulator / step;
  interpolateVisuals(alpha);
}
```

If the simulation falls behind, prefer controlled degradation over unbounded catch-up.

## Collider hierarchy

Prefer:

1. sphere;
2. box;
3. capsule;
4. compound primitives;
5. convex hull;
6. simplified static triangle mesh.

Avoid dynamic concave meshes. Visual detail rarely belongs in collision.

## Body roles

- Dynamic: simulation controls transform.
- Fixed/static: immovable world.
- Kinematic position/velocity: authored motion that participates in collision.
- Sensor: reports overlap without physical response.

## Tuning

Set friction, restitution, damping, mass/density, gravity scale, locked axes, sleeping, and collision groups intentionally. Default combinations rarely produce polished game feel.

## Verification

- collider debug view aligns with visuals;
- fast objects do not tunnel;
- sensors emit expected events;
- moving platforms carry or affect bodies correctly;
- restart removes every body and joint;
- low-FPS spikes do not explode the simulation;
- transform sync has one owner.
