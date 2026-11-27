# Architectural construction and junctions

Use this reference to construct believable architectural forms — walls with real openings, classical orders, arches, vaults, domes, roofs, stairs, and hard-edge junctions — the way real masonry and timber structures are built, without coplanar flicker, hollow undersides, or floating trims.

## Contents

- Walls, openings, and curved hosts
- Classical orders and balustrades
- Arches, vaults, domes, roofs, and stairs
- Sculpted and carved architecture
- Junction rules and exact contact versus safe sinking
- Architectural junction catalogue
- Observed limits and defects
- Diagnostics and failure diagnosis

## Walls, openings, and curved hosts

- **Full-thickness walls:** build walls as closed solids of real structural thickness (`0.25–0.80 m`) with openings cut cleanly through both front and back faces, producing real geometric reveals. For floor-level openings (doors, arcades), cut the opening as a notch in the outer wall contour rather than a touching hole.
- **Windows:** construct a swept architrave or surround, a projecting sill with drip profile, recessed outer frame and glazing mullions, and glass set back inside the reveal. Seat the sill top cleanly proud of the opening bottom face (a deliberate step) or exactly on shared coordinates — never `1–4 mm` off where depth precision triggers z-fighting.
- **Doors:** frame with a surround, recess the door leaf inside the reveal, and seat a threshold block into the floor.
- **Curved walls and drums:** sweep every window frame, architrave, belt course, and balustrade along the host cylinder's or curve's exact arc. Straight chord trims on a curved wall bite into the masonry and reveal dark triangular wedges.
- **Cut openings through every layer:** a doorway or window must cut through the exterior cladding, core wall, interior lining, and any wall directly behind it on aligned coordinates so zero sliver of back wall survives inside the opening.

## Classical orders and balustrades

Proportions below are classical defaults; override from the specific architectural design or reference:

- **Columns:** plinth block + lathed base mouldings (`torus`/`scotia`), tapered shaft with entasis (lathed, fluted where required), and capital (Doric echinus + abacus; Ionic volutes; Corinthian acanthus bell). Total height spans roughly `7–10` lower diameters (`7–8` Doric, `9` Ionic, `10` Corinthian).
- **Entablature:** architrave, frieze, and projecting cornice as swept profiles. Break the entablature forward cleanly over columns or pilasters (`0.15–0.40 m` real projection; shallow `2 cm` breaks read flat at architectural viewing distances).
- **Pilasters:** flat column projections sharing the same base, capital, and proportions, seated onto the wall face with the entablature breaking forward above.
- **Pedestals and balustrades:** plinth, die, and cap mouldings; lathed balusters spaced `0.12–0.20 m` center-to-center seated solidly into both base rail and handrail (`0.9–1.1 m` overall height), with solid newel posts at ends and corners.

## Arches, vaults, domes, roofs, and stairs

- **Arches and arcades:** derive opening contour, concentric voussoir rings, and swept archivolt mouldings from **one shared curve definition and identical segment count** (round, segmental, pointed, or elliptical) so rings never tear or show z-fighting teeth. Place impost blocks at springing height with inner faces flush to the opening edge (flaring outward only), and seat the keystone inside the ring rather than dangling below the soffit. Derive repeated arcade bays from one single bay definition.
- **Barrel, groin, and rib vaults:** construct vault shells with real thickness, sweeping transverse and diagonal ribs along the exact vault curves with bosses at rib intersections.
- **Domes:** build as thick lathed shells resting on a cylindrical drum (wrapped wall with cut openings) and crowned by a lantern; author visible ribs as real sweeps and coffers as sunk recesses inside the shell.
- **Roofs:** pitched roofs include deck/rafters, fascia, eaves overhang, ridge/hip caps, and real tile courses where readable at hero distance (fine relief beyond); flat roofs run their deck cleanly into parapets capped with coping so no slit opens into a hollow interior.
- **Stairs:** author real treads (`0.27–0.32 m`), risers (`0.15–0.18 m`) with nosings, stringers or solid substructure, landings, and balustrades that follow the stair pitch and return cleanly at landings.

## Sculpted and carved architecture

For richly articulated masonry or carved stone facades where no bare flat wall plane exists:

1. Cut the primary wall mass into **structural depth layers first** (`0.15–1.5 m`): projecting clustered piers, recessed arched orders stepping inward ring by ring, deep sunk panels in moulded frames, and cornices breaking forward over every bay.
2. Verify the unornamented massing in single-sided white/clay lighting before adding ornament (`references/ornament-and-relief-systems.md`).

## Junction rules and exact contact versus safe sinking

```text
Rule 1 — Applied piece on host surface:
  Option A (Exact contact): shared coordinates; back face lies on host face with opposite normal.
                            Zero gap, zero coplanar z-fighting under single-sided rendering.
  Option B (Safe sinking):  sunk 2-5 mm into host ONLY when NO side face of the piece lies
                            coplanar with a host end face, opening reveal, or slab edge.
```

Violating Rule 1 by sinking a trim that sits flush with an opening reveal puts a narrow strip of the trim's side face exactly in the reveal's plane facing the same direction — guaranteeing edge z-fighting.

Additional structural junction invariants:

- **Compute support heights from actual geometry:** read the top elevation of a pedestal or moulding chain programmatically rather than typing a hand-estimated `Y` value that floats once the base changes.
- **Never overhang a smaller support:** size caps, pinnacles, finials, and statues to fit inside their support's top footprint (or widen the support).
- **Run members into partners:** rails die into newels, posts enter volute eyes or plinths, rafters meet walls — never leave square cut ends stopping short beside what they should join.
- **Stop horizontal trim at openings and blank faces:** return or terminate string courses, dado rails, and gallery bands cleanly at openings; never sweep a closed belt straight across a doorway or arch.
- **Build convex corners once:** emit one unified corner solid (pier, quoin stack, turret) shared by both meeting facades rather than two overlapping corner trims.
- **Closed shells everywhere:** hollow vessels, planters, parapets, and roofs carry real rim thickness, inner walls, and upward-facing floors/soil surfaces; pinnacles and spires include bottom faces seated on solid shafts.

## Architectural junction catalogue

| Junction | Authoritative construction |
| --- | --- |
| Column to floor | Lathed base mouldings on a plinth block seated directly on paving |
| Column to entablature | Capital abacus carrying architrave; entablature breaking forward over columns |
| Arch to pier | Impost block at springing; inner face flush with opening, flare outward only |
| Wall to roof | Eaves with fascia overhanging wall plane, or deck running into coped parapet |
| Rail to post | Handrail and base rail terminating into newel post; balusters seated in both |
| Stair to landing | Continuous nosing line, stringers engaging landing structure, returning balustrade |
| Building to sloped ground | Level terrace, stepped foundation, or retaining wall (`$threejs-terrain-and-landscapes`) |
| Bridge to bank | Solid abutments grounded into embankments; deck carried end to end |
| Planter to soil | Thick vessel shell with inner wall and upward-facing soil disc inside |

## Observed limits and defects

- **Double-sided clay hides flipped walls:** inspecting structural prototypes with `THREE.DoubleSide` conceals inverted reveals, missing back faces, and downward-facing planter soil discs. Always review clay massing **single-sided**.
- **Hand-set elevations drift:** any modular kit that hardcodes tier heights instead of accumulating actual module heights develops floating or penetrating seams after one proportion change.

## Diagnostics and failure diagnosis

Inspect architectural builds using:

```text
single-sided clay pass       hero view + 4 orbit views + close-ups from both sides of openings and below finials
coplanar/support/shell gate  $threejs-procedural-geometry audit confirming 0 same-facing overlaps, 0 floating parts, 0 open shells
raking-light silhouette      confirms massing breaks, reveals, and mouldings cast clear real shadows
```

Failure diagnosis:

- **Flickering teeth along an arch rim:** opening cutout and archivolt/lining use different segment counts or radii; generate both from one shared curve array.
- **Window frame cuts into a round tower:** planar rectangular frame placed on a cylinder; sweep the frame along the cylindrical host surface.
- **Sky visible through pinnacles or under eaves:** missing bottom faces on shafts/spires or roof deck sized to interior wall bounds; close every solid and extend decks into parapets/overhangs.
- **String course runs across a gate:** horizontal trim was swept as a closed perimeter loop; clip sweep paths against every opening interval.
