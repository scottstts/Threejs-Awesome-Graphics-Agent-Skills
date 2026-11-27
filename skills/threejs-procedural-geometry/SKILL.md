---
name: threejs-procedural-geometry
description: Build well-crafted production procedural meshes in Three.js. Use for complete hard-surface assemblies and humanoid robots, profile extrusion, parameter-curve and spine lofts, pillow panels, exact polygon cuts, inset, revolve, sweep, solidify, bevels and fillets, shell thickness, direct-topology apertures, semantic mesh writers, or diagnosing primitive-built forms, coplanar flicker, loose/non-manifold geometry, detached parts, interpenetration, support, clearance, and swept-envelope defects.
---

# Procedural Geometry

Generate geometry from a semantic contract and explicit coordinate frame.
Treat polygon operations as the design model and triangle emission as the final
compilation step. Do not declare an object complete until its topology,
assembly relationships, semantic measurements, and fixed views all pass.

This skill contains exemplary examples and assets beyond descriptive guidance,
they're worth studying, referencing, or even copying. Use them sufficiently
when relevant and do NOT blindly skip them.

## Craft loop

1. Define units, local/world frames, dimensions, bounds, primary profiles,
   topology intent, shell thickness, apertures, material slots, and triangle
   band.
2. Declare every required contact, support, clearance, penetration, reveal,
   moving envelope, and interaction datum.
3. Choose a modeling operation for each visible form: profile extrusion, inset,
   loft, revolve, sweep, direct-topology aperture, solidify, subdivision,
   bevel, or fillet.
4. Keep quads and n-gons through design. Preserve one named mesh per semantic
   part; do not weld unrelated parts or merge material slots yet.
5. Apply modifiers in a deliberate order, then clean inside each part, repair
   winding, assign a part-specific smooth angle, and emit triangles.
6. Run the polygon topology gate, then audit the named world assembly for
   coplanar overlap, defects, and substantial solid clashes.
7. Run builder-owned semantic checks, including support, openings, shell
   thickness samples, ergonomic clearances, and moving extrema.
8. Merge by material slot, audit again, and inspect fixed silhouettes, hidden
   sides, joints, interaction views, wireframe, normals, and grazing light.

## Modeling bar

- Use primitives only for genuinely primitive or hidden structural parts.
- Give every visible manufactured edge a scale-appropriate bevel or fillet.
- Build openings into one closed shell; do not stack a dark plane over a solid.
- Construct thick shells with paired profiles or `solidify`; never rely on a
  single surface where an exposed rim reveals thickness.
- Drive mating parts from the same datum. A late visual nudge is a failed
  dimension contract.
- Choose a continuous mesh for a continuous manufactured form. An arrangement
  of intersecting primitives is not a substitute for modeling.
- Keep narrow, named allowances only for intersections that are structurally
  intentional.

Read [references/geometry-craft-workflow.md](references/geometry-craft-workflow.md)
for the polygon-first modeling grammar, modifier order, join floors, detail
budgets, fixed visual-review contract, and geometry-craft failure diagnosis.

Read [references/geometry-quality-gates.md](references/geometry-quality-gates.md)
for exact topology, coplanar, solid-clash, semantic, support, clearance,
motion-envelope, and visual gates with metre-scale tolerances.

## Portable JavaScript kit

Place the complete `assets/geometry-quality-kit/` directory into a Three.js
project when the project lacks an equivalent modeling and quality layer.
Adjust import paths and scene plumbing as needed; preserve the geometry and
audit contracts.

- [procedural-mesh.js](assets/geometry-quality-kit/procedural-mesh.js) provides
  `MeshData`, polygon cleanup, winding reconstruction, automatic winding flip on
  negative-determinant mirroring, `smoothAngleForSegments`, profiles, offsets,
  extrusion, loft, revolve, sweeps, solidify, subdivision, bevels, apertures,
  smooth-angle normals, material-slot builds, and Three.js emission.
- [mesh-topology-audit.js](assets/geometry-quality-kit/mesh-topology-audit.js)
  checks loose/duplicate vertices, degenerates, open/non-manifold edges,
  detached components, signed volume, and emitted positions/normals.
- [geometry-audit.js](assets/geometry-quality-kit/geometry-audit.js) audits a
  built `Object3D` hierarchy for true clipped coplanar overlap, invalid mesh
  data, missing materials, substantial triangle-crossing clashes, unintended
  curved-surface `auditFaceting`, ground-chain `auditSupport`, and group-filtered
  `auditGroupClearance` (e.g., `['plant', 'solid']`).
