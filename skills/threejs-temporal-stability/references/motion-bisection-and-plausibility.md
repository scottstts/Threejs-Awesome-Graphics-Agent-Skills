# Motion bisection and animation plausibility

Use this reference to systematically reproduce and bisect motion-only rendering artifacts and to verify that secondary motion and animated assemblies obey physical timing, support, and clearance.

## Contents

- Six-move motion verification suite
- Frame-stepped artifact bisection
- Secondary motion coherence
- Physical timing, support, and clearance
- Seamless loops and moving-world framing
- Observed limits and defects
- Diagnostics and failure diagnosis

## Six-move motion verification suite

Never approve a scene from converged still renders. Record and step through all six camera motions at the target playback frame rate (`30` or `60 fps`):

1. **Slow pan (`5–10 deg/s`):** exposes shadow-cascade swimming, specular shimmer on mouldings/water, TAA smear, and border guard-band trails.
2. **Fast turn (`60–120 deg/s`):** exposes disocclusion stripes, amortised tracing grids, SSR reflections vanishing, and bloom pops when bright emitters cross viewport edges.
3. **Dolly in and out (`2 m` to `100+ m`):** exposes LOD tier popping, shadow-cascade boundary shifts, AO radius/distance jumps, and terrain silhouette swimming.
4. **Close fly-past over fine bright detail:** exposes specular aliasing, mipmap shimmering, and non-indexed faceting under changing light incidence.
5. **Look straight down from multiple heights (`2 m`, `15 m`, `80 m`):** exposes camera-following bare discs, missing floors/undersides, and horizon-layer voids.
6. **Turn toward and away from the sun and bright practicals:** exposes bloom threshold pops, sun-aureole/glare mismatch, and eye-adaptation overshoot.

## Frame-stepped artifact bisection

When an artifact appears only in motion, bisect its root cause methodically instead of guessing parameters:

```js
// Deterministic fixed-step motion harness for artifact bisection
export function stepMotionDiagnostic(sceneController, {
  frames = 12,
  dt = 1 / 60,
  toggles = {},
  captureFrame,
}) {
  sceneController.applyPassToggles(toggles);
  sceneController.resetTemporalHistory();
  for (let i = 0; i < frames; i++) {
    sceneController.step(dt);
    captureFrame(i);
  }
}
```

Bisection sequence:

1. **Reproduce deterministically:** lock camera path, start time, seed, and fixed `dt` (`1/60 s`) so the artifact appears on the exact same frame numbers (`t = k * dt`).
2. **Compute consecutive diffs:** inspect `|frame[k] - frame[k-1]|` in the affected crop to confirm whether the artifact flickers per frame, steps every `N` frames, trails across `3–10` frames, or locks to screen coordinates.
3. **Inventory every touching pass:** list post-processing, GTAO, planar/SSR reflections, temporal cloud/sky accumulation, shadow cascades, LOD switches, and wrap shaders affecting that region.
4. **Toggle one candidate off at a time:** re-run the exact same fixed-step clip and measure region mean, variance, and column profile. The pass whose removal eliminates the artifact identifies the owning mechanism.
5. **Confirm the mechanism before fixing:** treat an unexplained artifact as still present even if an incidental parameter tweak hides it from one angle.

## Secondary motion coherence

Subtle secondary motion brings static geometry to life, but incoherent motion breaks realism faster than stillness:

- **Shared wind vector and gust field:** foliage sway (`$threejs-procedural-vegetation`), cloth/flags, rising smoke, cloud drift, and short water ripples must agree on wind direction and travelling gust phase.
- **Water motion:** drive surfaces from spectral or heightfield simulation (`$threejs-spectral-ocean`, `$threejs-water-optics`), never scrolling normal maps over static geometry.
- **Cloud drift and evolution:** advect weather/shape/detail fields continuously along the wind vector without regenerating 3D noise textures per frame (`$threejs-volumetric-clouds`).
- **Flame and emissive flicker:** drive fire light intensity and color from turbulent fluid/buoyancy signals rather than uncorrelated random frame strobing.
- **Creatures and crowds:** match gait, wingbeat, or swim cadence to physical mass and length; tiny birds flap rapidly, large vessels and giants move with visible inertia.

### Shared wind field and travelling-gust contract

Feed every animated subsystem from one deterministic wind evaluation so trees, grass, flags, smoke plumes, clouds, and surface ripples share identical direction and gust arrival timing:

```js
// Single scene-wide wind + travelling gust field sampled by foliage, cloth, particles, and water
export function sampleSceneWind(worldX, worldZ, timeSec, {
  dirX = 0.866,
  dirZ = 0.5,
  meanSpeedMps = 4.5,
  gustAmpMps = 2.2,
  gustWavelengthM = 38.0,
  gustSpeedMps = 6.5,
} = {}) {
  const along = worldX * dirX + worldZ * dirZ;
  const cross = -worldX * dirZ + worldZ * dirX;
  const phase1 = ((along - gustSpeedMps * timeSec) / gustWavelengthM) * Math.PI * 2;
  const phase2 = ((along * 1.7 + cross * 0.6 - gustSpeedMps * 1.3 * timeSec) / (gustWavelengthM * 0.55)) * Math.PI * 2;
  const gust = 0.5 + 0.35 * Math.sin(phase1) + 0.15 * Math.sin(phase2);
  const speed = meanSpeedMps + gustAmpMps * gust;
  return { vx: dirX * speed, vz: dirZ * speed, speed, gust01: Math.max(0, Math.min(1, gust)) };
}
```

Verify coherence by viewing foliage, flags, water streaks, and drifting cloud shadows together in a wide `10 s` clip: gusts must visibly travel downwind across adjacent patches instead of oscillating identically in phase everywhere.

