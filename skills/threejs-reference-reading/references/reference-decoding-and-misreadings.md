# Reference decoding and misreading prevention

Use this reference to translate a visual reference (photograph, concept painting, film frame, clip, or AI-generated image) into an inspectable 3D build specification without falling into recurring spatial, identity, or lighting misreadings.

## Contents

- Crop inspection and element table
- Light decoding from image evidence
- Interpretation contract
- Precedence and conflict resolution
- Recurring identity misreadings
- Recurring space and scale misreadings
- Recurring light misreadings
- Observed limits and defects
- Diagnostics and failure diagnosis

## Crop inspection and element table

Never decode a scene from a single zoomed-out glance. Inspect the full frame at native resolution, then read gridded crops at `3x` to `4x` magnification across every quadrant and along all four borders.

Record an element table before creating meshes:

```ts
type ReferenceElement = {
  name: string
  physicalIdentity: string
  materialFamily: string
  construction: "carved" | "applied" | "assembled" | "grown" | "geological" | "fluid"
  scaleCueMetres: number
  supportsAndContacts: string[]
  continuesOffFrame: boolean
  signatureRole: "signature" | "supporting" | "background"
}
```

Key reading rules:

1. **Construction method follows visible evidence:** test whether a flat ground plane shows between decorative motifs. If no flat wall exists behind the forms, the mass is **carved**; if discrete pieces cast shadows onto a visible flat ground, they are **applied**.
2. **Detail exists only where logic or the reference places it:** never add surface noise or extra props merely to increase polygon density.
3. **Border cuts imply continuation:** an arcade, deck, road, cliff, or cloud deck cut by the viewport edge continues beyond the frame unless a terminating return is visibly depicted.
4. **Signature elements:** identify the `2` to `5` defining structures that carry the image's identity. Author each signature element as a complete designed system rather than a generic primitive stand-in.

## Light decoding from image evidence

Order lighting clues by reliability from strongest to weakest:

1. **Ground cast shadows from vertical cues** (columns, posts, people, trees):
   - Azimuth points opposite the shadow direction on the ground plane.
   - Elevation follows `tan(elevation) = objectHeight / shadowLength`.
   - Collect `2` to `3` independent shadow vectors; disagreement exposes an inconsistent or composite image.
2. **Lit versus shaded face patterns:**
   - Bright top faces with camera-facing walls in soft cool shade indicate a high **backlit** sun ahead of the camera.
   - Bright camera-facing facades with shadows receding behind objects indicate a **front-lit** sun behind the camera.
   - Clean terminators running down cylinders, arches, and corners indicate **side light**.
3. **Specular bisectors** on known curved or flat surfaces: highlights sit where the surface normal bisects the light and view vectors.
4. **Sky radiance and aureole:** locate the brightest horizon sector and measure how rapidly the glow decays away from the disc.
5. **Aperture light patches:** bright pools on floors or walls paired with their openings constrain the exact 3D light vector.

Cross-check all five signals against each other. If a chosen sun direction contradicts the bright/dark face split on the hero subject, revise the reading before placing lights.

## Interpretation contract

When structure, depth, or layout is non-trivial or ambiguous, write a concise plain-language interpretation before building:

```text
Overall space:
  place type, footprint, approximate extents from scale cues
  vertical layers from lowest datum to highest with heights (m)
  enclosure and off-frame continuation past all four edges

Camera:
  viewer eye height (m) and standing position
  horizon row in frame and pitch sign
  lens class (normal 35-55 mm, long, or wide) with vanishing-point evidence

Structure (signature elements first):
  physical identity and construction method (carved/applied/assembled/grown)
  support/contact chain and off-frame continuation
  counts and proportions (bays, storeys, arches, tiers)

Light:
  sun azimuth relative to view, elevation (deg), evidence vectors
  key-to-fill contrast, warm/cool split, haze depth, bloom locations

Style & deviations:
  photographic | stylized | surreal/liminal
  where deliberate physical deviations live (shading/light/grade, never geometry)
  inconsistent/AI-artifact regions with planned plausible versions
  open ambiguities stated as binary questions with recommended readings
```

## Precedence and conflict resolution

Resolve conflicting cues in strict order:

1. **Explicit user constraints** (stated changes, locked assets, or deliberate overrides).
2. **Spatial integrity and physical sense** (level floors, plumb walls, true circles, coherent support chains, orbit-safe forms).
3. **Clear reference evidence** (counts, proportions, construction type, orientation, value hierarchy).
4. **Plausible invention for silent regions** (rear faces, off-frame continuations, zoomed-out detail).

When a reference is AI-generated and contains impossible joints, drifting bay counts, or melted ornament, build the refined, physically coherent version that preserves the visual rhythm and state the deviation in one line. Never copy image-generation artifacts into 3D topology or height maps.

