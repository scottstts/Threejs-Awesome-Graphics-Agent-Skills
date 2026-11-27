# Style-decides-method and open design

Use this reference to decide where deliberate artistic deviation from physics belongs for photographic, stylized, and surreal targets, and how to design silent, off-frame, or prompt-only regions with architectural and visual coherence.

## Contents

- Style-to-method matrix
- The anchor principle
- Confining deliberate impossibilities
- Open-design workflow
- Taste and coherence checks
- Observed limits and defects
- Diagnostics and failure diagnosis

## Style-to-method matrix

Classify the visual target before building shaders or lights. Style governs **shading, light, and colour grade** — it never licenses sloppy topology, broken spatial relationships, or cheap placeholder stand-ins for core phenomena.

| Pipeline layer | Photographic / real-footage target | Stylized / illustrated / painterly target | Surreal / dreamlike / liminal target |
| --- | --- | --- | --- |
| Primary authority | Real-world optics and footage | The target image's aesthetic and value structure | Deliberate juxtaposition of realistic rendering and chosen impossibilities |
| Geometry and space | True shapes, level/plumb construction, real junctions, closed solids | Same: coherent real construction that survives orbit | Same base coherence; scale or spatial impossibilities confined to named elements |
| Physical phenomena (water, clouds, plants) | Full physical representations (spectral ocean, volumetric clouds, botanical structure) | Keep the real geometric/volumetric method; simplify shading, roughness, or colour response | Keep physical fidelity on anchoring layers so surreal focal elements read as uncanny rather than cartoonish |
| Lighting | Physical light transport: single sun, physical sun-to-sky ratio (`0.10–0.20`), occluded GI | May hold sky down, lift fill, or add subtle motivated art-directed lights while preserving orbit coherence | May decouple selected causal light links intentionally while keeping the rest physically consistent |
| Bloom and lens | Veiling glare above high HDR threshold; subtle lateral CA (`0.05–0.2%`), vignette, shadow-weighted noise | Match target glow footprint and softness directly | Restrained physical camera response unless target explicitly uses dream glow |
| Colour grade | Measured light-driven contrast; gamut-limited saturation; neutral sunlit whites | May push palette, hue splits, and value compression toward target illustration | Controlled palette shifts that reinforce mood without flattening surface texture |
| Individual variation | Natural per-instance variation (`±15–25%` scale/habit/tint); zero clones | Intentional rhythm with controlled variation matching target stylization | Deliberate repetition only where uncanny rhythm is part of the design |

## The anchor principle

A convincing stylized or surreal scene relies on a **strong realistic base** that anchors spatial depth, silhouette quality, and light modelling, paired with **deliberate, bounded deviations** that carry the frame to the reference's specific beauty:

```text
realistic base (coherent geometry + true perspective + grounded contact + primary light logic)
  + bounded artistic deviation (shading response / palette / curated impossibility)
  = intentional art direction
```

Two symmetric failure modes break this balance:

1. **Deviating everywhere:** dropping real construction, real silhouettes, and coherent lighting produces a cheap cartoon rather than deliberate stylization.
2. **Rationalizing away the defining magic:** forcing textbook physical consistency onto an intentionally impossible focal feature destroys the exact quality that made the image memorable.

## Confining deliberate impossibilities

When a visual target derives its appeal from a physical impossibility — such as a normal architectural room whose ceiling is replaced by an ocean surface, an enormous cloud mass indoors, or a sunlit monument in impossible clarity — isolate it explicitly:

1. **Name the impossibility in one sentence** and test what the image would lose if it were normalized.
2. **Define its causal boundary:** for example, keep the room lit as though its ceiling were solid if water caustics and blue ambient bounce would ruin the warm interior contrast.
3. **Keep every non-excluded layer physically coherent:** junctions, scale cues, shadows on ordinary objects, and material separation remain grounded.
4. **Verify orbit survival:** any art-directed lighting trick (such as an unshadowed hero facade) must be checked from `4+` orbit angles. If the sun sits visibly behind a tower that casts no shadow, the trick reads as a bug; replace the exemption with a consistent sun elevation/azimuth or real bounce path that reproduces the hero look honestly.

```js
// Example: documenting bounded style deviations as explicit scene policy
export const stylePolicy = {
  category: "stylized-architectural",
  anchoredLayers: ["geometry", "camera", "contact-ao", "shadows"],
  deliberateDeviations: [
    {
      layer: "lighting",
      rule: "sky fill lifted +35% over clear-sky baseline to match cool luminous shadows",
      orbitSafe: true,
    },
    {
      layer: "grading",
      rule: "gamut-limited foliage/sky saturation boost 1.18x; stone kept neutral (1.0x)",
      orbitSafe: true,
    },
  ],
};
```

## Open-design workflow

Apply this workflow to every region a reference does not show (behind the camera, beyond frame borders, rear facades, interiors, far landscapes) and to prompt-only scenes with no visual reference:

