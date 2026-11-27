# Geometry quality gates

Use this reference to run deterministic topology, coplanar, collision,
semantic, and visual gates against procedural Three.js geometry. The scripts in
`assets/geometry-quality-kit/` are plain JavaScript and may be placed directly
into a project, with import paths and scene plumbing adjusted as needed.

## Contents

- Gate order and ownership
- Pre-emission topology audit
- World-space collection contract
- Coplanar overlap audit
- Solid-clash audit
- Faceting, support-chain, and group-clearance audits
- Semantic geometry contracts
- Support, clearance, and motion
- Visual gate and flicker sweep
- Observed limitations and defects
- Diagnostics
- Failure diagnosis

## Gate order and ownership

Run gates in this order:

```text
constructor self-test
→ per-part polygon topology
→ named-part world assembly
→ object-specific geometry contract
→ material-slot merged assembly
→ fixed-view visual inspection
```

Do not skip named-part auditing. A merged mesh can reveal same-slot coplanar
triangles, but its material-slot name cannot identify the two semantic parts
that caused them. Do not skip post-merge auditing either; same-mesh overlaps
must remain comparable.

Use `selftest.js` as the smoke test after placing the kit in a project:

```sh
node path/to/geometry-quality-kit/selftest.js
```

The test plants a `0.5 mm` coplanar offset, a clean `10 mm` separation, a
`60 mm` solid interpenetration, an exact butt joint, duplicate/loose vertices,
and passing/failing semantic measurements.

## Pre-emission topology audit

Run `auditMeshData()` after modifiers and cleanup but before triangle emission:

```js
import { cleanMesh, toTriangles } from "./procedural-mesh.js";
import {
  assertMeshAudit,
  auditMeshData,
  auditTriangleSoup,
} from "./mesh-topology-audit.js";

const part = cleanMesh(buildPart());
assertMeshAudit(auditMeshData(part), "housing");
assertMeshAudit(auditTriangleSoup(toTriangles(part)), "housing emission");
```

The polygon audit reports:

- non-finite vertices and invalid face indices;
- faces with fewer than three usable corners or zero area;
- unused vertices and vertex pairs within `0.00002 m`;
- boundary edges, edges used by more than two faces, and same-direction shared
  edges that expose inconsistent local winding;
- edge-connected face components, so shells that only touch at one vertex
  remain separate;
- non-positive signed volume for each closed component rather than only the
  summed mesh volume;
- mismatched or invalid per-face material indices, per-corner UVs, and
  per-vertex color arrays.

`auditTriangleSoup()` separately rejects incomplete triangle arrays,
non-finite positions, non-unit normals, normals opposed to triangle winding,
and zero-area emitted triangles.

The default contract is one outward-wound closed solid. An intentional open
surface must state that exception:

```js
auditMeshData(surface, {
  closed: false,
  maxComponents: Infinity,
  checkOrientation: false,
});
```

Do not use that configuration to silence an accidentally open shell.

## World-space collection contract

`auditGeometry(root, options)` traverses visible meshes by the `isMesh` flag,
not `instanceof`, so it remains valid when two Three.js module instances exist.
It transforms every triangle by `matrixWorld`, validates local position and
normal attributes, and records world bounds per mesh.

```js
const report = auditGeometry(root, {
  bounds: null,
  includeInstanced: false,
  clash: true,
  angleRadians: 0.0025,
  planeDistance: 0.0015,
  overlapArea: 0.0002,
  maxTriangles: 600000,
  top: 25,
  clashAllow: [["bolt:", "housing:"]],
  skip: (mesh, name) => name.startsWith("debug:"),
});
```

`mesh.userData.auditSkip = true` skips one mesh. Keep this for non-production
diagnostics, never as a general defect escape. Invisible ancestors suppress
their descendants. Local normal attributes must remain unit length within
`0.001`. Instanced scatter is excluded by default because organic or aggregate
instances often interpenetrate by design. When enabled, every available
instance is audited as `name[index]` with the composed
`matrixWorld * instanceMatrix` transform; the collector never reads beyond the
instance buffer's capacity. Diagnostic names retain the full named-ancestor
path. `clashAllow` prefixes may match that full path or an individual path
segment.

The metre-scale mechanical constants are:

```text
normal angular tolerance        0.0025 rad (~0.143 degrees)
plane separation                0.0015 m
minimum clipped overlap area    0.0002 m² (2 cm²)
normal plane-grid cell           0.02
distance plane-grid cell         0.02 m
maximum clash depth threshold    0.03 m
normal-length tolerance          0.001
```

Scale every one of these coherently if the project's world unit is not a metre.
The neighboring-cell lookup requires `planeCellNormal` to be at least
`2 * sin(angleRadians / 2)` and `planeCellDistance` to be at least
`planeDistance`; invalid combinations throw instead of silently losing
comparisons.