## Physical timing, support, and clearance

- **Gravity and support:** resting objects stay planted (fallen petals or leaves sit still on the ground unless gusts tumble them as rigid pieces — never sliding smoothly across turf); ballistic sprays and debris follow true parabolic gravity arcs (`y(t) = y0 + v0y*t - 0.5*g*t^2`).
- **Timescale matches physical size:**
  - small coastal breaking wave curl crashes in `< 1 s` and whitewater bore subsides in `1–2 s`;
  - highway vehicle lane change takes `2–4 s` of smooth lateral drift, not an instant snap;
  - large architectural doors, gates, or giants accelerate and decelerate smoothly over seconds.
- **Frame-rate-independent integration:** advance every spring, oscillator, and decay with `dt` clamped (`dt = Math.min(rawDt, 0.05)`) so tab switches or frame hitches never explode springs or teleport rigid bodies.
- **Per-frame animation clearance audit:** for any moving mechanical or organic assembly, sample poses across the full cycle (`32–64+` samples, denser at fast turns) and run numerical clearance checks (`$threejs-procedural-geometry`) to prove zero mid-cycle interpenetration.

## Seamless loops and moving-world framing

- **Multi-channel loop alignment:** for a `T`-second seamless loop, quantize every oscillator frequency to an integer multiple of `2*pi / T`, wrap procedural noise time periodically over `T`, and pre-warm stateful simulations (foam, wetness, particle pools) by at least one full decay window before frame `0`.
- **Endless travel ("treadmill" framing):** for infinite roads, railways, or endless surf, recycle world tiles smoothly past a fixed camera frame rather than translating the camera to `10^6+` metres where float32 vertex precision degrades (or pair with a floating origin via `$threejs-camera-direction`). Vary recycled tiles deterministically so repetition does not strobe past the viewer.

```js
// Quantize harmonic frequencies and wrap coordinates identically across all scene lookups
export function createSeamlessLoopClock(periodSeconds, travelSpeedMps = 0, tileLengthM = 50) {
  const omegaBase = (2 * Math.PI) / periodSeconds;
  // Quantize speed so an exact integer number of world tiles passes per loop period
  const tilesPerLoop = Math.max(1, Math.round((travelSpeedMps * periodSeconds) / tileLengthM));
  const quantizedSpeed = (tilesPerLoop * tileLengthM) / periodSeconds;
  return {
    periodSeconds,
    tilesPerLoop,
    quantizedSpeed,
    harmonicPhase: (t, cyclesPerLoop) => omegaBase * Math.max(1, Math.round(cyclesPerLoop)) * (t % periodSeconds),
    wrappedOffset: (t) => (((t % periodSeconds) + periodSeconds) % periodSeconds) * quantizedSpeed % tileLengthM,
  };
}
```

### Quantitative motion-audit thresholds

| Check | Motion input | Pass threshold |
| --- | --- | --- |
| Temporal noise floor | Slow pan (`8 deg/s`) over shaded surfaces | `8×8` local contrast delta vs converged still `<= 15%`; no visible per-frame grain jump |
| Disocclusion recovery | Fast `90°` yaw turn at `90 deg/s` | Zero slanted stripes or dark tiles on frames `t+1` through `t+5` |
| Guard-band border stability | Slow pan watching outer `5%` border strip | Zero vertical/horizontal edge streaks or sudden reflection pop |
| Seamless loop boundary | Frame `N - 1` followed by frame `0` | Region mean and position discontinuity `< 1%` across all animated channels |
| Swept animation clearance | `64`-sample cycle audit (`$threejs-procedural-geometry`) | `0` interpenetrating pairs deeper than declared `seat` (`0.01 m`) |

### Frame-rate independence check

Run every spring, decay, and advection pass at both `dt = 1/60 s` (`60` steps) and `dt = 1/30 s` (`30` steps) to `t = 1.0 s`:
- Exponential smoothing must use `alpha = 1 - Math.exp(-lambda * dt)` (never constant `lerp(a, b, 0.1)` per frame).
- History decay must use `Math.pow(decayPerSec, dt)` (never constant `history *= 0.96` per frame).
- Clamp incoming `dt <= 0.05 s` so browser tab switches never destabilize springs or overshoot bounds.

## Observed limits and defects

- **Fixed-`dt` hides variable-frame-rate bugs:** after bisecting with fixed `dt`, also verify under jittered `dt` (`8 ms` to `33 ms`) to confirm that decay factors and springs remain frame-rate independent.
- **Still-frame clearance is insufficient:** endpoint checks at `t = 0` and `t = 1` miss mid-swing collisions; always sweep intermediate poses.
- **Excessive secondary motion:** still vegetation or calm water reads far better than fast, unphysical wobble; if realistic animated shadows or simulation exceed budget, keep static elements still rather than faking motion.

## Diagnostics and failure diagnosis

Record a motion sign-off bundle:

```text
motion capture set          6 camera moves at 30/60 fps, inspected frame by frame
bisection toggle log        candidate pass toggled -> artifact present/absent -> owning mechanism
animation clearance sweep   min clearance (m) and worst timestamp t across full cycle
loop boundary diff          frame[N-1] vs frame[0] pixel diff verifying seamless wrap
```

Failure diagnosis:

- **Artifact disappears in still screenshots but returns on live orbit:** temporal accumulation or camera-velocity term is masking it; run the fixed-step motion harness with `fullQuality` toggled on/off to isolate.
- **Moving parts collide only briefly mid-animation:** clearance was checked only at rest poses; run a `64`-sample swept clearance pass (`$threejs-procedural-geometry`).
- **Wind, smoke, and water ripples move in conflicting directions:** each system owns an independent direction constant; unify them under one shared scene wind vector.
