# `procedural-bank` architecture extraction

Use this reference when building a procedural architectural generator whose
output must retain deliberate massing, façade rhythm, construction depth, and
inspectable ownership.

Reviewed source:

```text
repository: https://github.com/vibe-stack/procedural-bank
revision: 0034e80a61f02b88dbe13a385bdab734a365b82d
planning:
  src/grammar/building-grammar.ts
  src/grammar/mass-grammar.ts
  src/grammar/footprint-edge-graph.ts
  src/grammar/facade-grammar.ts
  src/grammar/placement-factory.ts
  src/grammar/podium-grammar.ts
  src/grammar/shaft-grammar.ts
  src/grammar/crown-grammar.ts
  src/grammar/roof-grammar.ts
  src/grammar/generator-assertions.ts
compilation:
  src/kit/building/compile-building.ts
  src/kit/building/mass-caps.ts
  src/kit/shared/module-api.ts
  src/kit/shared/transforms.ts
  src/kit/shared/mesh-writer.ts
contracts:
  src/kit/kit-types.ts
```

## Contents

1. Compilation boundary
2. Mass grammar
3. Compound footprints
4. Placement grammar
5. Module compilation
6. Material-slot writer
7. Structural closure
8. Assertions and limitations
9. Adaptation workflow
10. Diagnostics

## 1. Preserve the compilation boundary

The reviewed system does not generate triangles while deciding the building:

```text
BuildingSettings
  → createMassTiers()
  → createKitPlacements()
  → assertGeneratorInvariants()
  → BuildingPlan
  → appendMassCaps()
  → compile placements through registered module builders
  → one BufferGeometry per material slot
```

The critical intermediate representation is `BuildingPlan`:

```ts
type BuildingPlan = {
  settings: BuildingSettings
  bayWidth: number
  floorHeight: number
  tiers: BuildingTier[]
  placements: KitPlacement[]
  diagnostics: {
    duplicateSurfaceOwners: string[]
    missingModuleIds: KitModuleId[]
    unusedModuleIds: KitModuleId[]
  }
}
```

Keep it serializable. It enables topology rendering, deterministic tests,
module-usage accounting, façade ownership inspection, and module replacement
without changing mass grammar.

## 2. Use dimensional constants as grammar anchors

The reviewed revision fixes:

```text
BAY_WIDTH = 3.2 m
FLOOR_HEIGHT = 3.35 m
PODIUM_FLOOR_HEIGHT = 4.45 m
```

Settings express spans in bays and floors:

```text
fullWidth = widthBays * 3.2
fullDepth = depthBays * 3.2
podiumHeight = podiumFloors * 4.45
```

Seeded randomness perturbs constrained decisions:

```text
towerScale = clamp(
  authoredTowerScale + random(-0.05, 0.04),
  0.62,
  0.96
)

setbackInset =
  3.2
  * (1 - towerScale)
  * random(0.86, 1.08)
```

Randomness adjusts shaft floor splits, setback progression, directional
insets, crown inset, and twin-tower narrowing. It does not choose arbitrary
boxes.

Every upper span retains at least four bays:

```text
clampedSpan(span, inset) = max(4 * BAY_WIDTH, span - 2 * inset)
```

Without that invariant, upper tiers collapse into non-architectural slivers.

### Exact mass patterns

The source supports:

```text
single tower
outer ring / free court
twin towers with optional skybridge
```

`classic-bank` keeps one shaft slice. `corner-hq` usually creates two. The
setback-tower path creates three when floor count permits.

Twin towers derive:

```text
gap = max(2.2 bays, 18% full width)
towerWidth = max(4 bays, 46% of remaining width)
towerDepth = 82% full depth
towerOffset = gap / 2 + towerWidth / 2
```

The optional bridge is a real `BuildingTier`:

```text
y = podiumHeight + clampedBridgeFloor * FLOOR_HEIGHT
height = 1.15 * FLOOR_HEIGHT
depth = max(1.2 bays, 18% full depth)
```

Treat bridges, podiums, shafts, and crowns as topology so façades and caps use
the same contracts.

## 3. Decompose compound footprints into rectangles

The reviewed footprint grammar uses rectangular pieces:

```text
L:
  front bar depth = 58%
  rear wing width = 44%

T:
  cross bar depth = 36%
  stem width = 46%

U:
  front bar depth = 34%
  each wing width = 26%

courtyard block:
  bar thickness = max(2 bays, 24% of smaller outer span)
```

