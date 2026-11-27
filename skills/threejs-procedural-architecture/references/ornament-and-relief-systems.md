# Architectural ornament and relief systems

Use this reference to design and generate composed architectural ornament, carving, and relief — rinceau scrolls, acanthus, cartouches, mouldings, coffers, sculpted walls, and gilded trim — with real structural hierarchy, full rounded sections, and zero scattered clutter.

## Contents

- Carved versus applied relief
- Compositional rules and visual hierarchy
- Ornament composition vocabulary
- Architectural motif geometry and gilding
- Relief construction methods and height-field contract
- Banned stand-ins
- Observed limits and defects
- Diagnostics and failure diagnosis

## Carved versus applied relief

Decide how the ornament relates to its host wall before building geometry — never default blindly:

- **Carved relief:** the wall mass *is* the ornament. No flat uninterrupted wall plane exists behind the motifs; depth layers, sunk panels in moulded frames, and raised carving emerge continuously from one closed solid.
- **Applied ornament:** discrete sculptural members mounted onto a visible flat ground behind them, casting real shadows onto the backdrop and seated cleanly via exact contact or safe sinking (`references/architectural-construction-and-junctions.md`).
- **Diagnostic test:** inspect the gaps between adjacent scrolls or leaves at `3–4x` magnification. If an unbroken flat wall plane runs continuously behind the decoration, build applied pieces; if the ground itself steps, recesses, and rises into the frame and motifs, carve it from the mass.

## Compositional rules and visual hierarchy

1. **Composed, never scattered:** every ornamented field follows a single continuous design with one dominant movement and subordinate members growing organically out of it. Every leaf grows from a stem; every scroll springs from a stem, axis, or frame; free ends terminate cleanly in rosettes, flowers, or tight volutes.
2. **Three-tier detail sized to viewing distance (`$threejs-procedural-geometry`):** compute pixel footprint (`footprint ≈ 2 * d * tan(fov/2) / H_px`) at hero and close-up distances:
   - **Mass tier (`> 10 px`, tenths of a metre to metres):** piers, sunk panels, breaking cornices, stepped arches.
   - **Medium tier (`3–10+ px`):** main frames, scroll stems, brackets, cartouche borders, primary leaf clusters — must also exceed `shadowTexelWidth + bias` to cast real shadows.
   - **Fine tier (`< 3 px` at hero, crisp up close):** beads, secondary veins, fine carving texture, or normal/POM micro-relief at distance.
3. **Full three-dimensional sections:** stems and scrolls have rounded, tapering sections (near-round for gilded/metal ornament); leaves are cupped with a central midrib and overlapping lobes. Flat ribbons, wide planks, and paper-thin blades read immediately as cheap cutouts under raking light.
4. **Smooth shading on all curved members:** turned balusters, scrolls, beads, and rounded mouldings must shade smooth by construction (`$threejs-procedural-geometry` smooth-shading & `faceting` audit).
5. **Structural placement and restraint:** place ornament where architectural construction invites it — frames, friezes, panels, capitals, keystones, spandrels, brackets — following the exact boundary of its field. Never add pieces merely to inflate surface density.
6. **Gilded and metallic ornament readability:** build chunky, rounded or crisply faceted forms reflecting a varied environment (`$threejs-procedural-materials`, `$threejs-lighting-and-gi`) so gold reads with near-black contrast beside hot specular highlights rather than flat yellow paint.

## Ornament composition vocabulary

