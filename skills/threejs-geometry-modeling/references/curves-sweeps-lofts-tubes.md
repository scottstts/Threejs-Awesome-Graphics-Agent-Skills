# Curves, sweeps, lofts, and tubes

## Problem

Build roads, rails, cables, pipes, rivers, ribbons, and changing profiles along a path.

## Frame construction

A sweep needs a center point and an orientation frame at every sample:

- tangent: forward along the curve;
- normal: profile “up” direction;
- binormal: profile “right” direction.

Naively using world-up fails when the tangent approaches world-up. Frenet frames can flip near inflections. Prefer parallel transport for stable authored paths:

1. Choose an initial normal not parallel to the first tangent.
2. For each segment, rotate the previous frame by the shortest rotation between tangents.
3. Re-orthogonalize normal and binormal.
4. Apply intentional banking/twist separately.

## Vertex layout

For path sample `i` and profile vertex `j`:

```text
position = center[i]
         + normal[i]   * profile[j].x * width[i]
         + binormal[i] * profile[j].y * height[i]
```

Create indices between adjacent rings. Duplicate the seam ring only when UV wrapping or independent normals require it.

## Roads and tracks

- Sample by approximate arc length to avoid stretched segments.
- Separate visual width from collision width.
- Bank curves from curvature and speed, then cap for readability.
- Generate shoulders, curbs, lane marks, rails, and collision as related but independent strips.
- Use cumulative distance for longitudinal UVs.
- Resolve intersections as a higher-level graph problem; do not force one sweep through a junction.

## Lofting

Interpolate compatible profiles along a path. Profiles need equal semantic points, not merely equal counts. Preserve corners, feature lines, and material boundaries.

## Failure diagnosis

- Sudden 180° twist: frame flip; use parallel transport and continuity checks.
- Pinching: path curvature exceeds profile radius or sampling is too sparse.
- Texture speed changes: UVs based on sample index rather than distance.
- Road floats: centerline does not follow terrain or lacks shoulder blending.
- Shading bands: normals use ring facets instead of intended smooth profile.

## Quality ladder

- Cheap: `TubeGeometry` or flat ribbon with fixed width.
- Standard: parallel-transport frames, distance UVs, banking, separate collider.
- High-end: graph intersections, terrain conforming, decals/markings, LOD, spline editing.

## Checklist

- no frame flips;
- no self-intersection in expected curvature range;
- stable width and texture density;
- bounds and normals valid;
- collision and navigation match intended path.
