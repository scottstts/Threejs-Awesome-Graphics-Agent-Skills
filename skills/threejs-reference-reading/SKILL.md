---
name: threejs-reference-reading
description: Decode a visual reference into a physically coherent Three.js 3D build plan. Use for translating photos, concept art, paintings, film stills, clips, or AI-generated images into physical element identities, construction methods, spatial connectivity, light direction, style-to-method rules, misreading prevention, and open design for silent or off-frame regions.
---

# Reference Reading and Visual Translation

Turn a visual reference into an exact physical, structural, and stylistic reading before writing geometry or shader code. Model what the image actually shows — identity, construction, proportion, orientation, counts, and light — rather than improvising from a quick glance.

## Decoding order

1. Inspect the full frame at native resolution, then read gridded crops at `3–4x` zoom region by region.
2. Build an element table naming what each form physically is, its material, how it is constructed (carved, applied, assembled, grown), its scale cues, what it touches, and whether it continues off-frame.
3. Decode lighting from image evidence: cast-shadow azimuth and length, lit versus shaded faces, specular bisectors, sky aureole, and light patches cast through openings.
4. Cross-check every reading against lighting, perspective, scale, and structural logic; revise any reading that fails.
5. Classify the style target (photographic, stylized/illustrated, or surreal/liminal) and declare where deliberate deviations from physics live.
6. Flag inconsistent or impossible areas (such as AI-generated artifacts) and define the plausible refined version to build.
7. Name the `2–5` signature elements that define the image so they are built as designed structures rather than generic placeholders.
8. Keep the reference beside every capture during construction and look development; re-read the image itself rather than memory or notes when a region drifts.

Read [references/reference-decoding-and-misreadings.md](references/reference-decoding-and-misreadings.md) for the element-table and light-decode contract, precedence rules, recurring identity/space/light misreadings, verification tests, and failure diagnosis.

Read [references/style-method-and-open-design.md](references/style-method-and-open-design.md) for the style-decides-method matrix, the anchor principle, confining deliberate impossibilities so they survive orbit, and open-design craft for silent or off-frame areas.

## Non-negotiable rules

- **Name physical identity before technique:** decide what an object is and how a builder or nature made it before picking mesh or shader tricks.
- **The frame is a window onto a larger world:** elements cut at the border continue past it unless closure is visibly shown.
- **Never deform world geometry to fit one frame:** keep floors level, walls plumb, circles circular, and repeated bays uniform; solve alignment through the camera (`$threejs-camera-direction`).
- **Style lives in shading, light, and grade — never broken geometry:** a stylized target simplifies shading or art-directs light, not structural coherence or core physical representations.
- **Anchor every deviation:** keep a realistic structural base and confine deliberate impossibilities so they still hold when the viewer orbits.
- **Follow precedence when cues conflict:** explicit user instructions → spatial integrity and physical sense → clear reference evidence → plausible invention for silent areas.
- **Refine rather than copy noise:** replace AI-generated inconsistencies with clean, plausible construction matching the reference's character.
- **Reject stock defaults in open areas:** design silent or prompt-only regions from load, light entry, fabrication logic, and visual hierarchy rather than bare tile grids or box openings.

## Failure conditions

- building from a vague vibe so silhouettes, counts, or orientations drift ("resemblance, not exactness");
- inventing stairs, walls, or podiums where the reference clearly shows open ground or a continuing path;
- misreading an overhead cutout as an arch, a continuing curved path as a closed cylinder, or backlit faces as front-lit;
- rotating an element diagonally when its eaves share the same vanishing point as neighbouring structures;
- rationalizing away a deliberate surreal impossibility that creates the image's appeal, or letting an art-directed trick break on orbit;
- copying AI noise into geometry or relief instead of authoring refined structure;
- leaving off-frame, rear, or silent regions empty or filled with unrelated generic clutter.

## Routing boundary

This skill owns visual decoding, structural interpretation, style-to-method decisions, and open-design intent before and during a build. Use `$threejs-camera-direction` to solve lens FOV, pitch, eye height, and back-projected landmark coordinates; `$threejs-lighting-and-gi` to realize decoded sun/sky ratios, HDRI fill, and GI; `$threejs-procedural-geometry`, `$threejs-procedural-architecture`, `$threejs-terrain-and-landscapes`, or `$threejs-procedural-vegetation` to build the decoded subjects; and `$threejs-visual-validation` for side-by-side captures, quantitative region metrics, and per-layer gap attribution.