| Composition | Structural layout | Typical architectural field | Construction approach |
| --- | --- | --- | --- |
| Running scroll (rinceau) | Undulating continuous stem; curvature-ramped scrolls branch off crests/troughs into each bay, ending in rosettes; sheath leaves wrap junctions | Friezes, horizontal bands, borders, rails | Carved height field on panel ground, or swept tapering stems with modelled leaves for high relief |
| Mirrored scroll | Two symmetric running scrolls springing outward from a central rosette, urn, or mask | Horizontal panels, overdoors, lintels | Build one half cleanly, mirror with automatic winding flip |
| Candelabrum | Vertical axis of stacked lathed vase, baluster, and foliage tiers with symmetric branching scrolls | Tall narrow panels, pilaster shafts | Axial lathed stack + mirrored swept/carved scroll pairs |
| Cartouche | Framed oval or shield field with rolled, scrolled, or strapwork border, often crowned by a shell or crest | Keystones, overdoors, attic centers | Lofted/swept rolled border around sunk or convex shield + crest |
| Acanthus cluster | Cupped lobed leaves bursting outward in overlapping whorls or fans from a structural point | Capitals, brackets, consoles, scroll roots | Individual cupped lofted leaf blades arranged in staggered whorls |
| Rhythmic repeat frieze (dentils, egg-and-dart, bead-and-reel, guilloche) | Strict modular repeat along a moulding profile | Cornices, architraves, picture frames | Fit exact integer repeat count to span length so rhythm resolves cleanly at corners |
| Strapwork and interlace | Flat/bevelled bands weaving over and under one another with real physical Z-depth at crossings | Ceilings, panels, vault ribs | Swept bands with explicit over/under offset curves at crossings |
| Coffers | Regular grid of recessed panels inside stepped moulded frames, often centered with a rosette | Vaults, domes, ceilings | Sunk recesses cut into shell + stepped frame sweeps + seated rosettes |
| Garlands and swags | Catenary hanging masses of foliage, fruit, or drapery suspended from fixed attachment bosses | Spandrels, wide friezes | Lofted catenary body with modelled overlapping leaves seated at hangers |

## Architectural motif geometry and gilding

| Motif | Geometric contract | Implementation notes |
| --- | --- | --- |
| Scroll / volute | Curvature-ramped spiral (`kappa(l) = k0 + k1 * (l/L)^2`, Euler or log spiral) with radius tapering smoothly from stem to tight eye | Constant-radius circular arcs read as mechanical pipes |
| Acanthus leaf | Cupped blade with central midrib, `3–5` overlapping lobed fingers per side, and recurved tip | Never a flat planar quad |
| Rosette | Central boss ringed by `5–8` cupped petals (`pow(0.5 + 0.5 * cos(N * angle), 0.6)`) | Sits inside scroll eyes, coffers, and symmetry axes |
| Shell | Ribbed radial fan emerging from a hinge with scalloped outer edge | Niche heads, keystones, cartouche crowns |
| Bead | Row of spheres or ellipsoids seated inside a concave groove | Fit count cleanly to span length |
| Egg-and-dart | Alternating ovolo eggs and pointed darts riding a quarter-round ovolo moulding | Resolve corners symmetrically with corner leaf/dart |
| Gadroon / flute | Convex or concave parallel ribs following host curvature | Project along curved shafts, bowls, and bases |

**Gilding and material split:** follow the carving geometry explicitly — either gilded raised members/beads/rims against matte stone grounds (e.g., baroque stucco with fine gilt rims on white scrolls) or stone relief against dark recessed grounds. Keep material slot boundaries aligned to actual geometric relief edges.

## Relief construction methods and height-field contract

| Relief method | Target scale | Construction contract |
| --- | --- | --- |
| Carved height field over panel ground | Low and medium relief (friezes, carved panels, sculpted walls) | Closed solid: front grid displaced by composed height field, flat back, sealed 4 perimeter walls |
| Raised fielded panel | Proud stone panel with moulded perimeter | Rises directly from flush edge (no hole cut required) with moulded border and field carving |
| Sunk panel | Recessed architectural field | Cut recess via outline-with-hole extrusion + separate backing slab, or stepped frame swept around recess |
| Swept and lofted members | High relief and freestanding ornament (brackets, consoles, crests, arms) | Sweep tapering round/ogee profiles along 3D scroll paths; loft cupped leaf blades; seat solidly into host |
| Modelled leaves and volutes | Capitals, acanthus bursts, finials | Individual lofted blades in whorls + tapered swept spirals with rolled cushions |
| Normal / POM micro-relief (`$threejs-parallax-occlusion-mapping`) | Fine tier only, where geometry is sub-pixel at hero distance | Never substitutes for mass/medium relief; carries no true outer silhouette or deep cast shadow |

