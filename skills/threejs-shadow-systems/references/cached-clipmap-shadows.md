# `procedural-bank` cached clipmap shadow extraction

Use this reference for large procedural scenes requiring stable directional
shadows beyond one bounded receiver region.

Reviewed source:

```text
repository: https://github.com/vibe-stack/procedural-bank
revision: 0034e80a61f02b88dbe13a385bdab734a365b82d
primary:
  src/scene/csm/cached-clipmap-shadow-node.ts
projection guard:
  src/scene/csm/bounded-shadow-node.ts
```

## 1. Identify the representation correctly

The reviewed system is a set of concentric square shadow maps centered around
the camera in light space.

It is **not** a virtual shadow map:

```text
no page table
no physical page cache
no page-granular caster submission
one ordinary shadow texture per level
```

Every level consumes a sampled shadow texture in the material stage. Check the
target device's sampled-texture limit before increasing level count.

## 2. Preserve the exact default envelope

Default construction:

```text
first half-width       12 m
scale factor           2.5
maximum distance       2000 m
light margin           100 m
shadow near            1 m
shadow far cap         3000 m
guard band             0.15
cross-fade ratio       0.15
dynamic near levels    2
cached update budget   2 per frame
maximum cache age      64 frames
direction epsilon      0.002 radians
```

Level count:

```text
ceil(log(maxDistance / firstRadius) / log(scaleFactor)) + 1
```

Each half-width is:

```text
min(firstRadius * scaleFactor^level, maxDistance)
```

The last level is forced to `maxDistance` exactly.

Clamp adaptation controls as the source does:

```text
firstRadius >= 1
scaleFactor >= 1.5
guardBand in [0.02, 0.5]
blendRatio in [0.01, 0.9]
dynamicLevels in [0, levelCount]
updateBudget >= 1
maxCacheAge >= 0
```

Per-level map sizes may differ. Missing entries use the directional light's
current shadow-map width.

## 3. Store committed map state

Each level owns:

```ts
type LevelState = {
  halfWidth: number
  centerX: number
  centerY: number
  centerZ: number
  valid: boolean
  forceDirty: boolean
  age: number
}
```

The shader-facing vector stores:

```text
x = committed light-space center X
y = committed light-space center Y
z = sampled half-width = halfWidth * (1 - guardBand)
w = unused
```

Publish the center from the last completed map render. Do not publish the
camera's desired center while a cached level waits for its budget slot.

That distinction prevents the shader containment box from drifting away from
the map content and causing rhythmic boundary flicker.

Before a level renders once, park it at:

```text
center = (1e9, 1e9)
sample half-width = 1e-6
```

An invalid level must never win selection.

## 4. Stabilize X/Y by the actual texel footprint

Per level:

```text
texelWidth =
  (orthographicRight - orthographicLeft)
  / mapWidth

desiredX = round(cameraLightX / texelWidth) * texelWidth
desiredY = round(cameraLightY / texelWidth) * texelWidth
```

This aligns the orthographic projection to a fixed world-space texel grid.

The reviewed implementation quantizes Z more coarsely:

```text
zQuantum = halfWidth * 0.5
desiredZ = round(cameraLightZ / zQuantum) * zQuantum
```

Z changes depth coverage and update cadence but does not define the projected
texel grid, so a coarser quantum is intentional.

Do not snap by a fraction of total level extent. At coarse levels that produces
tens-of-meters jumps.

## 5. Derive the light-space frame once

Each frame:

```text
lightDirection = normalize(light.target.position - light.position)
lightOrientation = lookAt(origin, lightDirection, worldUp)
worldToLight = inverse(lightOrientation)
cameraLight = worldToLight * cameraWorld
```

The direction is considered changed when:

```text
dot(currentDirection, lastCommittedDirection)
  < cos(directionEpsilon)
```

A direction change gives the frame enough budget to refresh all levels.

This gates a continuously moving sun into occasional coherent refreshes. If
the art direction requires per-frame sun motion, reduce levels or accept the
cost rather than allowing mismatched cached directions.

## 6. Use a two-class update policy

A level is dirty when:

```text
it is in the dynamic near set
or it has never rendered
or forceDirty is set
or snapped X/Y/Z changed
or cache age expired
or light direction changed
```

Policy:

```text
dynamic near levels:
  render every frame
  do not consume cached update budget

ordinary cached levels:
  render only while budget remains

explicitly invalidated levels:
  bypass the cached budget
```

The last rule is observed source behavior. Although the method comment calls
invalidation "rate-limited", `forceDirty` currently renders without consuming
or checking the ordinary budget. Preserve this intentionally or change both
behavior and documentation together.

On first update or light-direction change:

```text
budget = levelCount
```

Otherwise:

```text
budget = updateBudget
```

Age increments every frame and resets after render. Initial ages are staggered:

```text
age(level) = floor(-level * maxCacheAge / levelCount)
```

This prevents all coarse levels expiring together.

