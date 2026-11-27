# Pinhole camera solving and real-world scale cues

Use this reference to solve camera intrinsics and pose (FOV, `35 mm` equivalent focal length, pitch, roll, eye height) from visual image cues, back-project landmarks onto true world coordinates, keep 3D worlds level and true-shaped, and ground proportions using real-world scale cues.

## Contents

- Pinhole camera model and cue hierarchy
- Running the numerical solver
- Normal lens default and true-shape discipline
- Back-projecting landmarks and sloped ground
- Real-world scale-cue reference table
- Observed limits and defects
- Diagnostics and failure diagnosis

## Pinhole camera model and cue hierarchy

Model a level-ground pinhole camera at `(0, h, 0)` looking along `-Z`, pitched by `theta` (positive looking up), rolled by `rho`, with pixel focal length `f` on an image of size `W × H`:

```text
verticalFOV = 2 * atan(H / (2 * f))
horizonRow  = cy + f * tan(theta)               (horizon below center -> positive upward pitch)
verticalVP  = cy - f / tan(theta)               (verticals converge above frame when pitched up)
zeroPitch:    H_obj / h = (v_b - v_t) / (v_b - v_h)
              distance  ≈ f * h / (v_b - v_h)
```

Rank pixel cues by geometric strength (measured at full native resolution, tapping where object bases actually touch ground rather than shadow tips):

1. **Multiple upright objects of known height at different depths:** fixes eye height `h`, pitch `theta`, and constrains `f`.
2. **Two perpendicular horizontal vanishing points** (street grid, orthogonal building eaves): back-projected rays are orthogonal (`dot(r1, r2) = 0`), directly solving `f`.
3. **Long vertical edges near left/right margins:** vertical convergence jointly fixes `f` and `theta`.
4. **Clean horizon line (eye level / sea horizon):** constrains `theta` and roll `rho`.
5. **Eye-height prior alone:** weak scale anchor only when no known-height objects exist.

Quick hand check (near-zero pitch, person `1.7 m` tall with feet at row `v_b`, head at `v_t`, horizon at `v_h`): compute `h ≈ 1.7 * (v_b - v_h) / (v_b - v_t)`. If two people at different depths yield the same `h`, the horizon line is right.

## Running the numerical solver

Run `node scripts/camera-solve.mjs cues.json` (zero dependencies; verify with `node scripts/camera-solve.mjs --self-test`):

```json
{
  "width": 2000,
  "height": 1125,
  "horizon": [[100, 720], [1900, 728]],
  "objects": [
    { "name": "door", "base": [640, 810], "top": [640, 620], "height": 2.1 },
    { "name": "lamp", "base": [1420, 845], "top": [1420, 490], "height": 4.2 }
  ],
  "verticals": [[[180, 920], [210, 140]], [[1820, 910], [1790, 150]]],
  "groundPoints": { "plazaCorner": [1010, 790] }
}
```

Interpret the JSON report:
- `rmsResidualPx < 3.0 px` on a `~2K` image indicates mutually consistent cues.
- If the residual spikes, drop cues one at a time to identify a misread height (e.g., a `4 m` palace gate entered as a `2.1 m` door) or a non-vertical edge.
- **Lock the solved FOV** once verified; do not let camera FOV drift mid-project unless the art direction explicitly changes lens.

## Normal lens default and true-shape discipline

- **Default to a normal or slightly long lens (`35–55 mm` full-frame equivalent):** wide-angle lenses (`< 28 mm`) guessed by eye force objects close to the camera and make plazas read like cramped alleys. Leave the `35–55 mm` range only when strong vertical convergence or dramatic near-vs-far size ratios prove a wider or longer lens.
- **Never bend, shear, or squash geometry to match one frame:** keep floors level, walls plumb, circles circular (never squashed ellipses), roads straight/true-curved, and repeated arcade bays identical in span and radius.
- **Alignment via camera, not mesh deformation:** overlay the true-shape blockout at the solved camera. Classify every residual difference as (a) a wrong cue (re-solve), (b) a wrong structural reading (`$threejs-reference-reading`), or (c) an inherent perspective inconsistency in an illustrated/AI reference (accept and note in one line).

