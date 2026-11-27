# Geometry craft workflow

Use this reference to replace primitive assembly with a polygon-first modeling
process, explicit part relationships, deliberate edge treatment, and a staged
definition of done. Use metres for the numeric defaults below or scale all
dimensions and audit tolerances together.

## Contents

- Semantic geometry contract
- Polygon-first design model
- Modeling operation selection
- Modifier and emission order
- Smooth shading and the crease rule
- Join and assembly discipline
- Detail, pixel footprint, and geometry budgets
- Supplied model placement and repair
- Visual inspection contract
- Observed limitations and defects
- Diagnostics
- Failure diagnosis

## Semantic geometry contract

Write a contract before vertices. Keep it beside the builder so the same
dimensions drive geometry, placement, interaction, and audit measurements.

```js
const contract = {
  frame: "+X length, +Y back, +Z up; ground at Z = 0",
  unit: "metre",
  bounds: { width: 1.8, depth: 0.52, height: 0.98 },
  parts: {
    frame: { topology: "closed-solid", material: "cast" },
    slat: { topology: "closed-solid", material: "metal" },
  },
  joins: [
    { a: "slat:*", b: "rail:*", relation: "clearance", min: 0.012 },
    { a: "foot:*", b: "ground", relation: "support", gap: 0 },
  ],
  triangleBand: [2500, 10000],
};
```

Record at least:

- authoring frame, world frame, origin, and unit;
- overall bounds and the primary silhouette/profile dimensions;
- whether every part is a closed solid, thick shell, or intentional surface;
- shell thickness, aperture, reveal, and clearance requirements;
- required contacts, supports, intended penetrations, and forbidden overlaps;
- moving-part extrema and swept-volume clearance;
- stable names, material slots, and expected part/triangle bands;
- the views needed to verify silhouette, hidden sides, joins, and interaction.

Do not re-derive a mating dimension in two builders. Compute both parts from
one datum, endpoint, profile, or layout constant.

## Polygon-first design model

Keep quads and n-gons during design. Triangles are a rendering representation,
not the modeling language. Use `MeshData` from
`assets/geometry-quality-kit/procedural-mesh.js` to retain polygon ownership
through transforms and modifiers.

```js
import {
  cleanMesh,
  loft,
  recalcNormals,
  smoothShade,
  toGeometry,
} from "./geometry-quality-kit/procedural-mesh.js";

const part = loft(sectionRings, {
  closeV: true,
  capStart: true,
  capEnd: true,
});
cleanMesh(part);
recalcNormals(part);
smoothShade(part, 34);
const geometry = toGeometry(part);
```

The module authors Z-up and emits Three.js Y-up once. The conversion
`(x, y, z) -> (x, z, y)` has negative determinant, so emission reverses face
winding while converting positions and normals.

Use smooth-by-angle per-corner normals. A corner averages only adjacent faces
whose face normals remain within the part's crease threshold. Do not replace
this with an unrestricted `computeVertexNormals()` pass.

`cleanMesh()` uses an actual Euclidean weld test across neighboring spatial
cells; a quantized cell key alone is insufficient because two vertices within
the weld distance can straddle a cell boundary. `toGeometry()` preserves
per-vertex color attributes and compiles consecutive `faceMat` values into
Three.js geometry groups.

## Modeling operation selection

Choose the operation that owns the visible form:

| Form | Primary operation |
| --- | --- |
| constant section | profile extrusion / `prism*` |
| changing section | `loft` over authored rings |
| axial body, fastener, vessel | `revolve` with welded poles |
| rail, pipe, cable, frame | `tubeAlong`, `sweepPlanarLoop`, or `runMolding` |
| opening through a solid | `panelWithHoles`, `wallRun`, or `aperturedPrism` |
| hollow rim or casing | `hollowPrism` or `annularPrism` |
| rounded manufactured block | `roundedBoxMesh` or provenance-aware `bevel` |
| thin designed skin | profile pairs or `solidify` with explicit thickness |

Treat primitives as acceptable only when the intended form is genuinely a
primitive or the part is hidden structure. A visible housing assembled from a
box, cylinder, and sphere still owes a unified profile, edge hierarchy, and
plausible junctions.