## 7. Commit camera and map atomically

When a level renders:

1. commit snapped X/Y/Z to `LevelState`;
2. clear `forceDirty`;
3. reset age;
4. place the light at:

```text
(centerX, centerY, centerZ + halfWidth + lightMargin)
```

5. transform that position back from light space;
6. aim the target one light-direction unit away;
7. force light and target matrices current;
8. render the shadow map immediately from that committed transform.

The level's orthographic depth range is:

```text
near = configuredNear
far = max(
  near + 1,
  min(configuredFarCap, lightMargin + 2 * halfWidth)
)
```

Every cloned shadow has:

```text
autoUpdate = false
needsUpdate = false
```

The clipmap owner drives updates manually. Allowing Three.js to update the
clone independently can render from a transform different from the one later
sampled.

## 8. Cross-fade levels without divergent shadow samples

Transform `shadowPositionWorld` to the shared light-space XY plane.

For each level:

```text
distance = max(
  abs(lightX - levelCenterX),
  abs(lightY - levelCenterY)
)

fade =
  1 - smoothstep(
    sampledHalfWidth * (1 - blendRatio),
    sampledHalfWidth,
    distance
  )

weight = fade * remaining
remaining *= 1 - fade
```

Accumulate from finest to coarsest. Leftover weight resolves to unshadowed,
creating a smooth fade outside the outer level.

Critical GPU contract:

```text
sample every level's depth-comparison texture unconditionally
multiply the result by its weight afterward
```

Do not put comparison sampling behind a per-pixel conditional. The source
records view-dependent flicker and undefined derivatives when it did so.

`BoundedShadowNode` still evaluates the filter function, then selects `1`
outside the level's projected XYZ range. This keeps the comparison sample in
uniform control flow while preventing out-of-bounds projection from shadowing.

## 9. Scale normal bias by texel size

Capture the original directional-light bias values before cloning.

Per level:

```text
texelScale = levelTexelWidth / finestTexelWidth
shadow.bias = baseBias
shadow.normalBias = baseNormalBias * texelScale
```

The source keeps depth bias unchanged and scales only world-space normal bias.

Inspect acne and peter-panning separately per level. A single normal bias
across 12 m and 2000 m levels is not coherent.

## 10. Target invalidation spatially

`invalidate()` with no bounds sets `forceDirty` on every level.

With a world-space bounding sphere:

1. transform its center to light space;
2. for each level compute:

```text
reach = halfWidth + sphereRadius
```

3. invalidate when both projected X and Y distances are below `reach`.

Use this for:

- streamed terrain arrival;
- regenerated buildings;
- moving hero casters;
- vegetation chunks whose deformed silhouettes matter.

Observed limitation: the test is a conservative square intersection in XY. It
does not test Z or the exact projected sphere-square distance. This is cheap
and safe but may refresh extra levels.

## 11. Attach and dispose ownership explicitly

The node attaches through:

```text
light.shadow.shadowNode = clipmapNode
```

Detaching removes that property only if it still points to the node.

Disposal must:

- detach from the directional light;
- dispose every level shadow node;
- dispose every cloned shadow;
- remove level lights and targets from their parent;
- invoke base disposal.

Cached shadow maps are persistent GPU resources. Treat missing disposal as a
real leak.

## 12. Adaptation workflow

1. Verify target Three.js WebGPU/TSL shadow-node APIs.
2. Start with two or three equal-resolution levels and no caching.
3. add X/Y texel snapping;
4. add guard-band selection and cross-fade;
5. verify unconditional comparison sampling;
6. separate dynamic and cached level updates;
7. publish committed centers only;
8. add cache-age staggering;
9. add targeted invalidation;
10. tune per-level map sizes and normal bias.

Do not add caching before stable selection and committed-state tracking work.
Caching makes a spatial mismatch persist longer.

## 13. Required diagnostics

Expose:

```text
level count and texture count
rendered half-width and sampled half-width
map size and world texel width per level
desired versus committed X/Y/Z
selected level and cross-fade weights
remaining unshadowed weight
dynamic/cached classification
dirty reason bits
valid/forceDirty/age
budget before and after updates
direction delta versus epsilon
base and scaled normal bias
shadow-map preview per level
invalidation sphere in light space
level render count and GPU time
```

Failure diagnosis:

```text
shadows crawl under slow camera motion:
  X/Y center is not snapped to the level's texel width

level boundaries flicker every other frame:
  desired center was published while the cached map retained its old center

shadows disappear by view angle:
  comparison samplers were evaluated in divergent control flow

coarse moving casters freeze:
  max age and targeted invalidation are both absent

all levels spike together:
  cache ages were not staggered

important streamed geometry remains unshadowed:
  explicit invalidation was incorrectly blocked by the coarse update budget

coarse levels show acne:
  normal bias was not scaled by world texel width

memory grows after scene replacement:
  cloned shadows, level nodes, lights, or targets were not disposed
```
