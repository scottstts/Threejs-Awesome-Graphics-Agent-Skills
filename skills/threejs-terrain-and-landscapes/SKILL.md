---
name: threejs-terrain-and-landscapes
description: Build non-orbital Three.js terrain, geological rock and cliffs, dunes, snowfields, built-to-ground foundations, and continuous near-to-horizon world layers. Use for jointed rock strata, height-matched cliff displacement, scree and talus, sand dunes, slope-driven snow, terraces and retaining walls, eliminating ground voids and bare wall-foot rings, backlit and front-lit far mountain ranges, and projected-size world distance tiers.
---

# Terrain, Rock, and World-Scale Landscapes

Author outdoor terrain and distant landscapes so they hold up both at `1 m` close-up inspection and out to the visible horizon. Ground must run continuously under every structure and far landform with real geological form, matched projection, and coherent distance layering.

## Build order

1. Identify the dominant geological formation (limestone, granite, sandstone, basalt, slate, dunes, snowfield) and macro landform features (ridges, gullies, saddles, terraces, river cuts, coastlines).
2. Plan continuous distance tiers by projected pixel footprint: near (`~0–100 m`), mid (`~0.1–2 km`), far (`~2–30 km`), and horizon beyond — ensuring ground runs beneath and past every far range or island.
3. Build large rock/cliff massing from jointed blocks, prisms, and bedding ledges rather than smooth radial blobs or cones.
4. Displace near/mid rock and terrain using the exact same projection, scale, and offset as the shading material so texture cracks align with geometric fractures.
5. Apply multi-scale material blending (`1×`, cliff-scale `~0.1×`, macro variation) with slope-, shelter-, and height-driven masks (`$threejs-procedural-materials`).
6. Resolve every built-to-ground junction with level terraces, foundations, or retaining walls, running soil and ground cover cleanly up to wall feet.
7. Shade distant massifs through the scene's shared atmosphere model (`$threejs-atmosphere-aerial-perspective`) so backlit, front-lit, and side-lit ranges step back cleanly in value with distance.

Read [references/terrain-rock-and-ground-contact.md](references/terrain-rock-and-ground-contact.md) for geological rock forms, cliff construction, height-matched displacement, dune anatomy, slope-driven snow deposition, and building-to-ground foundations.

Read [references/distance-layers-and-far-landscapes.md](references/distance-layers-and-far-landscapes.md) for near/mid/far/horizon methods per content type, backlit/front-lit/side-lit mountain value rules, handover matching, and eliminating voids, sky leaks, and blob proxies.

## Non-negotiable rules

- **Fracture geometry at real scale:** cliffs and boulders are built from joint sets, bedding planes, overhangs, and ledges — never smooth spheres or noise cones with rock texture painted on.
- **Matched displacement and shading projection:** apply rock height displacement using the identical triplanar axes, scale, and offset as the base color, normal, and roughness maps, with vertex density sufficient to resolve near fractures.
- **No stretched slopes or visible tiling:** use triplanar or slope-aware projection on steep faces and multi-scale breakup checked from grazing and high-overhead views.
- **Resolve every structure-to-ground interface:** cut level terraces into slopes and build foundations, plinths, or retaining walls; never let terrain slice straight through walls or leave bare decal rings around building feet.
- **No voids or terminating world edges:** run ground, sea, or cloud fields continuously past the visible horizon so no sky band leaks beneath distant ranges or straight down from high orbit.
- **Real reduced structure, never blobs:** distant woods, towns, and ridges use lower-detail structural tiers of the real generator — never lumpy blobs, flat mountain cards, or distance culling in view.

## Failure conditions

- rock surfaces read as smooth balloons with painted cracks that cast zero shadows under raking light;
- steep cliff faces show stretched planar UVs or high-altitude views reveal repeating texture tiles;
- snow sits on near-vertical cliff faces because deposition used height alone instead of slope and shelter;
- sand dunes lack sharp winding crests, `30–34°` slip faces, wind ripples, or self-shadowing;
- buildings float above slopes, get sliced diagonally by terrain, or sit inside wide bare rings cleared of grass;
- sky shows underneath distant mountain ranges or a scene floats on a cut-off square plane in a void;
- distant ridges pop in piece by piece as the camera moves, or backlit mountains appear flat and equal in value to the sky behind them.

## Routing boundary

This skill owns non-orbital terrestrial terrain, rock/cliff geometry, dunes, snow placement, structure-to-ground contact, and near-to-horizon landscape layering. Use `$threejs-procedural-planets` for spherical orbit-to-surface planetary bodies; `$threejs-procedural-fields` for reusable scalar/vector field design; `$threejs-procedural-materials` for PBR textures, triplanar shaders, `hybrid-soil-moss-surface`, and `deformable-sand`; `$threejs-precipitation-surfaces` for active snowfall/rain coupled to weather progress; `$threejs-procedural-vegetation` for botanical growth and LOD tiers; and `$threejs-atmosphere-aerial-perspective` for shared sky scattering and aerial haze.
