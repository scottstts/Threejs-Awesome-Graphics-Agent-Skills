# Terrain, roads, and world generation

## Problem

Generate readable worlds with controllable topology, traversal, biomes, landmarks, and performance.

## Start from design constraints

Choose generation structure from gameplay:

- heightfield: fast outdoor ground, limited caves/overhangs;
- tiled heightfield: streaming and LOD;
- voxel/SDF: caves and destruction at higher cost;
- graph plus patches: islands, biomes, roads, settlements;
- modular authored chunks: strongest composition control.

The Red Blob Mapgen2 approach is a useful principle: generate for the needs of the game, not for geological purity. Coastlines, mountains, rivers, and biomes should support routes, sightlines, encounters, and landmarks.

## Heightfield pipeline

1. Generate low-frequency landmass.
2. Add ridge/valley structure.
3. Apply erosion-inspired shaping or directional masks.
4. Derive slope, height, curvature, moisture, and distance fields.
5. Assign materials/biomes from fields plus authored constraints.
6. Reserve paths and landmark zones before decorative scattering.
7. Generate collision, navigation, vegetation, and LOD per tile.

Use deterministic seeds and record all authoring parameters.

## Roads

Plan roads as graph edges connecting meaningful nodes. Cost functions may include:

- slope;
- water crossing;
- curvature;
- biome or hazard;
- desired scenic route;
- camera/readability.

Smooth the chosen route, then generate a sweep. Blend terrain under the road instead of offsetting the ribbon above it.

## Vegetation and props

Scatter from density fields with exclusion zones, minimum distance, slope/orientation rules, and clustering. Use a few authored species/prop families with controlled variation. Instancing is the default for repeated forms.

## Readability

Use terrain to expose decisions:

- landmarks above horizon;
- path value/texture contrast;
- safe and dangerous silhouettes;
- rest areas after visual density;
- foreground framing around objectives;
- atmospheric depth without hiding traversal.

## Quality ladder

- Cheap: one heightfield, vertex colors, instanced props.
- Standard: tiled terrain, biome masks, roads, LOD, simple erosion shaping.
- High-end: streamed tiles, impostors, hierarchical scattering, authored landmark overrides, BVH collision.

## Source basis

- [Red Blob Games Mapgen2](https://www.redblobgames.com/maps/mapgen2/) for graph- and purpose-driven map generation.
- [Fractals to Forests](https://tympanus.net/codrops/2025/01/27/fractals-to-forests-creating-realistic-3d-trees-with-three-js/) for indexed Three.js procedural trees.
- [StreetGen](https://arxiv.org/abs/1801.05741) for street-network concepts.
