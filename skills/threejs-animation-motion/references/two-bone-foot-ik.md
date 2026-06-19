# Two-bone and terrain-adaptive foot IK

## Two-bone problem

Given root/shoulder `P0`, joint/elbow `P1`, end/hand `P2`, target `T`, and pole direction:

1. compute upper and lower bone lengths;
2. clamp target distance to reachable range;
3. construct a stable plane from target direction and pole;
4. use the law of cosines for the bend angle;
5. solve the joint position in that plane;
6. rotate root and joint from original directions to solved directions;
7. preserve twist/orientation policy.

Clamp slightly inside full extension to avoid an undefined bend plane.

## Pole vector

The pole controls knee/elbow direction. Project it perpendicular to root-to-target. If nearly parallel, use previous-frame plane or a character-space fallback. Smooth pole changes to prevent flips.

## Transform spaces

Perform all points and rotations in one space:

- model/component space is often easiest;
- convert world target into model space;
- solve;
- convert results back to local bone transforms.

Mixing local and world transforms is a common failure.

## Foot placement

For each foot:

1. predict desired foot position from animation;
2. raycast or shapecast ground;
3. reject invalid slope/height/step;
4. set position target and surface-normal orientation;
5. solve leg IK;
6. offset pelvis/root to keep both legs reachable;
7. lock planted foot during stance;
8. release during swing.

Use BVH-accelerated ground queries for complex static terrain when ordinary raycasting is expensive.

## Contact quality

Foot IK alone does not remove sliding. Coordinate:

- gait phase;
- root velocity;
- planted-foot lock;
- pelvis compensation;
- toe/heel roll;
- ground normal;
- animation speed.

## Quality ladder

- Cheap: ground ray and vertical foot offset.
- Standard: two-bone solve, normal alignment, pelvis offset, stance lock.
- High-end: predictive stepping, toe roll, obstacle adaptation, multi-contact.

## Source basis

- [Analytical Two-Bone IK](https://blog.littlepolygon.com/posts/twobone/) for law-of-cosines solving, basis construction, quaternion swing, and reach edge cases.
- [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) for accelerated terrain queries.