**Height-field relief rules:**

```js
// Compose height-field relief by MAX union with rounded sections (never additive sums)
const halfRoundTube = (dist, radius) =>
  dist < radius ? Math.sqrt(1 - (dist / radius) ** 2) * radius : 0;

// Grid cell spacing <= 1/3 of smallest member radius; crease angle ~50 deg for smooth rounded ribs
let h = 0;
h = Math.max(h, frameMouldingHeight(s, t));
h = Math.max(h, halfRoundTube(distToStem, stemRadius));
h = Math.max(h, halfRoundTube(distToScroll, taperRadius));
h = Math.max(h, rosetteHeight(s, t));
```

- **Union by `max`, never sum:** summing overlapping members creates swollen blobs at every branch junction.
- **Half-round or ogee section profiles:** linear ramps read as sharp triangular ridges; hard steps read as stamped cardboard cutouts.
- **Grid density:** keep height-field grid spacing `<= radius / 3` of the finest geometric member (e.g., `~6 mm` cells for `18 mm` stems) and assign creased smooth normals (`~50°`) so rounded members shade smoothly while panel borders stay crisp.
- **Real ground PBR & shadows:** apply full PBR stone/gilt maps (`$threejs-procedural-materials`) and confirm relief depth exceeds `shadowTexelWidth + bias` (`$threejs-shadow-systems`).

## Banned stand-ins

| Banned stand-in | Failure mechanism |
| --- | --- |
| Random spheres, rods, rings, or wedges glued onto a flat wall | Inflates busyness without composition; wall still reads flat |
| Disconnected scattered scroll chips from a point scatterer | Breaks structural continuity; reads as surface debris |
| Constant-diameter bent tubes standing in for scrolls | Lacks taper, section variety, sheath leaves, and carved ground integration |
| Height field traced directly from raw 2D image luminance pixels | Reproduces lighting/noise as geometry; reads as melted or dripping wax |
| Single long rod standing in for a cluster of leaves | Real acanthus bursts in overlapping cupped clusters from structural nodes |
| Flat ribbon sections on carved or gilded scrolls | Collapses into paper strips under grazing/raking light |

## Observed limits and defects

- **High-resolution carved height fields are triangle-dense:** a `360 × 90` carved panel emits `~130k` triangles per unique solid; instance identical carved panels across repeated bays and reduce far bays to baked relief normals at mid/far distance tiers (`$threejs-terrain-and-landscapes`).
- **Closed-ring sweeps crossing openings:** sweeping a frieze around an entire facade without clipping against window/door intervals runs ornament straight through open portals.

## Diagnostics and failure diagnosis

Inspect ornamented architecture with:

```text
raking-light clay close-up    exposes flat ribbon sections, faceting, and melted height fields
3-4x hero region crop         verifies continuous stem/scroll hierarchy and pixel-footprint legibility
junction close-ups            confirms exact seating with zero floating or half-sunk flicker
shadow/coverage check         confirms medium relief casts shadows and material split matches target coverage
```

Failure diagnosis:

- **Ornament reads as random clutter glued onto a wall:** cannot trace a continuous main stem or compositional axis; recompose with one primary movement, subordinate grown members, and clear terminals.
- **Wall stays flat despite heavy fine ornament:** detail depth sits below hero pixel footprint (`< 3 px`) while primary wall plane remains unbroken; carve structural depth layers (piers, recesses, breaking cornices) first.
- **Gold decoration reads as flat yellow ribbons:** sections are too wide/thin and environment lacks contrast; switch to near-round sections, cupped leaves, metalness `1`, and a varied environment.
- **Carving looks melted or drippy:** height field was derived from raw image pixels or additive Gaussian sums; rebuild from analytic curves combined with `Math.max` and half-round profiles.
