# Loading and compression

## Delivery tiers

- Critical: camera, placeholder, hero silhouette, first interaction.
- Deferred: secondary props, high-resolution textures, alternate animations.
- Optional: distant detail, cosmetic variants, nonessential audio.

Make the first meaningful state visible before all assets complete.

## Model validation

Record:

- file and decoded size;
- triangle and vertex counts;
- draw primitives and material count;
- texture count and maximum dimensions;
- animation clips and skeleton count;
- bounds, pivot, forward axis, and world scale;
- morph targets and skinning;
- extension requirements.

Use a known online viewer or isolated test scene to distinguish asset defects from application defects.

## Compression choices

- Meshopt: strong general geometry compression and fast decoding.
- Draco: strong geometry compression; evaluate decode cost and pipeline support.
- KTX2/Basis: GPU texture compression; choose ETC1S or UASTC based on quality and data profile.
- Quantization: useful when precision loss is acceptable.

Compare transfer bytes, decode time, GPU memory, and visible artifacts. A smaller download can still create a large decoded texture footprint.

## Texture rules

- Resize to the largest actual screen-space requirement.
- Preserve alpha only when needed.
- Pack compatible grayscale channels when shader/material conventions support it.
- Use mipmaps for minified 3D textures.
- Apply anisotropy selectively to oblique surfaces.
- Avoid enormous environment maps when rough reflections dominate.

## Loading UX

Show a stable layout, progress or activity, current failure state, retry path, and reduced fallback. Do not block the entire UI on decorative assets.
