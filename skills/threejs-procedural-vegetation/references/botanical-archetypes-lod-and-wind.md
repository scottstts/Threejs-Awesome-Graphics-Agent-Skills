# Botanical archetypes, rooting, area-conserving LOD, and physical wind

Use this reference to author multi-species vegetation beyond a single preset — grounding every plant with plausible roots and solid clearance, reducing real structure invisibly across detail tiers, and keeping wind physically anchored and frame-accurate in shadows.

## Contents

- Species archetype table
- Pipe-model branching, rooting, and solid clearance
- Banned vegetation stand-ins
- Area-conserving structural LOD
- Ground cover, grass, crops, and flowers
- Physical wind rules and bans
- Observed limits and defects
- Diagnostics and failure diagnosis

## Species archetype table

Choose structural parameters from real botanical habit rather than one uniform tree formula:

| Archetype | Silhouette habit | Branching topology | Foliage attachment | Key visual tells |
| --- | --- | --- | --- | --- |
| Broadleaf round (oak, maple, lime) | Domed crown widening with age | `3–4` recursive levels, wide angles, sinuous limbs | `6–15 cm` leaf cards clustered on outer two-thirds of twigs | Visible scaffold limbs; sky gaps through crown |
| Broadleaf columnar (poplar) | Tall and narrow | Steep, short lateral branches | Small dense leaves along vertical shoots | Strong upward rhythm |
| Flowering tree (cherry, magnolia) | Spreading, layered | Horizontal tiered limbs, dark lenticel bark | `5`-petal cupped blossoms with receptacles + buds in node clusters | Real flower clusters, never pink balls |
| Conifer (spruce, fir) | Conical | Horizontal whorls every `0.3–0.6 m` with drooping tips | Needle sprays along branchlets | Stiff in wind; crisp layered tiers |
| Pine (Scots, umbrella) | Tall clear trunk, flat/rounded top crown | Few heavy spreading scaffold limbs | Needle tufts at outer twig tips | Warm orange-brown upper bark |
| Cypress (Italian) | Narrow flame column | Many short steep branches | Dense scale foliage | Pointed tapered column silhouette |
| Palm | Single curved ringed trunk | None — crown of `15–30` fronds | Each frond is a curved rachis with discrete leaflets; older fronds droop | Dead frond bases clustered beneath crown |
| Multi-stem shrub | Low rounded mound | Many stems emerging from one root crown (no single trunk) | Small leaves directly along stems | Multiple stems entering soil |
| Clipped topiary | Geometric shell over real wood | Dense real twig skeleton inside | Dense small leaves defining outer shape | Visible trunk and interior stems at base |
| Climber / vine / ivy | Follows host surface | Stems hugging host with adhesive roots (`procedural-surface-ivy`) | Overlapping leaves on petioles | Visible stems threading between leaves |
| Grass clump | Tufted blades | Curved `3–5`-segment tapered strips rising from crown | Base-to-tip color gradient + backlit translucency | Soil/thatch ground underneath, not green paint |
| Crop field (wheat, barley) | Consistent parallel rows | Stalk + leaves + seed head per plant | Far tiers preserve geometric furrows until sub-pixel | Field continues to horizon without bare cut-off |

## Pipe-model branching, rooting, and solid clearance

- **Pipe-model cross-sections:** child branch cross-sectional areas roughly sum to their parent's (`r_child ≈ r_parent * sqrt(1 / n)`), preventing uniform wire-like sticks.
- **Continuous wood:** sink every child branch start slightly inside its parent along the parent axis so bark is continuous with zero floating gaps or detached stubs. Taper the main trunk cleanly into a leader or scaffold split — never leaving a blunt pole sticking up inside the crown.
- **Phototropism, droop, and phyllotaxis:** bend growing shoots gently toward light, droop thin twigs under weight, and rotate child azimuths around the golden angle (`~137.5°`) with seeded jitter.
- **Smooth bark at every tier:** bark tubes must shade smooth around their circumference even on coarse far tiers (`5–6` sides) using `smoothAngleForSegments(sides)` (`$threejs-procedural-geometry`) so branches never show flat facets.
- **Rooting and planters:** widen the trunk with a root flare and surface roots diving into soil (`y < 0` into ground). Inside planters, build an upward-facing soil surface enclosed by the planter's inner wall and seat trunks directly into that soil. Surround lawn trunks with ground cover rather than a bare circular decal patch.
- **Build-time solid clearance:** test generated branches and leaf sprigs against scene architectural solids at build time (`auditGroupClearance(..., { between: ["plant", "solid"] })` in `$threejs-procedural-geometry`). Push sprigs outward along the wall normal, prune branches entering roofs/walls, or drop colliding shoots — never allow vegetation to pierce masonry or roofs.
- **Individual variation:** vary height (`±15–25%`), crown width, lean, branching seed, and subtle leaf hue/value across neighbours. Zero identical side-by-side clones.

## Banned vegetation stand-ins

| Stand-in | Why it fails |
| --- | --- |
| Solid sphere, ellipsoid, or blob covered in leaf decals | Reads as a plastic prop; light terminates abruptly on the solid shell |
| Floating cloud of loose leaves with no branches | Canopy detaches visually from the trunk on orbit or close inspection |
| Lumpy blob meshes or flat whole-tree billboard cards at mid/far distance | Breaks parallax and reads as dated proxy art; reduce real tree structure instead |
| Flat green ground plane with sparse blades scattered on top | Reads cartoonish; real turf is blades all the way down over soil/thatch |
| Flat paper-cutout flower discs with no receptacle or stem | Collapses completely at oblique angles |
| Flat textured plane for a crop field | Zero parallax, silhouette, or row self-shadowing |

