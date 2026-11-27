# Terrain, rock, dunes, snow, and ground contact

Use this reference to construct believable geological rock, multi-scale terrain, sand dunes, snow deposition, and resolved transitions between built structures and natural land.

## Contents

- Geological rock types
- Cliff and boulder construction
- Multi-scale terrain and landform anatomy
- Sand dunes and snow deposition
- Built-to-ground contact and foundations
- Observed limits and defects
- Diagnostics and failure diagnosis

## Geological rock types

Choose rock geometry and weathering rules from the actual geology rather than generic isotropic noise:

| Rock type | Dominant form | Joint and fracture structure | Weathering signature |
| --- | --- | --- | --- |
| Limestone | Blocky massifs, horizontal strata, karst towers | Orthogonal vertical joints + horizontal bedding yielding stepped skylines | Dissolution fissures, dark vertical streaks under ledges, moss on shelves |
| Granite | Massive rounded domes, tors | Widely spaced curved exfoliation joints | Rounded boulders, slabby peels, lichen patches |
| Sandstone | Layered cliffs, wind-carved alcoves | Strong horizontal/cross-bedding planes | Undercut hollows, warm sedimentary color bands |
| Basalt | Columnar cliffs or blocky ledges | Hexagonal cooling-column prisms | Angular talus of broken column segments at cliff base |
| Slate / schist | Thin jagged sheets | Steep angled foliation planes | Splintered sharp edges and flaking scree |

## Cliff and boulder construction

1. **Jointed massing:** assemble cliff faces from bundles of prisms or stepped blocks aligned to the geology's joint sets. Vary block projection and summit height to establish a stepped skyline instead of radial mounds or cones.
2. **Bedding ledges:** carve horizontal or tilted strata steps that catch top light and cast crisp shadows downward; deposit moss, soil, or snow preferentially on these ledges.
3. **Projection-matched meso displacement:** displace cliff vertices using the same height map, triplanar axes, tile frequency, and UV offset that drive the material's base color, normal, and roughness (`$threejs-procedural-materials`). Every dark fracture in the texture then corresponds to an actual recessed crack in geometry. Keep vertex spacing dense enough (`5–20 cm` near the viewer) to hold displacement where inspected closely.
4. **Clearance-masked displacement:** mask geometric displacement near walkways, doorways, and architectural bases so displaced rock never protrudes into navigable clearances or through walls.
5. **Talus and scree:** build debris aprons at cliff feet sloping near the natural angle of repose (`~35°`), blending from coarse fallen blocks near the wall to finer gravel downslope.
6. **Three-scale rock shading:** combine near-scale scan detail (`1–3 m` per tile), cliff-scale application of the same scan (`15–40 m` per tile for macro ribs and fractures), and broad low-frequency color/roughness variation blended by distance.
7. **Boulders:** construct closed faceted meshes shaped by joint planes and rounded by weathering; sink bases solidly into terrain so soil and grass rise naturally around the base. Vary scale, orientation, and proportions per individual.

## Multi-scale terrain and landform anatomy

- **Hydrological and structural features:** compose terrain across at least three spatial scales — macro ridges/valleys/saddles, meso gullies/erosion channels/terraces/river cuts, and micro ground undulations — never a single octave of smooth radial bumps or noise spikes.
- **Slope- and elevation-driven material masks:** drive transitions causally from surface normal and altitude:

```glsl
// Causal terrain blending: rock on steep faces, soil/vegetation on gentle slopes
float slopeAngle = acos(clamp(worldNormal.y, 0.0, 1.0));
float rockMask   = smoothstep(0.45, 0.78, slopeAngle); // ~26 deg to ~45 deg transition
float snowMask   = (1.0 - smoothstep(0.70, 1.05, slopeAngle)) // bare above ~50-60 deg
                 * smoothstep(snowLine - 15.0, snowLine + 25.0, worldPos.y);
```

- **Triplanar / slope-aware projection:** avoid planar XZ UVs on steep slopes (`> 35°`), where texels stretch vertically into smeared stripes.

### Geological strata and erosion-channel composition

Layer macro landforms so ridges, valleys, terraces, and drainage cuts reinforce one another instead of stacking isotropic noise:

```glsl
// Anisotropic ridged mountain mass + stepped sedimentary strata + talus apron
float ridgeNoise(vec2 p) {
  return 1.0 - abs(2.0 * valueNoise2D(p) - 1.0);
}

float strataHeight(vec2 xz, float baseElevation, float dipSlope, float stepHeightM) {
  float tilted = baseElevation + xz.x * dipSlope;
  float band   = floor(tilted / stepHeightM);
  float frac   = fract(tilted / stepHeightM);
  // Crisp flat bench (0..0.35) transitioning into steep riser (0.35..1.0)
  float stepCurve = smoothstep(0.32, 0.88, frac);
  return (band + stepCurve) * stepHeightM;
}
```

Numeric landform invariants:
- **Ridge-to-valley hierarchy:** keep macro massif wavelength `4x–10x` wider than secondary spurs and `20x–50x` wider than erosion gullies so silhouettes step cleanly at every viewing distance.
- **Steep-face triplanar blend sharpness:** raise triplanar weights by power `k = 4–8` (`pow(abs(worldNormal), vec3(6.0))`) so horizontal moss/soil shelves stay crisp rather than washing halfway down vertical rock joints.
- **Snow sparkle footprint guard:** scale sub-pixel snow-glint intensity down smoothly as pixel footprint grows past `0.02 m` (`smoothstep(0.06, 0.01, pixelFootprintM)`) so distant snow slopes read smooth and silky instead of glittering like static noise.

### Multi-scale heightfield and displacement contract

```js
// Deterministic 3-scale rock/terrain displacement budget matching triplanar shading projection
export const TERRAIN_DISPLACEMENT_CONTRACT = {
  nearCliffVertexSpacingM: 0.15,    // holds 3-15 cm fracture displacement cleanly up close
  midTerrainVertexSpacingM: 1.5,    // ridges, gullies, and terrace cuts
  rockScalesTilesPerMetre: [0.5, 0.06, 0.012], // near scan (2 m), cliff fractures (~17 m), macro (~83 m)
  talusAngleOfReposeDeg: 35,
  duneWindwardDeg: [5, 15],
  duneSlipFaceDeg: [30, 34],
  snowBareRockSlopeDeg: 55,         // steep faces above ~50-60 deg shed snow cleanly
  clearanceMaskMarginM: 0.35,       // smooth fade to 0 displacement near paths/walls/doors
};

export function maskDisplacementNearStructures(rawDisp, signedDistToFootprintM, marginM = 0.35) {
  const t = Math.max(0, Math.min(1, signedDistToFootprintM / Math.max(marginM, 1e-4)));
  const smooth = t * t * (3 - 2 * t);
  return rawDisp * smooth;
}
```

### Structure-to-terrain foundation rules

When placing architecture on non-flat terrain:
1. Sample terrain height `h(x, z)` at all four footprint corners plus midpoint samples along every wall edge; record `hMin` and `hMax`.
2. If `(hMax - hMin) > 0.25 m`, build a **level stone/concrete plinth or retaining terrace** whose top sits at `hMax + 0.10 m` and whose foundation skirt extends down to `hMin - 0.50 m` (strictly buried below lowest grade).
3. Blend terrain vertices smoothly to meet the retaining wall perimeter outside the footprint without vertical UV stretching, and clamp grass/shrub scatter exclusion strictly to the footprint polygon (`0–10 cm` margin) so ground cover runs directly up to the masonry.

## Sand dunes and snow deposition

### Sand dunes
- **Three required scales:**
  - megadunes / draa (`200 m – 2 km`);
  - primary dunes (`20 – 200 m`) with sharp, winding, branching crests (or crescent barchans with horns pointing downwind);
  - wind ripples (`5 – 25 cm` wavelength) oriented perpendicular to the prevailing wind, visible up close.
- **Asymmetric profile:** gentle windward slope (`5°–15°`) rising to a crisp crest line, dropping into a steep leeward slip face at the angle of repose (`30°–34°`).
- **Lighting and silhouettes:** distant dune crests need sufficient mesh density along silhouettes (baked normal maps cannot fix polygonal crest silhouettes). Bake static dune-on-dune self-shadowing into a terrain shadow map so distant crests read cleanly beyond cascade shadow range (`$threejs-shadow-systems`).