## Recurring identity misreadings

| Misreading | Typical true form | Verification test |
| --- | --- | --- |
| Overhead ring read as an arch | Circular cutout in a ceiling, or near ceiling rim plus distant terrain structure aligning into one ellipse | Check whether sky shows through and whether near/far halves differ in haze or occlusion |
| Curved border mass read as a closed cylinder | Road, deck, or arcade entering from off-frame and curving away | Check whether a closing rear half is visible; if not, extend off-frame |
| Slope profile inverted | Convex slope (steep at top, flattening below) exposes the full descent; concave hides the lower run | Check whether the entire run down to the base is visible from the camera |
| Curved panel read as arbitrary freeform | Patch cut from a sphere or cylinder with circular-arc edges | Test whether curvature is uniform and boundaries read as circular arcs |
| Carved wall read as applied trim | Mass carved in depth layers with no flat wall plane behind the relief | Inspect gaps between motifs at `4x` zoom for an uninterrupted flat plane |
| Applied ornament read as carved | Discrete members seated onto a visible flat ground | Check for cast shadows landing on a flat backdrop between motifs |
| Glossy patterned floor read as water (or vice versa) | Specular stone with projected caustics vs refractive water volume | Check for genuine depth refraction, waterline contact, and Fresnel mirror behavior |
| Monumental figure read as human-scale | Architectural-scale statue or hologram (`10–40 m`) | Compare height directly against adjacent doors (`2.1 m`), storeys (`3–4 m`), or people (`1.7 m`) |

## Recurring space and scale misreadings

| Misreading | Typical true geometry | Verification test |
| --- | --- | --- |
| Shallow, cramped layout | Deep space spanning `50–500+ m` | Back-project known-height objects at near and far planes (`$threejs-camera-direction`) |
| Wide-angle distortion guessed by default | Normal or slightly long lens (`35–55 mm` eq) | Check vertical convergence and near-vs-far size ratio of identical elements |
| Narrow walls placed beside the camera | Open foreground plaza; nearest facade starts far ahead | Inspect the exact left and right frame margins at `100%` zoom |
| Element rotated diagonally | Parallel to neighbouring structures; perceived angle is perspective | Trace eave lines to verify whether they meet the same vanishing point |
| Bent/sheared buildings matching silhouettes | Plumb, orthogonal geometry viewed from a different camera pose | Verify plan squareness and vertical plumb; solve the camera instead of deforming meshes |

## Recurring light misreadings

| Misreading | Typical true lighting | Verification test |
| --- | --- | --- |
| Scene assumed front-lit | Backlit sun ahead of the camera | Check whether upward surfaces are brightest while camera-facing walls sit in cool shade |
| Light blamed on a decorative feature | Direct light entering through an off-frame or overhead aperture | Trace shadow edges and bright floor pools back to the physical opening |
| Bright sunny stone read as overcast | Clear direct sun with strong lit-to-shade ratio (`3:1` to `11:1`) | Measure sunlit vs shaded patches of the same material |
| Atmospheric distance softening read as dense fog | Clear air with long depth span | Check contrast on near foreground objects: crisp near blacks rule out heavy foreground fog |

## Observed limits and defects

- **Monocular scale ambiguity:** a single image without known-height cues or an eye-height anchor cannot determine absolute scale uniquely; assign an explicit architectural or human datum and keep all dimensions proportional to it.
- **Composite and AI perspective breaks:** multi-vanishing-point paintings or AI renders often have no single exact pinhole solution; weight the signature hero region when solving camera and sun, and record residual trade-offs explicitly.
- **Notes replacing the image:** reading from an early text summary instead of the actual pixels causes cumulative drift across iterations.

## Diagnostics and failure diagnosis

Verify every decoding pass with:

```text
element table coverage      every visible mass assigned identity, material, construction, contact
shadow-vector agreement     2-3 independent cast shadows tested for common azimuth/elevation
blockout overlay            clay blockout at solved camera overlaid on reference (max drift noted)
ambiguity ledger            every AI-artifact or true-shape trade-off listed in one line
```

Failure diagnosis:

- **Blockout drifts from reference across multiple quadrants:** lens FOV or eye height was guessed instead of solved; re-run cue-based camera solve (`$threejs-camera-direction`).
- **Structure reads wrong despite accurate silhouette:** identity or concavity was misread; re-test against the recurring misreadings tables above before refining detail.
- **Lighting feels flat or inverted after matching materials:** key side was flipped (front-lit vs backlit) or cast-shadow clues were ignored; re-solve sun direction from ground shadows and render a clay sun-only diagnostic (`$threejs-lighting-and-gi`, `$threejs-visual-validation`).