Alpha-tested leaf cards with real scanned leaf textures attached to real twigs (with double-sided backlit translucency) are valid leaves, not stand-ins.

## Area-conserving structural LOD

Build detail tiers by **reducing the same plant structure** rather than swapping to a proxy:

```js
// Structural tree LOD: keep a deterministic subset of terminal twigs and
// scale remaining leaves so total projected leaf area is conserved.
const TIERS = [
  { keepTwigs: 1.0,  ringSegments: 10, pathStep: 1 },
  { keepTwigs: 0.55, ringSegments: 7,  pathStep: 2 },
  { keepTwigs: 0.30, ringSegments: 5,  pathStep: 3 },
];
const keptTwigCount = Math.max(1, Math.round(totalTwigs * tier.keepTwigs));
const areaConservedLeafSize = baseLeafSize * Math.sqrt(totalTwigs / keptTwigCount);
```

- **Select tiers by projected screen size** (pixels covered) with hysteresis or a short dithered blend — never distance-cull visible plants inside the frustum.
- **Avoid bottle-brush far tiers:** keep a deterministic subset of outer twigs and enlarge their leaves to preserve the outer crown envelope instead of moving leaves inward onto bare scaffold trunks.
- **Measure the handover seam:** render a narrow distance band twice — once using tier `k` alone, once using tier `k+1` alone — and compare mean color, coverage, and luminance (`$threejs-visual-validation`). Darker far bands usually mean the far tier dropped back-face translucency or changed leaf normals; match every shading term across tiers.

## Ground cover, grass, crops, and flowers

- **Grass handover:** near = curved `3–5`-segment blades over soil/thatch; mid = slightly fewer, wider blades matching coverage color; far = scanned grass terrain material matched to the blades' mean color (`$threejs-terrain-and-landscapes`).
- **No camera clearing disc:** never clear grass or flowers within a horizontal radius of `camera.position.xz` — looking straight down reveals an obvious bald disc following the viewer (`$threejs-temporal-stability`). Clear only plants intersecting the camera lens in `3D`.
- **Flowers:** model cupped overlapping petals joined to a receptacle on a leafy stem; mix buds, full blooms, and aging heads.

## Physical wind rules and bans

- **Pinned at the attachment base:** displacement is `0` at the ground or parent branch junction and grows roughly quadratically along the member (`(s / L)^2`).
- **Amplitude from member length and stiffness — NEVER world height:** scaling sway by `positionWorld.y` causes trees standing on a `50 m` hill to thrash by metres. Trunks bend by a tiny fraction of trunk height (`< 0.5–1%`), branches sway modestly in the trunk frame, and leaves/grass tips flutter by centimetres in the twig frame.
- **Rigid trunk bend, travelling gusts:** a tree trunk bends as one stiff lever (never a sine wave undulating up the bark like underwater seaweed). Drive sway intensity from a world-space gust field scrolling along the scene's shared wind direction so waves cross meadows and forests coherently.
- **Species stiffness:** conifers barely move; birches, willows, and grass flex freely; palm fronds whip cleanly at their tips.
- **Moving shadows update every frame:** re-render shadow maps for animated foliage every frame (`$threejs-shadow-systems`); never leave static frozen shadows or proxy blobs beneath swaying canopies. If wind shadow cost exceeds budget, keep plants still — still reads far better than broken wind.

**Banned wind motions:** orbiting/spinning whole plants, tornado-like circular leaf swirls with random per-leaf phases, seaweed waves travelling up trunks, breathing scale pulses, and fallen petals sliding smoothly across the ground instead of resting or tumbling rigidly.

## Observed limits and defects

- **High leaf-card overdraw:** dense overlapping alpha-tested leaf quads can become fill-rate bound at `4K`; use tight alpha-cutout leaf polygons (`5–6` vertices hugging the leaf silhouette instead of big empty squares) to reduce transparent overdraw substantially.
- **Dynamic foliage shadow cost:** animating hundreds of unique trees every frame increases shadow-pass vertex load; drive wind deformation in a shared vertex shader with instanced per-tree phase/wind attributes so shadow depth passes animate in lockstep at low CPU cost.

## Diagnostics and failure diagnosis

Inspect every vegetation system with:

```text
wood-only clay view          verifies pipe-model taper, continuous junctions, root flares, zero blunt poles
plant-vs-solid audit         auditGroupClearance(root, { between: ["plant", "solid"] }) reports 0 visible hits
tier A/B handover capture    side-by-side comparison of tier k vs tier k+1 matching envelope, coverage, color
close-up real-time motion    verifies cm-scale base-pinned flutter, rigid trunk bend, and moving shadows
```

Failure diagnosis:

- **Leaves swirl like a tornado:** sway amplitude scales with world Y or uses uncorrelated circular phase per leaf; pin to sprig base, scale to sprig length in centimetres, and drive phase from a travelling gust field.
- **Distant band of trees looks darker or thinner:** far tier dropped translucency, altered normals, or dropped twigs without scaling remaining leaves; match material terms and conserve leaf area (`sqrt(N_0 / N_k)`).
- **Branches or leaves poke through walls or roofs:** placed without solid testing; run build-time solid clearance checks to prune or push out colliding shoots.
- **Trunks and far branches show sharp flat facets:** crease angle (`34°`) fell below `360° / sides` (`72°` for `5`-sided far twigs); smooth around the branch circumference by construction (`$threejs-procedural-geometry`).
