# Springs and procedural motion

## Exact damping

Repeated fixed-factor lerp is frame-rate dependent. Use exponential decay:

```js
function damp(current, target, halfLife, dt) {
  const factor = Math.pow(0.5, dt / Math.max(halfLife, 1e-5));
  return target + (current - target) * factor;
}
```

Half-life is interpretable: time required to remove half the error.

For vectors, apply the same scalar factor to interpolation. For rotations, use quaternion slerp with the exact factor.

## Spring parameters

A second-order spring has position and velocity. Expose:

- frequency: how quickly it responds;
- damping ratio: underdamped bounce, critical response, overdamped sluggishness;
- target position and target velocity.

Prefer exact or stable integration rather than naive Euler at variable frame rates.

## Uses

- camera follow;
- weapon/tool recoil;
- UI meters and panels;
- secondary body overlap;
- antennae, tails, suspended props;
- target tracking;
- inertialized animation transitions;
- scale/squash response.

## Motion principles

Anticipation: motion prepares direction/force.  
Overshoot: energy passes the target.  
Follow-through: secondary parts settle later.  
Overlap: components do not start/stop together.  
Spacing: velocity changes communicate weight.  
Arcs: organic and rotational motion rarely travels as straight scalar interpolation.

## Design mapping

| Desired feel | Parameter direction |
| --- | --- |
| heavy | slower frequency, limited overshoot, longer follow-through |
| snappy | higher frequency, near-critical damping |
| elastic | underdamped with controlled overshoot |
| mechanical | strong constraints, short settle, limited secondary overlap |
| organic | layered springs, phase offsets, curved targets |

## Failure diagnosis

- frame-rate variation: fixed lerp/Euler integration;
- endless wobble: damping too low or energy continually injected;
- sluggish control: spring applied before intent or frequency too low;
- camera nausea: overshoot/rotation spring too strong;
- secondary motion detaches: unconstrained displacement.

## Source basis

- [Spring-It-On: The Game Developer's Spring-Roll-Call](https://theorangeduck.com/page/spring-roll-call) for exact dampers, spring dampers, half-life, damping ratio, quaternion springs, controllers, and inertialization.