The free-court path clamps the inner court so every bar retains at least
`1.8 * BAY_WIDTH`, then applies bounded X/Z offsets.

Do not union the pieces before façade planning. The source keeps pieces and
computes exposed intervals per rectangle.

### Exposed-edge subtraction

For each rectangle side:

1. create its full one-dimensional interval;
2. find rectangles touching that side within `0.001`;
3. project touching rectangles into blocker intervals;
4. subtract blockers sequentially;
5. discard segments shorter than `0.25`;
6. emit one `FacadeEdge` per surviving segment.

```ts
type FacadeEdge = {
  id: string
  side: "front" | "back" | "left" | "right"
  center: number
  length: number
  x: number
  z: number
  isOuterCornerStart: boolean
  isOuterCornerEnd: boolean
  isInnerCornerStart: boolean
  isInnerCornerEnd: boolean
}
```

This prevents façades on shared walls between courtyard bars and compound
wings. Use interval subtraction, not center-point tests.

Observed limitation: the reviewed revision marks both endpoints as inner
corners whenever a surviving segment is shorter than the original side. It
does not preserve which endpoint was clipped. Derive endpoint flags from the
subtraction result if corner semantics matter.

## 4. Compile façade roles separately

`createKitPlacements()` dispatches by tier role:

```text
podium → createPodiumPlacements
crown  → createCrownPlacements
shaft/bridge → createShaftPlacements
```

Roof placements attach only to the highest crowns. Without crowns, they attach
to highest shaft or bridge tiers. "Highest" means matching maximum
`y0 + height` within `0.001`, so both twin towers can receive roofs.

### Bay quantization

```text
count = max(minimum, round(edge.length / 3.2))
bayWidth = edge.length / count
bayCenter(i) =
  edge.center - edge.length / 2 + bayWidth * (i + 0.5)
```

The effective bay width adapts to the exact exposed segment. Do not append a
narrow remainder bay.

### Podium

Podium edges use at least five bays on front/back and three on sides.

The first `0.74 m` is a granite plinth unless the fortress archetype replaces
it with a `2.1 m` rusticated block.

Ground-floor selection is semantic:

```text
front:
  center revolving door
  paired lobby doors adjacent to center
  optional corner entrance
  optional colonnade
  otherwise tall lobby windows

back:
  loading dock every third bay
  security doors elsewhere

sides:
  service-bank loading docks
  service doors at edges
  lobby windows elsewhere
```

Projection depth varies by module:

```text
paired column      1.8 m
corner entrance    1.55 m
revolving door     1.5 m
loading dock       1.2 m
ordinary podium    1.1 m
```

That depth hierarchy is part of the visual result. Coplanar façade rectangles
cannot preserve the portico and entrance reading.

Podium trim includes a first-floor belt, top cornice, optional intermediate
cornice, corner cornices, and explicit corner-joint modules.

### Shaft

Shaft edges use at least four bays. The source reserves whole-height zones
before filling ordinary floor bays:

- front central glass shaft and side piers for tower archetypes;
- structural blank/service zones on non-front sides;
- full-height corner piers.

Ordinary bay choice depends on side, floor and bay modulo patterns, shaft
rhythm, and archetype.

```text
terra-cotta arcade:
  floor % 4 == 0 → arcade bay
  else floor % 2 == 0 → arched window
  else → brick window

paired rhythm:
  alternating double-window and 3 m window

Chicago grid:
  every third center bay uses 4 m window
```

High ornament density can rewrite one bay into a lower carved/spandrel module
plus an upper window module. It is not a decal.

The source adds construction rhythm independently of windows:

- floor band, sill, and lintel strips;
- pilaster bundles every two or three bays;
- lower, middle, and upper courses;
- corner-joint modules at trim endpoints.

Keep ownership separate for infill, vertical structure, and horizontal trim.

### Crown and roof

Crown bays combine corner parapets, window/parapet infill, lower and upper
cornices, attic/cartouche panels, optional pediment, and finials.

Finial spacing is authored by named rhythm:

```text
edge sparse      5.2 m
edge dense       2.1 m
skyline spikes   3.4 m
default          3.2 m
```

Roof style selects:

```text
pyramidal metal:
  sloped roof + crest

statue tower:
  sloped roof + lantern + mast

flat/service:
  railings + equipment gated by density thresholds
```

Equipment thresholds are `0.12`, `0.32`, `0.58`, and `0.66`; each adds a
specific equipment group rather than scaling one generic clutter count.

## 5. Compile modules in local frames

Each placement resolves a registered runtime:

```ts
type KitModuleContext = {
  writer: KitMeshWriter
  transform: (point: Vec3) => Vec3
  moduleId: KitModuleId
  width: number
  height: number
  depth: number
  anchors: Record<string, Vec3>
  moduleVariant?: string
}
```

The compiler chooses:

```text
roof placement   → roofTransform(x, y, z)
façade placement → facadeTransform(side, tier dimensions, edge offsets)
```

`facadeTransform()` handles orientation and winding for all four sides.
Module builders author geometry in one local convention.

Do not make each module understand global side placement. That duplicates
orientation logic and creates inconsistent normals.

The registry is asserted before compilation. Missing builders fail rather than
silently producing holes.

## 6. Preserve material-slot ownership

The reviewed slots are:

```text
limestone
granite
terra-cotta
glass
bronze
black-metal
ornament
roof
```

`KitMeshWriter` owns one positions/normals/UVs/colors/indices buffer per slot
and emits one indexed `BufferGeometry` for each nonempty slot.

This separates glass from opaque stone, metals from masonry, and ornament from
base limestone while bounding draw calls by semantic material roles.

### Physical texture scale

For limestone and ornament:

```text
stone tile size = 1.45 m
atlas = 3 columns × 2 rows
padding = 0.004 UV
```

Large quads are bilinearly subdivided at `ceil(length / 1.45)` along each axis.
Each subquad maps no more than one atlas-cell span:

```text
uSpan = min(1, subquadWorldWidth / 1.45)
vSpan = min(1, subquadWorldHeight / 1.45)
```

This prevents one stone sample stretching across a tower wall.

Observed behavior: `chooseStoneAtlasCell()` returns cell `4` for both limestone
and ornament in the reviewed revision. The constants permit multiple cells,
but the current implementation produces coherent stone rather than per-quad
random variation.

## 7. Close the mass independently

Before placement compilation, the source adds:

- soffits under elevated tiers;
- decks on podium/crown/bridge tiers;
- raised deck-edge strips;
- connectors between touching rectangles at equal role, `y0`, and height.

This prevents holes at setbacks and compound-footprint seams.

The reviewed revision skips decks for shaft tiers but still creates their
soffits. Adapt that decision if upper shaft roofs can be visible.

Structural closure belongs to the mass compiler, not window or cornice
modules.

## 8. Preserve exact assertions and limitations

The source fails on:

```text
registered module IDs without builders
duplicate surface ownership keys
```

The ownership key includes side, tier, edge, X/Z offsets, horizontal interval,
vertical interval, and normal offset, rounded to `0.01`.

Important limitation: this catches exact duplicate regions. It does **not**
perform a general rectangle-overlap test. Partially overlapping placements can
survive. Add interval-overlap validation when modules can have independent
widths or arbitrary offsets.

Unused module IDs are reported but do not fail generation.

## 9. Adapt in this order

1. Define bay/floor constants.
2. Produce deterministic mass tiers only.
3. Render topology blocks colored by role.
4. Decompose footprints and inspect exposed-edge intervals.
5. Emit placements without geometry.
6. Validate ownership and missing builders.
7. Compile a minimal plinth/window/corner/trim/roof kit.
8. Add material-slot batching and physical atlas scale.
9. Add reserved zones and ornament rewrites.
10. Add crowns and roof equipment after façade rhythm is stable.

Do not begin with dozens of decorative builders. A weak mass and edge graph
cannot be repaired by ornament.

## 10. Required diagnostics

Expose:

```text
seed and normalized settings
tier role/name/bounds/inset
footprint rectangle IDs
full side and blocker intervals
surviving exposed edges
bay count and effective bay width
reserved whole-height zones
placement IDs and ownership rectangles
module usage counts
missing and unused module IDs
exact duplicate ownership keys
general overlap pairs if added
material slot per triangle
world meters per atlas repeat
triangle count per module and slot
mass caps, soffits, decks, and connectors
```

Failure diagnosis:

```text
façades inside a courtyard:
  blockers were not subtracted from rectangle sides

upper tiers become slivers:
  minimum four-bay span was removed

window rhythm collides with central/service zones:
  reserved vertical zones were filled again

cornices stop at compound corners:
  trim was generated per whole tier instead of per exposed edge

stone scale changes across walls:
  quads were not subdivided at the physical tile scale

holes appear under setbacks:
  mass caps/soffits were delegated to façade modules

missing pieces fail silently:
  registry completeness was not asserted

overlaps survive validation:
  exact duplicate-key detection was mistaken for general overlap testing
```