Prefer direct topology for apertures. A frame built from matched outer/inner
rings owns its opening, jambs, end faces, and bevels in one closed shell. Reach
for general boolean machinery only when a direct ring or segmented-wall
construction cannot express the cut reliably.

## Modifier and emission order

Use this order unless the object's construction demands a stated exception:

```text
semantic profiles and rings
→ extrusion / inset / loft / revolve / sweep
→ solidify
→ subdivision where the design needs it
→ bevel or fillet
→ cleanup inside each part
→ winding repair and smooth-angle assignment
→ topology audit
→ triangle emission
```

Modifier order changes the object. Solidifying after beveling creates a
different rim from beveling a thick shell. Cleaning before a deliberate
modifier can remove topology it expects; cleaning after joining unrelated
parts can weld a butt joint into accidental geometry.

Use the metre-scale bevel bands as starting classes, not one universal radius:

```text
hardware / hinges / casings     0.002 m
panel / shelf / slat edges      0.004 m
carcass / plinth / cast stone   0.007 m
frame / apron / machine body    0.013 m
soft upholstered form           0.045 m
```

Common smooth-angle starting points are `40°` for turned parts, `34°` for
moulded sections, `45°` for shells, `38°` for cast forms, `50°` for tight
rolls, and `32°` for broad tops. Inspect the actual highlight before accepting
the value.

## Smooth shading and the crease rule

Default every curved surface to **smooth shading**. Reserve flat facets strictly
for genuinely faceted forms (cut gems, faceted crystal, flat-sided polygonal
towers, dressed ashlar faces, folded sheet metal) and mark those meshes with
`userData.faceted = true` so the faceting audit skips them intentionally.

- **The crease rule:** the smooth-angle threshold must exceed the dihedral angle
  between neighbouring faces on a curved surface (`360° / sides` around a lathe
  or cylinder; per-segment bend along a sweep or loft). An `8`-sided baluster or
  branch meets at `45°`, so a `34°` or `40°` crease splits every longitudinal edge
  flat. Use `smoothAngleForSegments(sides)` from `procedural-mesh.js` to keep low-
  segment curved parts smooth while preserving crisp `90°` caps and steps.
- **Silhouette sagitta:** smooth normals hide facets in shading, never in the
  outline. Choose radial segment count `n` for radius `r` so chord sagitta
  `r * (1 - cos(pi / n))` stays below `~0.5 px` at the closest viewing distance.
- **Shared vertices and `flatShading`:** `BufferGeometry.computeVertexNormals()`
  averages across shared indexed vertices only; calling it on non-indexed
  geometry returns flat face normals. Keep `material.flatShading = false` on
  smooth surfaces, and transform normals with the sign-corrected cofactor normal
  matrix whenever mirroring (`scaleMesh` and `transform4` flip winding
  automatically when `det < 0`).

## Join and assembly discipline

Keep one `MeshData` per semantic part. Do not join separate components before
their relationship audit: cleanup can weld intended butt joints and material
merging can erase the names needed to diagnose an overlap.

Use these readable join floors:

```text
applied detail proud of host    >= 0.0008 m
intentional reveal              0.0015–0.006 m
gap meant to read at 2 m        >= 0.004 m
```

Flush but unrelated faces are forbidden. Choose one of four explicit states:

1. One continuous polygon mesh.
2. Exact contact on shared coordinates (opposite-facing back face on host face,
   safe under single-sided materials) or safe sinking (`2–5 mm`) **only** when
   no side face of the sunk piece lands coplanar with a host end face, opening
   reveal, or slab edge (sinking a flush trim creates a z-fighting side strip).
3. A proud part with a readable offset.
4. A reveal or open gap.

Build named audit meshes first with `buildNamedAuditGroup()`. After the named
assembly passes, build one draw mesh per material slot with
`buildMergedAssembly()`, then run the scene audit again because same-slot
merging can contain coplanar triangles inside one mesh. Named audit parts must
have unique stable names; duplicate names fail assembly construction rather
than merging unrelated evidence under one label.

## Detail, pixel footprint, and geometry budgets

Size detail tiers to viewing distance using the projected pixel footprint at
distance `d`, vertical FOV `phi`, and render height `H_px`:

```text
footprint ≈ 2 * d * tan(phi / 2) / H_px    (metres per pixel)

< 1 px       sub-pixel shimmer; handle via roughness/normal AA or omit
1–3 px       reads as flat drawn lines; no real form or shadow
3–10 px      texture-like relief; reads only if it catches light and casts shadow
> 10 px      true 3D form casting shadows and occluding neighbors
```

Build massing projections (`tenths of a metre to metres`) before medium forms,
and medium forms before fine close-up detail. Relief that must cast shadows must
also exceed `shadowTexelWidth + bias` (`$threejs-shadow-systems`).

Allocate segments by visible radius and camera distance:

```text
radius <= 0.025 m       10–14 segments
radius <= 0.100 m       16–24 segments
radius >= 0.150 m       28–48 segments for player-adjacent forms
```

Report both part count and triangle count. Triangle count alone cannot expose
an object made from hundreds of independent primitives, and part count alone
cannot expose an over-tessellated hero surface.

Spend topology on silhouette, aperture shape, edge highlights, and contact
points before hidden planar faces. Add the small parts that explain assembly—
fasteners, collars, gussets, pads, seams—only after the primary form and joins
are correct.

## Supplied model placement and repair

When integrating exported third-party meshes into a procedural scene:

- **Rigid placement only:** translate, rotate, and scale uniformly; never warp,
  remesh, or destructively edit the asset file.
- **Ground and support explicitly:** place at true contact points without
  floating or sinking past soles/bases; build matching plinths, sockets, or
  niches where the model sits on procedural geometry, and keep cast/receive
  shadows active.
- **Repair detached sub-parts rigidly at load:** split into connected components
  to locate loose floating strands/parts, move them rigidly to their anatomical
  or mechanical attachment point, and confirm clean contact without altering the
  asset file on disk.
- **Derive missing PBR maps in shader code** (`$threejs-procedural-materials`)
  when an export ships base color only.

## Visual inspection contract

Mechanical checks cannot decide whether a form is plausible or well modeled.
Always review structural clay views **single-sided** (`THREE.FrontSide`) because
double-sided clay hides inverted faces and missing wall backs. Inspect at least:

- front, rear, both sides, top, underside, and opposing three-quarter views;
- orthographic silhouette views;
- close views of every join, aperture, shell edge, and cap;
- interaction-height views such as seated eye, standing eye, or boarding view;
- both extrema and intermediate poses of moving geometry;
- grazing light, clay material, material-slot colors, wireframe, and normal or
  face-orientation diagnostics.

Look specifically for primitive seams, implausible load paths, unsupported
parts, hidden-side defects, paper-thin openings, unrounded manufactured edges,
and trim that floats when viewed from behind.

## Observed limitations and defects

- A closed manifold shell can still be the wrong shape.
- Bounding-box overlap is not proof of triangle collision.
- A generic support ray cannot understand suspended, wall-mounted, or hanging
  parts without declared support targets.
- Shell thickness cannot be inferred reliably for every arbitrary mesh; assert
  generator-owned thickness samples or construct the shell with `solidify`.
- Cleaning a combined assembly can weld parts that must remain independent.
- A global bevel radius destroys scale hierarchy.
- Smooth shading across caps and side walls rounds edges that should remain
  exact.
- A broad collision allowance hides defects; every allowed pair needs stable
  names and a construction reason.

## Diagnostics

Keep a build report with:

```text
part count / triangle count / material slots
per-part topology reports
named-assembly z-fight and clash reports
post-merge z-fight report
semantic contract measurements
fixed-view capture list
```

Print actual measured values beside expected ranges. A bare pass/fail hides
whether a clearance is comfortably valid or one floating-point step from the
boundary.

## Failure diagnosis

- Faceted curve: raise profile/ring resolution before adding subdivision.
- Soft hard edge: lower the smooth angle or split cap/side ownership.
- Inside-out solid: repair winding from signed volume before emission.
- Floating component: fix the shared datum or declared support relationship;
  do not visually nudge the part downward.
- Z-fight: remove one face, join topology, or create a proud/revealed relation.
- Collision false positive at a butt joint: verify true penetration depth
  before adding a narrow named allowance.
- Defect appears only after merging: inspect same-slot parts that lost their
  individual object boundary.