- [geometry-contract.js](assets/geometry-quality-kit/geometry-contract.js)
  runs object-specific measurements without imposing project-specific shape
  semantics.
- [assembly.js](assets/geometry-quality-kit/assembly.js) preserves named parts
  for auditing, then builds one draw mesh per material slot after gates pass.
- [selftest.js](assets/geometry-quality-kit/selftest.js) plants known defects
  and verifies the modeling, topology, contract, assembly, z-fight, and clash
  paths; run it after placing or adapting the kit.

## Mechanism references and implementations

Read [references/profile-sweeps-and-mesh-writers.md](references/profile-sweeps-and-mesh-writers.md)
for the exact sculpted-frame profile, rail emission, tree rings, semantic mesh
writer, and their observed scaling limits.

Read the
[sculpted gallery frame geometry](examples/sculpted-gallery-frame/frame-geometry.js)
for profile sweeps, miter-like rail mapping, deliberate cap ownership, PBR
surface bundles, grazing highlights, selective bloom, and geometry diagnostics.

Read
[references/complete-submarine-assembly.md](references/complete-submarine-assembly.md)
for the exact dimensioned object contract, shared loft/sweep kernel, UV-owned
apertures, semantic subassemblies, generated fittings, and model diagnostics.

Read the
[porcelain-and-brass submarine model](examples/porcelain-brass-submarine/submarine-model.js)
for a complete assembly with a tilted-collar hull loft, parallel-transport trim,
furnished glass cabin, shrouded propeller, lens-section fins, and per-part
triangle evidence.

Read
[references/vehicle-loft-and-projector-contract.md](references/vehicle-loft-and-projector-contract.md)
for parameter-curve section tracks, recess-opening sections, superellipse
volumes, spanwise airfoil lofts, warped plates, projector ownership,
load-deflected tyres, and measured limits.

Read the
[Formula One race car model](examples/formula-one-race-car/race-car-model.js)
for one continuous body loft, section-owned cockpit recess, real inlet
aperture, spanwise wing lofts, livery projection, and contact-deflected tyres.

Read the
[sport motorcycle model](examples/sport-motorcycle/motorcycle-model.js)
for slot-tagged emission, revolve and upright-frame sweeps, offset panel shells,
spoked wheels, a hanging chain path, and a volume-audited assembly.

Read
[references/procedural-optimus-humanoid-assembly.md](references/procedural-optimus-humanoid-assembly.md)
for the exact coordinate, polygon/modifier, curve, loft, spine, pillow, CSG,
bevel, semantic assembly, filtered material, emission, limitation, and
diagnostic contracts of a complete human-scale robot.

Read the
[procedural Optimus humanoid entry](examples/procedural-optimus-humanoid/procedural-optimus-humanoid.js)
and its complete
[geometry and material system](examples/procedural-optimus-humanoid/source/optimus-humanoid-system.js)
for a 176-object torso/head/arm/hand/hip/leg/foot assembly with five-finger
hands, 891,809 emitted triangles, fourteen PBR identities, exact polygon cuts,
angle-limited bevels, split corner normals, and derivative-filtered object-space
roughness and bump.

Read the
[procedural financial tower compiler](../threejs-procedural-architecture/examples/procedural-financial-tower/building-system.js)
for semantic placement compilation and material-slot instancing at building
scale.

## Failure conditions

- same-facing coplanar triangles survive at a visible scale;
- a loose vertex, degenerate face, open solid, non-manifold edge, detached
  component, invalid normal, or inward closed volume reaches emission;
- substantial unrelated solids intersect, or a placed part lacks a declared
  support/contact relationship;
- an exposed shell is paper-thin or an aperture is a visual overlay;
- a visible primitive keeps razor edges or joins another primitive without a
  designed transition;
- profile frames flip, caps share smooth side normals, or UV density changes
  with segment count;
- material merging happens before named-part auditing;
- triangle count is the only complexity evidence;
- a script passes but fixed-view inspection still finds implausible modeling.
- a complete humanoid is reduced to intersecting capsules and boxes;
- mirrored hands or limbs keep inward winding;
- high-frequency object-space material noise is emitted without footprint filtering.

## Routing boundary

This skill owns reusable mesh construction and geometry quality. Use
`$threejs-procedural-materials` when surface identity is primary,
`$threejs-procedural-architecture` for a building grammar, and
`$threejs-procedural-vegetation` for a growth hierarchy; those subject skills
may then apply these geometry mechanisms.
