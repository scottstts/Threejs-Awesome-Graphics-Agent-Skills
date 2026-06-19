# AnimationMixer, clips, and blending

## Ownership

Create one `AnimationMixer` per independently animated root. Cache actions by semantic state. Update the mixer once per frame with clamped delta.

```js
const mixer = new THREE.AnimationMixer(model);
const actions = new Map(
  clips.map((clip) => [clip.name, mixer.clipAction(clip)]),
);
```

On teardown:

- stop actions;
- remove mixer listeners;
- `uncacheAction`, `uncacheClip`, or `uncacheRoot` as appropriate;
- release the model through its asset owner.

## State, not clip names

Map gameplay intent to animation state:

```text
grounded-idle
grounded-move
air-rise
air-fall
land
attack-start/active/recover
hurt
dead
```

Clips are assets selected by states. This avoids hard-wiring game logic to export naming.

## Crossfade

Before fading to a target:

1. reset or position its time;
2. set effective time scale and weight;
3. play it;
4. crossfade with appropriate duration;
5. disable/stop source after completion if needed.

Use shorter fades for responsive actions and longer fades for locomotion or mood. A universal fade duration creates mush.

## Additive layers

Use additive clips for recoil, breathing, look offsets, hit response, or upper-body actions when the base locomotion must remain. Verify the clip was authored/converted for additive use and mask affected bones when the architecture supports it.

## Root motion

Choose one:

- in-place: gameplay controls root; animation follows speed/phase;
- extracted root motion: animation provides displacement; gameplay validates/corrects;
- hybrid: authored bursts with gameplay-owned long movement.

Never let mixer root motion and gameplay movement independently move the same root.

## Locomotion

Blend from speed and direction, but also manage phase and foot contact. Two clips at equal weight can still slide if their gait phases disagree.

## Failure diagnosis

- pop: pose discontinuity, wrong reset, missing fade;
- frozen action: target not played or weight zero;
- speed mismatch: clip rate not tied to world speed;
- foot sliding: root speed/gait phase mismatch;
- action restarts every frame: transition logic not edge-triggered.

## Source basis

- [Three.js AnimationMixer documentation](https://threejs.org/docs/#api/en/animation/AnimationMixer)
- Current [Three.js animation examples](https://threejs.org/examples/?q=animation)
