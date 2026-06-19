# Asset ownership and disposal

## Ownership models

Choose one:

- Exclusive: a consumer owns and disposes the resource.
- Shared immutable: an asset cache owns the resource; consumers borrow it.
- Shared mutable clone: cache owns source data; consumers own clones.
- Pooled: pool owns reusable instances and releases them at pool shutdown.

Document the model in code. Most disposal bugs are ownership bugs.

## Model cloning

A shallow scene clone may still share geometry, materials, textures, and skeleton assumptions. Decide independently whether consumers need:

- unique transforms only;
- unique materials;
- unique geometry;
- independent skeletons;
- independent animation mixers;
- independent morph state.

Clone only the layers that must diverge.

## Disposal checks

- Remove the object from active scene graphs.
- Stop mixers and references that keep it alive.
- Dispose exclusive geometry and materials.
- Walk material texture slots only when those textures are owned.
- Dispose generated PMREM targets, render targets, and compressed textures.
- Clear cache entries only when no consumer remains.

Use `renderer.info.memory` as a clue, not a perfect leak detector. Internal caches and delayed cleanup can affect counts.

## Dynamic worlds

For streamed levels:

1. Load into a staging owner.
2. Validate and prepare materials/colliders.
3. Activate atomically.
4. Deactivate old content.
5. Release old ownership after no system references it.

Avoid disposing during traversal of a render or physics update.