## Back-projecting landmarks and sloped ground

- Use the solver's back-projected `(x, z, distance)` coordinates to author a landmark table (world position, width, height, orientation). Derive each building's yaw from its eave vanishing point: facades sharing one vanishing point are parallel in world space, even when perspective makes them appear angled.
- **Check spaciousness:** compare open foreground ground and left/right frame borders against the target; never place walls directly beside the camera if the frame margins show open space.
- **Sloped or terraced terrain:** the solver assumes one horizontal ground plane (`y = 0`). On climbing streets or stepped plazas, solve intrinsics/pose from cues standing on the near level plane, then back-project upper landmarks onto their known terrace elevation `y = y_terrace` rather than `y = 0`.

## Real-world scale-cue reference table

| Cue | Typical real-world dimension |
| --- | --- |
| Standing adult / eye height | `1.6–1.8 m` tall / `1.5–1.7 m` eye |
| Seated adult head | `1.2–1.3 m` above floor |
| Interior door / grand portal | `2.0–2.1 m × 0.8–0.9 m` / `3–6 m` tall |
| Residential / classical storey | `2.8–3.2 m` / `3.5–5.0 m` floor-to-floor |
| Stair riser / tread | `0.15–0.18 m` / `0.27–0.32 m` |
| Balustrade height / spacing | `0.9–1.1 m` tall / `0.12–0.20 m` centers |
| Window sill height | `0.8–1.0 m` above floor |
| Classical column height | `7–10` lower diameters (Doric `7–8`, Ionic `9`, Corinthian `10`) |
| Pedestrian / road street lamp | `4–5 m` / `8–10 m` |
| Passenger car / bus / tram | `4.2–4.8 m × 1.4–1.5 m` / `10–12 m` / `20–30 m` (`3–3.5 m` tall) |
| Mature broadleaf / conifer / palm | `10–25 m` / `15–40 m` / `10–20 m` |
| Road lane / sidewalk | `3.0–3.7 m` / `1.5–4.0 m` |
| Brick course / paving slab / roof tile | `67–75 mm` / `0.4–0.9 m` / `0.2–0.35 m` |
| Ship liner deck above water | `10–30 m` |
| Sea horizon distance | `~3.57 * sqrt(eyeHeightMetres)` km |

Cross-check independent cues against one another; if a door implies `2 m` while an adjacent person implies `3.2 m`, determine whether one cue was misread or whether deliberate monumental scale is intended.

## Observed limits and defects

- **Under-constrained focal length:** providing only a horizon and one object at a single depth leaves focal length `f` weakly constrained (multi-start solutions may drift); add vertical edges or orthogonal vanishing points.
- **Inconsistent illustrations / AI perspective:** paintings and AI images frequently blend multiple perspectives; weight cues inside the primary hero zone and accept small peripheral residuals instead of distorting meshes.

## Diagnostics and failure diagnosis

Verify every solved camera and layout with:

```text
camera-solve.mjs report      vertical/horizontal FOV, 35 mm eq, pitch, roll, eyeHeight, rmsResidualPx
landmark table               world (x, z), width, height, orientation per major mass
blockout overlay             wireframe/clay overlay on reference with per-mismatch cause classification
overhead plan + 2 orbits     verifies circular rings, plumb walls, level floors, uniform repeats
```

Failure diagnosis:

- **Scene feels cramped or like a narrow alley:** FOV guessed too wide (`> 65°` horizontal) with camera pulled too close; re-solve toward `35–55 mm` eq, pull camera back, and remove invented side walls.
- **Depth reads compressed/shallow:** distances placed by eye instead of back-projecting known-height cues; rebuild placement from the solver's `(x, z, distance)` table.
- **Buildings appear weirdly skewed in orbit:** meshes were sheared to fit one silhouette; rebuild plumb/true-shaped geometry and align via camera solve.
- **Facade looks rotated diagonally relative to neighbours:** orientation guessed from 2D outline rather than vanishing-point alignment; align yaw to its shared street vanishing point.
