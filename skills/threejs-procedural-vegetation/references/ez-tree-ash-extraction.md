# `ez-tree` Ash Medium extraction

Use this reference when the target is a natural deciduous tree close to the reviewed `ez-tree` result. It records the mechanism contracts that must survive adaptation. It is not a generic tree recipe.

Reviewed source:

```text
repository: https://github.com/dgreenheck/ez-tree
revision: 48dc193515135cff2b33515c47f0a8703b977e63
generator: src/lib/tree.js
options: src/lib/options.js
preset: src/lib/presets/ash_medium.json
composition: src/app/scene.js, environment.js, main.js, textures.js
meadow: src/app/noise.js, grass.js, ground.js, rocks.js
sky: src/app/skybox.js, shaders/skybox.vert, shaders/skybox.frag
```

## 1. Preserve the exact species table before tuning

The reviewed Ash Medium preset is:

| Level | Length | Base radius factor | Sections | Radial segments | Child angle | Children | Child start | Gnarliness | Twist |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 trunk | 43.47 | 2.00 | 12 | 12 | — | 7 | — | 0.03 | 0.09 |
| 1 primary | 27.14 | 0.63 | 8 | 6 | 48° | 4 | 0.23 | 0.25 | -0.07 |
| 2 secondary | 9.51 | 0.76 | 6 | 4 | 75° | 3 | 0.33 | 0.20 | 0 |
| 3 terminal | 4.60 | 0.70 | 4 | 3 | 60° | 0 | 0 | 0.09 | 0 |

All levels use taper `0.7`. Growth force points up with strength `0.01`.

Leaves:

```text
type: ash
count per terminal branch: 16
start: 0
angle: 55°
double perpendicular cards
size: 2.67
size variance: ±0.72
alpha test: 0.5
rounded normals: enabled
```

Do not replace this table with guessed “tree-like” ranges before parity is established. Species identity is encoded in the uneven angles, lengths, starts, and child counts.

## 2. Match the branch continuation model

The generator creates two types of descendants:

1. stratified lateral children along the parent;
2. one terminal continuation branch from the parent tip for every deciduous level until the final level.

That continuation is essential to the sparse, irregular crown. A generator that creates only lateral children produces a candelabra or clipped crown.

The terminal continuation inherits:

```text
origin = final parent section origin
orientation = final parent section orientation
radius = final parent section radius
level = parent level + 1
sections and radial segments = parent values
length = next-level species length
```

The inherited section/segment counts differ from ordinary lateral children, which use the next level's table values.

## 3. Match section evolution

The source contains:

```text
sectionLength =
  branchLength
  / sectionCount
  / (branchLevels - 1)
```

but guards the divisor with a comparison against the string `'Deciduous'`.
The preset stores `'deciduous'`, so the reviewed build does **not** take that
branch. Effective runtime behavior is:

```text
sectionLength = branchLength / sectionCount
```

For Ash Medium this doubles the height relative to the apparent intent. The
reviewed build produces branch bounds reaching roughly `y=80.30` and leaf
bounds reaching `y=83.69`. Preserve observed runtime behavior for parity.
Do not infer behavior from a line without executing the reviewed revision.

At every section:

1. emit an XZ ring through the current Euler orientation;
2. store origin, orientation, and radius;
3. advance along rotated local +Y;
4. perturb Euler X/Z by seeded gnarliness;
5. apply level twist around local Y;
6. rotate the section toward world growth force.

Gnarliness amplification:

```text
effectiveGnarliness =
  max(1, 1 / sqrt(sectionRadius))
  * levelGnarliness
```

The force angular step is:

```text
forceStrength / sectionRadius
```

clamped to the full angle between current local up and the target direction. Thin branches therefore respond more strongly than the trunk.

## 4. Match taper and child radius semantics

Deciduous taper:

```text
sectionRadius =
  branchStartRadius
  * (1 - levelTaper * sectionIndex / sectionCount)
```

The final section of the final level collapses to a near-zero radius.

Lateral child radius is not simply the species radius:

```text
childRadius =
  levelRadiusFactor
  * interpolatedParentSectionRadius
```

This couples the child thickness to emergence height and parent taper.

## 5. Match stratification and interpolation

For both lateral children and leaves:

```text
along =
  start
  + (slotIndex + seededJitter)
  * ((1 - start) / count)
```

Independently shuffle angular slot IDs with the same seeded RNG:

```text
azimuth =
  2π
  * (radialOffset + (permutedSlot + jitter[-0.5, 0.5]) / count)
```

Interpolate between adjacent stored sections:

- origin: linear interpolation;
- radius: linear interpolation;
- orientation: the reviewed code starts from section B and slerps toward
  section A by `alpha`, reversing the usual A→B expectation.

Then compose:

```text
parent orientation
  × azimuth around local Y
  × emergence angle around local X
```

Do not derive child orientation from a newly constructed tangent frame; that changes the characteristic branch roll and twist.

## 6. Match ring and bark UV construction

Each section emits `radialSegments + 1` vertices by duplicating the first radial vertex at the seam.

The reviewed implementation chooses one integer circumference wrap count for the entire branch:

```text
wrapsX = max(1, round(branchStartRadius * barkTextureScaleX))
u = radialIndex / radialSegments * wrapsX
v = sectionIndex is even ? 0 : 1
```

The texture's runtime Y repeat is `1 / barkTextureScaleY`.

This is not a real-distance longitudinal UV. If adapting the visual exactly, retain the alternating ring V pattern. If improving it, record the change as an intentional divergence and re-evaluate bark scale across trunk and twigs.

## 7. Match leaf placement, card geometry, and normals

Leaves are emitted along every final-level branch, not in synthetic clusters at branch tips.

Each leaf is a square card extending from local base `y=0` to tip `y=L`, with width `W`. The double-card mode emits a second card rotated 90° around local Y.

Rounded vertex normal:

```text
normalize(cardNormal + (vertexPosition - leafOrigin))
```

The reviewed implementation uses the same unrotated card normal for both
perpendicular cards before adding the vertex direction. Preserve that quirk
for parity. A corrected per-card normal is a legitimate extension but changes
canopy lighting and must be documented.

Use the reviewed `ash.png` alpha silhouette. Replacing it with an ellipse or analytic lozenge changes crown porosity and edge frequency enough to invalidate visual comparison.

## 8. Match material and wind behavior accurately

The reviewed app uses:

- textured `MeshPhongMaterial` for bark;
- double-sided alpha-tested `MeshPhongMaterial` for leaves;
- Neutral tone mapping with exposure `2`;
- PCF shadows;
- fog color `0x94b9f8`, density `0.0015`;
- a daylight sky gradient and directional sun.

The reviewed wind shader deforms leaf vertices only:

```text
windPhase = simplex3(position / 70)
wind =
  0.5 * sin(t * 0.5 + phase)
  + 0.3 * sin(2t * 0.5 + 1.3phase)
  + 0.2 * sin(5t * 0.5 + 1.5phase)
displacement = leafUvY * windStrength * wind
```

`leafUvY` roots the card base and moves the tip. The reviewed branch geometry is static. Do not describe this specific source as hierarchy-weighted trunk/branch wind.

If extending it with branch motion:

1. keep the leaf-root weighting;
2. add branch-level attributes separately;
3. deform color and shadow geometry consistently;
4. label the result as an extension, not source parity.

## 9. Match composition before judging the generator

The reviewed app presents the tree in a complete environment:

```text
startup camera: (100, 20, 0)
target: (0, 25, 0)
horizontal camera constraint near the horizon
foreground tree at origin
100 background trees using radius = 175 + random * 500 (effective 175–675)
procedural grass/dirt ground
5,000 visible grass instances
flowers and rocks
blue atmospheric fog
daylight sky and sun
```

The exact startup camera clips the reviewed leaf bound slightly because its
upper vertical coverage is approximately `y=82.7` while the leaf maximum is
approximately `y=83.69`. The README hero was captured after interaction and
retains crown margin. For a fixed 3:2 evaluation frame, move the camera along
the same target ray to approximately `x=115`; do not alter the tree to solve a
framing problem.

A black-background isolated tree is not a parity test for the project. It removes foliage edge contrast, atmospheric depth, ground contact, and scale cues.

## 10. Required parity diagnostics

Capture:

```text
final composition
branch-level colors
lateral children versus terminal continuations
child longitudinal slot IDs
child angular slot IDs
leaf origins along final branches
card normals versus rounded normals
bark UV checker
wind displacement magnitude
foreground bounds and camera frustum
```

Report:

```text
branch jobs by level
terminal continuations by level
lateral children by level
leaf cards
vertices and triangles
seed
preset name
intentional divergences from reviewed source
```

## 11. Numeric parity gate

For Ash Medium at the reviewed revision, assert:

```text
branch vertices: 6,639
branch triangles: 9,120
leaf vertices: 21,760
leaf triangles: 10,880
branch bounds max Y: approximately 80.2981
leaf bounds max Y: approximately 83.6902
```

Matching only counts is insufficient; the earlier half-height implementation
matched all counts while violating runtime section-length behavior.