## Coplanar overlap audit

For each triangle, compute a unit normal `n`, plane distance `d = dot(n, p0)`,
world AABB, and area. Canonicalize plane direction so opposed normals share a
plane bucket. Quantize `(nx, ny, nz, d)` and register the triangle in all
`2^4 = 16` neighboring cells.

Inside each cell:

1. Sort by minimum world X and sweep until inflated X bounds no longer meet.
2. Reject Y/Z AABBs separated by more than `0.0015 m`.
3. Require `abs(dot(ni, nj)) >= cos(0.0025)`.
4. Require a vertex-to-plane distance no greater than `0.0015 m`.
5. Project both triangles into one in-plane basis.
6. Clip one convex triangle against the other.
7. Report only clipped overlap at least `0.0002 m²`.

The AABB test must be inflated by the plane tolerance. Without inflation, two
faces separated by `0.5 mm` have disjoint boxes and the exact defect disappears
before the plane test.

Same-facing overlap is a z-fight. Opposed overlap is counted separately as
back-to-back information because a closed solid may legitimately butt against
another closed solid. Back-to-back status is not proof that the construction is
correct; the semantic contract still owns that decision.

## Solid-clash audit

Bounding-box intersection is only a broad phase. For each named mesh pair:

1. Compute the shared AABB and reject empty overlap.
2. Reject a narrowly named intentional pair.
3. Compute each mesh's minimum bound thickness.
4. Set the required shared depth to
   `min(0.03, max(0.004, 0.34 * min(thicknessA, thicknessB)))` metres.
5. Spatially hash triangles from one mesh inside the shared region.
   Triangles spanning more than `256` cells use a complete fallback candidate
   pass rather than disappearing from collision coverage.
6. Test whether edges from either triangle pierce the other using a
   segment-restricted Möller–Trumbore test.
7. Report the pair after more than two crossings.

This deliberately ignores touching faces and shallow construction seams while
finding a substantial solid running through another solid. `clashDepth`,
`clashCellSize`, `maxCellsPerTriangle`, and `minimumClashCrossings` are explicit
options; their defaults are `0.03 m`, `0.4 m`, `256`, and `3`. Use stable
semantic prefixes in `clashAllow`; never allow entire material classes.

## Faceting, support-chain, and group-clearance audits

In addition to `auditGeometry()`, `geometry-audit.js` exports three scene-wide
audits that catch whole-scene smoothing, floating, and vegetation-vs-solid
defects:

```js
import {
  auditFaceting,
  auditSupport,
  auditGroupClearance,
} from "./geometry-audit.js";

const faceting = auditFaceting(root, { maxDeg: 50, minEdges: 6 });
const support = auditSupport(root, { contactTol: 0.02, groundHeight: (x, z) => 0 });
const plantClearance = auditGroupClearance(root, {
  between: ["plant", "solid"],
  seat: 0.01,
  sampleStep: 0.05,
});
```

- **`auditFaceting`:** flags `material.flatShading === true` and hard normal
  breaks across edges whose adjacent faces meet between `1°` and `50°` (catching
  low-segment curved parts split by a naive crease threshold as well as
  unshared-vertex flat normals). Opt out intentionally faceted meshes with
  `mesh.userData.faceted = true`.
- **`auditSupport`:** builds a contact graph from `mesh.userData.ground = true`
  or `groundHeight(x, z)` via vertex-to-triangle proximity (`contactTol = 2 cm`)
  and closed-solid penetration, then reports every disconnected floating
  component with its world centroid and `lowestY`.
- **`auditGroupClearance`:** tests edge-sampled points (`sampleStep = 5 cm`) of
  group A inside closed solids of group B (`between: ["plant", "solid"]`),
  reporting penetration deeper than `seat` (`1 cm`). Edge sampling catches thin
  branches, rails, or beams passing straight through a solid even when no
  vertices lie inside it.

Triage hits by **visibility** (visible from any reachable camera angle vs buried
or closed-interior) and fix every visible defect **as a class at the generator
that emitted it** rather than nudging single instances.

## Semantic geometry contracts

Generic triangles cannot know that a window must remain open or a wheel must
clear a fender. Keep the measurement beside the builder and use
`geometry-contract.js` for consistent results:

```js
const report = runGeometryContract({
  name: "service hatch",
  checks: [
    rangeCheck("opening-width", (g) => g.opening.width, 0.82, 0.86),
    minimumCheck("hinge-clearance", (g) => g.hingeClearance, 0.004),
    nearCheck("closed-seat", (g) => g.closedGap, 0, 0.0005),
    predicateCheck(
      "sight-line",
      (g) => g.eyeRayBlocked,
      (blocked) => blocked === false,
      "false",
    ),
  ],
}, measurements);
assertGeometryContract(report);
```

