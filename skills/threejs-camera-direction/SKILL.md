---
name: threejs-camera-direction
description: Direct advanced Three.js camera systems and solve reference-matched lenses. Use for pinhole camera solving (FOV, pitch, roll, eye height, back-projected landmarks, real-world scale cues), keeping worlds level and true-shaped, scale-aware chase rigs, thrust lag, side/orbit cameras, body-relative up vectors, quaternion handoffs, authored cinematic framing, floating origins, pointer-look controls, camera collision constraints, projection ownership, and lifecycle restoration.
---

# Camera Direction

Treat the camera as an authored visual system, not a passive viewport. Compose
the subject, solve or establish true scale, choose a stable up frame, and make
every mode handoff explicit.

## Build order

1. Define the design frame: subject size, screen occupancy, lens, near/far,
   motion, and horizon/up convention — or solve FOV, pitch, roll, eye height,
   and landmark coordinates numerically from image cues (`scripts/camera-solve.mjs`).
2. Build camera targets in semantic frames: ship, body surface, docking axis,
   or scene-authored shot.
3. Derive position and orientation independently, then combine them once.
4. Add input orbit/look only inside declared yaw/pitch and spatial constraints.
5. Add frame-rate-independent follow or a bounded spring where the reference
   uses inertia.
6. Snapshot and restore camera projection/state when a scene owns it.
7. Test mode transitions, cuts, pointer-lock reacquisition, resize, and large
   coordinates.

Read [references/camera-rig-and-cinematic-systems.md](references/camera-rig-and-cinematic-systems.md)
for exact chase/side/orbit rigs, projection values, transition
rules, floating-origin shot, pointer controls, and implementation limits.

Read [references/camera-solve-and-real-scale.md](references/camera-solve-and-real-scale.md)
(and run [scripts/camera-solve.mjs](scripts/camera-solve.mjs)) for pinhole lens
solving from horizon/height/vertical/vanishing-point cues, normal-lens defaults
(`35–55 mm` eq), back-projected landmark tables, level/true-shape discipline,
and real-world scale cues.

## Non-negotiable rules

- Use subject dimensions or solved real-world scale cues to derive distances; do not guess wide-angle FOVs that cramp spaces or bend world geometry to fit one frame.
- Lock the solved hero FOV instead of letting lens focal length drift across iterations.
- For planetary motion, derive up from the dominant body rather than global Y.
- Interpolate position with `lerp` and orientation with `slerp`.
- During an explicit handoff, use one interpolation stage. Do not stack a
  transition blend and a second follow smoother over the same interval.
- Re-sync yaw/pitch from the camera when pointer lock is acquired.
- Update the projection matrix whenever FOV, near, far, or aspect changes.
- Keep stars or infinite backgrounds camera-relative when large translation
  would create false parallax or precision loss.
- Restore camera and input ownership on scene disposal.

## Routing boundary

Use `$threejs-reference-reading` to decode physical identities and scale cues from a visual reference before solving camera parameters. Use `$threejs-procedural-animation` for object motion timelines, springs, docking, staging, and debris. This skill owns lens solving, back-projected layout framing, how the scene is viewed, and how camera modes hand off.
