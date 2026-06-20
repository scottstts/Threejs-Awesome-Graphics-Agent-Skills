# Branch growth system

## Data model

```ts
type BranchLevel = {
  length: number
  radius: number
  taper: number
  sections: number
  radialSegments: number
  childCount: number
  childStart: number
  childAngle: number
  twist: number
  curvature: number
}

type BranchJob = {
  origin: THREE.Vector3
  orientation: THREE.Quaternion
  level: number
  length: number
  radius: number
}
```

Keep species identity in the level table. Keep seed variation in narrow multipliers around it.

## Oriented ring generation

For each branch section:

1. Emit a ring in local XZ.
2. Rotate it by the current section quaternion.
3. Translate to the section origin.
4. Duplicate the first ring vertex at the UV seam.
5. Store section origin, orientation, and radius for child placement.
6. Advance along the rotated local-up direction.

Use a fixed integer circumference wrap count per branch:

```js
const wraps = Math.max(1, Math.round(startRadius * barkTexelsPerMeter))
const u = radialIndex / radialSegments * wraps
const v = cumulativeLength * barkRepeatsPerMeter
```

This prevents bark features from shrinking on the trunk and enlarging on twigs.

## Curvature and tropism

After stochastic curvature, rotate the growth direction toward a target vector:

```js
const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q)
const axis = new THREE.Vector3().crossVectors(up, target).normalize()
const fullAngle = Math.acos(THREE.MathUtils.clamp(up.dot(target), -1, 1))
const step = Math.min(fullAngle, forceStrength / Math.max(radius, 1e-3))
q.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, step))
```

Scaling force by inverse radius lets thin branches respond more than the trunk.

## Child distribution without spirals

For `count` children:

```js
const longitudinalSlots = [...Array(count).keys()]
const angularSlots = seededShuffle([...longitudinalSlots])

for (let i = 0; i < count; i++) {
  const along = start + (i + rng()) / count * (1 - start)
  const angularJitter = rng() - 0.5
  const azimuth = TAU * (offset + (angularSlots[i] + angularJitter) / count)
}
```

The independent permutation matters. Correlating branch height and azimuth creates a visible helix and can put the longest branches on one side.

## Leaf cards

Use crossed cards for sparse foliage or camera-facing clusters for dense distant foliage. For crossed cards, compute rounded normals:

```js
const cardNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(orientation)
const vertexNormal = cardNormal
  .clone()
  .add(vertex.clone().sub(clusterCenter).normalize())
  .normalize()
```

This preserves canopy lighting while retaining cheap alpha cards.

## Wind scope

Do not assume every tree needs the same deformation model.

For leaf-card wind:

```text
leafWeight = leafUvY
```

This roots the leaf base and moves the tip.

For explicit branch hierarchy wind, store:

```text
branchWeight = levelWeight * normalizedDistanceFromBranchBase
```

Combine:

- low-frequency directional bend;
- medium-frequency branch sway;
- high-frequency leaf flutter;
- world-position phase offset so the whole forest does not move in sync.

Displace matching depth/shadow materials. Otherwise shadows remain rigid.

Do not attribute branch hierarchy motion to a reference implementation that only deforms leaves.

## Level budget

Use decreasing radial segments and sections:

```text
trunk: 10–16 sides
primary: 6–10
secondary: 4–6
twigs: 3–4 or cards
```

Stop recursion by both level and radius. For forests, generate a small species/age library and instance complete trees rather than regenerating every tree uniquely.

## Debug views

Expose:

```text
branch level and parent ID
growth direction and transported frame
radius/taper along each branch
tropism and stochastic-curvature contribution
child longitudinal and angular slots
leaf-card plane normal versus canopy normal
wind weight and phase by hierarchy level
triangle, branch, leaf, and species-instance counts
```

Freeze wind and seed independently. A seed sweep should preserve species silhouette and branching behavior while varying individual structure.