### Snow deposition
- **Slope and shelter control:** snow settles on up-facing ledges and low-angle slopes, dropping off cleanly on faces steeper than `50°–60°` so steep cliff faces remain bare rock. Accumulate deeper drifts in the wind-sheltered lee of boulders, walls, and trees.
- **Object snow caps:** give snow caps on roofs, rails, and branches real geometric thickness with rounded edges and subtle leeward overhang (for active weather-coupled accumulation and falling snow, see `$threejs-precipitation-surfaces`).
- **Optical reading:** high linear albedo (`0.80–0.90`), cool sky-blue tint in shadow from physical sky fill (`$threejs-lighting-and-gi`), soft edge transitions into thin patches on grass/rock, and sparkle only from footprint-filtered sub-pixel glints — never unfiltered white noise.

## Built-to-ground contact and foundations

Structures placed on sloping or uneven land must show real architectural grounding:

1. **Level terraces:** cut level pads into slopes with crisp retaining walls or embankments rather than sinking half a house diagonally into a hillside.
2. **Foundations and plinths:** extend structural masonry foundations downward past the lowest surrounding terrain height so no corner ever floats above a dip.
3. **Zero bare wall-foot rings:** when clearing grass or ground cover around building footprints, clear strictly inside the wall footprint (`0–10 cm` margin), never a wide circular exclusion ring that leaves a flat bare halo around every building. Run soil, weeds, moss, and stone paving directly up to the wall base.

## Observed limits and defects

- **Coarse heightfields cannot represent overhangs:** standard `y = f(x, z)` height grids cannot form undercut sandstone alcoves or overhanging cliff ledges; build overhanging cliff faces as dedicated jointed block/prism meshes seated onto the base terrain.
- **Unmasked displacement collisions:** applying `0.5 m` rock displacement globally without path/footprint masks pushes stone onto stairs and through foundations.
- **High-altitude tiling:** even clean triplanar projection repeats visibly from overhead views unless multi-scale blending or stochastic/hex tiling breaks periodicity.
- **Normal-map / silhouette divergence:** baking cracks only into a normal map without matching vertex displacement leaves cliff edges smooth against the sky and removes raking-light self-shadows.

## Diagnostics and failure diagnosis

Inspect every terrain and rock build with:

```text
raking-light cliff close-up     confirms rock fractures cast real shadows (geometry, not flat normal map)
steep-slope grazing view        checks slopes > 45 deg for UV stretching
high-overhead wide view         exposes macro texture tiling and radial noise blobs
building-foot close-ups         verifies foundations, terraces, and zero bare clearing rings
slope/snow mask view            confirms bare steep rock and natural snow-to-rock feathering
displacement clearance check    confirms zero displaced rock poking into paths, stairs, or walls
```

Failure diagnosis:

- **Rock reads as smooth blobs with painted stone texture:** mesh lacks jointed block massing or vertex density for height-matched displacement; rebuild cliff massing with joint sets and displace in the exact material projection.
- **Stone loses micro-texture and looks like a flat two-tone gradient:** scanned albedo/normal/roughness maps were collapsed into a procedural color ramp; preserve real map structure with multiplicative tinting (`$threejs-procedural-materials`).
- **Snow coats vertical cliffs:** snow mask is keyed only on world Y height; multiply by an upward-normal slope cutoff (`< 50–60°`) and shelter mask.
- **Sand dunes look flat or cartoonish:** missing multi-scale crests, `30–34°` slip faces, cross-wind ripples, or baked dune-on-dune self-shadowing; add all three scales and static self-shadow map.
- **Bare dirt ring surrounds buildings or tree trunks:** ground-cover scatter exclusion radius is far larger than the actual footprint; tighten exclusion to the exact footprint and blend soil/turf directly against the base.
- **Rock displacement pokes onto walkways or inside walls:** displacement lacked spatial clearance masking; multiply displacement by `maskDisplacementNearStructures(...)`.