Useful contract measurements include:

- expected bounds, height, width, and placement datum;
- contact depth, reveal, minimum gap, and forbidden overlap;
- aperture width/height and visibility rays through it;
- shell-thickness samples owned by the generator;
- seating, handrail, doorway, step, and control clearances;
- expected material slots, part count, and triangle band;
- curve continuity, loop seam position/twist, curvature, and self-distance.

Always print the measured value and accepted interval. A boolean alone makes a
near-boundary result impossible to judge.
Contract check identifiers must be unique and severity is exactly `"error"` or
`"warning"`; misspellings fail at contract construction time.

## Support, clearance, and motion

A support check needs declared targets. Test the lowest/downward-facing sample
points of the part against the surfaces it is permitted to touch, or compare
analytic datums when both builders share them. A generic downward ray is not
authoritative for wall-mounted, suspended, or hanging geometry.

For moving geometry, audit the whole schedule rather than only its endpoints:

```js
for (let i = 0; i <= 64; i++) {
  const t = i / 64;
  const pose = mechanismPose(t);
  const clearance = measureClearance(pose, environment);
  minimum = Math.min(minimum, clearance);
}
```

Raise the sample count where rotation or curvature changes fastest. For a
critical thin clearance, supplement samples with analytic extrema or a swept
silhouette/voxel test. Record the pose of the minimum clearance in diagnostics.

## Visual gate and flicker sweep

An agent or human must inspect fixed views after all scripts pass, using
**single-sided clay** (`THREE.FrontSide`) so flipped or missing faces are never
masked:

- orthographic front/rear/side/top/underside silhouettes;
- opposing three-quarter views;
- grazing-light close views of bevels, caps, seams, and apertures from both sides;
- clay, wireframe, material-slot, and normal-orientation views;
- human-height or interaction-height views;
- every extreme pose and at least one intermediate pose.

**Visual flicker sweep (proving zero visible z-fighting):** across the hero view,
`8–24` orbit views at multiple heights, and junction close-ups, render frame A
with post/temporal effects disabled, nudge the camera by `~0.3 px` of screen
motion, render frame B, and diff `|A - B|`. Isolated pixels flipping sharply
between two surface colors along edges or ledges indicate z-fighting; raycast
through each cluster to name the two fighting surfaces and fix the class at the
generator.

Reject geometry that looks implausible, primitive-assembled, unsupported,
paper-thin, faceted, or poorly finished even when no numeric gate fires.

## Observed limitations and defects

- Triangle truncation makes a report incomplete; `truncated` is a failure for a
  release gate, not a performance success.
- Tiny triangles below the overlap-area threshold cannot create a reportable
  overlap, but they still require topology and visual checks.
- The clash pass detects triangle crossings, not complete containment without
  boundary crossings; add an object-specific containment test where relevant.
- Skinned, morph-targeted, shader-displaced, and procedurally animated vertices
  are audited in their stored buffer pose. Audit their required poses through a
  posed CPU representation or an object-specific contract.
- The collector audits every stored triangle rather than camera layers,
  material groups, or `drawRange`; use a dedicated audit hierarchy when a
  geometry buffer intentionally stores inactive regions.
- Same-material merging can obscure names; retain the named audit hierarchy.
- An open surface must opt out of closed-solid checks explicitly.
- A named allowance can become stale after a rename or design change.
- Fixed views do not replace free orbit inspection when a suspicious junction
  remains ambiguous.

## Diagnostics

Log both summary and evidence:

```js
const report = logAuditReport(auditGeometry(root));
if (
  report.truncated ||
  report.zfight.length ||
  report.defects.length ||
  report.noMaterial.length ||
  report.clash.length
) {
  throw new Error("geometry quality gate failed");
}
```

Retain pair names, clipped area in `cm²`, representative world position,
triangle crossings, topology issue codes, semantic measurements, and the
camera/pose that exposed a visual defect.

## Failure diagnosis

- Missing known z-fight: confirm bounds include it, triangles were not
  truncated, the overlap exceeds `2 cm²`, and all sixteen plane cells remain.
- Many false z-fights: separate same-facing from opposed faces and inspect true
  clipped area rather than bounding boxes.
- Missed collision: add containment or swept-volume logic when no triangle
  edge crosses the other mesh.
- Many duplicate vertices: run cleanup inside one part, not across the assembly.
- Open boundary after solidify: inspect rim orientation and cap ownership.
- Inside-out report: reverse polygon winding or run winding reconstruction;
  never negate normals alone.
- Clean named assembly but dirty merged assembly: isolate the material slot and
  compare its contributing part names before merge.