1. **State the place and purpose in one line:** every invented structure, material, and prop must belong to that world (never drop a generic mountain ring around an urban waterfront).
2. **Discard the first `5` stock textbook defaults:** skip bare uniform tile grids, plain rectangular holes with flat frames, identical copy-pasted window walls, generic sphere trees, and empty ground planes.
3. **Design from function and construction:** answer where light enters, what carries structural load, how water/weather drains, and how a skilled builder would detail each joint. Solutions to real physical problems read immediately as intentional design.
4. **Establish a three-tier visual hierarchy:** one dominant primary massing gesture, a supporting rhythmic structure (bays, ribs, terraces, colonnades), and composed fine detail growing from the structure rather than scattered randomly.
5. **Maintain continuity with known regions:** inherit the exact material families, albedo/roughness ranges, lighting ratio, and detail density of the hero area so invented zones never read as a separate project.
6. **Ensure physical causation for light and atmosphere:** every bright pool on a floor corresponds to a real opening; every glow has a real emitting fixture.

### Open-design brief contract

Before generating off-frame continuations or prompt-only architecture/worlds, lock a compact design brief:

```ts
type OpenDesignBrief = {
  placeAndPurpose: string
  rejectedStockDefaults: string[]    // >= 5 generic cliches explicitly avoided
  structuralLogic: {
    loadPath: string                 // what carries roof/upper mass to ground
    lightEntry: string               // exact apertures/openings creating interior pools
    drainageOrWeathering: string     // eaves, sills, ledges, moss/runoff zones
  }
  threeTierHierarchy: {
    primaryGesture: string           // macro massing readable at far distance
    supportingRhythm: string         // bays, piers, colonnades, terraces
    composedDetail: string           // structural ornament/trim growing from rhythm
  }
  offFrameContinuations: {
    left: string
    right: string
    behindCamera: string
    beyondHorizon: string
    overheadAndBelow: string
  }
}
```

### Continuity table for invented zones

| Inherited property | How invented areas stay cohesive | What breaks cohesion |
| --- | --- | --- |
| Material palette | Reuse the hero area's exact stone, timber, metal, and soil families (`±10%` albedo shift max) | Introducing unrelated bright colors or plastic untextured walls behind the camera |
| Texel density | Match `tilesPerMetre` across hero walls and extended wings (`$threejs-procedural-materials`) | Stretching one coarse brick texture over rear facades |
| Bay and storey module | Continue bay width (`~3.2–4.5 m`) and floor height (`~3.0–4.5 m`) around corners | Arbitrary blank box extensions with misaligned cornices |
| Lighting and haze | Share the exact same `sunDir`, sky model, and `LightProbeGrid` bounce (`$threejs-lighting-and-gi`) | Unlit voids or mismatched fog colors behind the camera |

## Taste and coherence checks

Evaluate open or extended regions against five concrete questions:

- **Identity:** does the structure have a specific character rooted in its place and function, or could it be any generic box?
- **Restraint:** is every element justified by construction, story, or composition? Remove filler added solely to inflate busyness.
- **Causality:** do all cast shadows, light shafts, and reflections trace to real geometry and real openings?
- **Rhythm vs cloning:** is repetition structured through intentional rhythm, alternation, and controlled variation (`±15–25%` on organic elements) rather than obvious identical stamps?
- **360-degree durability:** viewed from behind, from high overhead, and from human eye level, does the space hold together as one real place?

## Observed limits and defects

- **Unbounded style creep:** letting "stylized" waive smooth-shading checks, closed-solid rules, or grounded contact degrades visual quality rather than creating style.
- **Unstated deviations:** mixing accidental bugs (wrong color space, missing shadows) with intentional style makes debugging impossible.
- **Orbit breakage:** screen-locked lights, no-cast exemptions, or 2D card cutouts fail immediately once the viewer moves off the hero bookmark.

## Diagnostics and failure diagnosis

Record a concise style and open-design diagnostic sheet before look development:

```text
style category              photographic | stylized | surreal/liminal
anchored base layers        geometry, camera, shadows, materials, atmosphere
explicit deviations         layer, exact parameter delta, orbit-check status
silent/off-frame plan       north/south/east/west/behind/overhead continuations
taste audit                 stock defaults removed, causal light openings verified
```

Failure diagnosis:

- **Stylized scene looks like a cheap cartoon:** geometry or lighting fundamentals were dropped along with shading complexity; restore real construction, clean junctions, and grounded contact shadows first (`$threejs-procedural-geometry`, `$threejs-lighting-and-gi`).
- **Surreal scene loses its magic after "fixing" physics:** a defining impossibility was over-normalized; restore it behind an explicit causal boundary and verify orbit coherence.
- **Extended/off-frame areas feel disconnected from the hero frame:** invented zones broke palette, texel density, or architectural rhythm; align material families, albedo ranges, and bay/scale proportions (`$threejs-procedural-materials`, `$threejs-terrain-and-landscapes`).
