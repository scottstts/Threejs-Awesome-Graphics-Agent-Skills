---
name: threejs-spectral-ocean
description: Build large procedural oceans and coast transitions in Three.js. Use for WebGPU/TSL FFT oceans, multi-cascade wavelength bands, coastal breakers, finite-volume shallow-water beach waves, signed-distance coastlines, shallow-water swash films, wet-sand transitions, rock-impact spray, stylized above/below surface optics, permanently submerged Snell-window views, total internal reflection, forward-refracted structures through an interface, pixel-footprint spectral LOD, aquatic perspective, caustic god rays, choppy displacement, spectral derivatives, Jacobian whitecaps, windrow and temporal foam, analytic sky reflection, underwater absorption, crest scatter, and GPU validation.
---

# Spectral Ocean

Choose the representation that owns the requested view. Open-water sea states use
explicit frequency-space ownership. A beach-level breaker view uses a coupled
band-limited wave field, coast representation, swash state, foam history, and
sand response. Do not reduce either target to scrolling normal maps or unrelated
foam noise.

This skill contains exemplary examples and assets beyond descriptive guidance,
they're worth studying, referencing, or even copying. Use them sufficiently
when relevant and do NOT blindly skip them.

## Spectral build order

1. Define the sea-state spectrum and deterministic Gaussian seed.
2. Partition wavelengths into disjoint cascades.
3. Validate the inverse FFT independently with analytic inputs.
4. Generate and conjugate-pack the initial spectrum.
5. Evolve packed displacement and derivative fields in frequency space.
6. Inverse-transform every packed field with explicit inter-step barriers.
7. Assemble displacement, derivatives, and persistent Jacobian foam maps.
8. Shade from summed cascade displacement and derivatives.
9. Add sub-grid detail only below the resolved simulation bands.
10. Expose spectrum, height, slopes, Jacobian, and foam-history diagnostics.

Read [references/spectral-cascade-ocean-system.md](references/spectral-cascade-ocean-system.md) before implementing or auditing a spectral ocean.

Read [references/horizon-and-slope-optics.md](references/horizon-and-slope-optics.md) (and run [scripts/ocean-spectrum-check.mjs](scripts/ocean-spectrum-check.mjs) to validate JONSWAP/Parseval/Cox–Munk cascade budgets) for 3-cause horizon-barcode elimination, slope-integrated sky and planar object reflections, Cox–Munk roughness hand-off, and breaking-wave volumetric life cycles.

Read
[references/coastal-breaker-and-swash-ocean.md](references/coastal-breaker-and-swash-ocean.md)
before implementing or auditing the water-to-wet-sand transition of a coastal
breaker system.

Read the [spectral cascade ocean system](examples/spectral-cascade-ocean/ocean-system.js)
and its adjacent spectrum, FFT, material, and detail modules for the cascade,
FFT, derivative, Jacobian, foam-history, and shading contracts. Its WebGL2
fragment-FFT backend is an explicit compatibility tier; preserve the
production WebGPU/TSL architecture described in the reference when the target
supports it.

Read the
[stylized above/below ocean material](examples/stylized-above-below-ocean/stylized-ocean-material.js)
when the target needs a stylized FFT ocean that can be inspected from both
above and below the surface: height-gradient water color, sun-path glints,
crest scatter, Jacobian foam, water-tinted seafloor caustics, and an
underwater Beer-Lambert composite driven by scene depth.

Read the
[submerged Snell ocean system](examples/submerged-snell-ocean/underwater-snell-ocean.ts)
when the camera must remain underwater beneath a WebGPU spectral surface: it
provides exact water-to-air Fresnel with a derivative-filtered critical-angle
mask, total internal reflection against a physically bright upwelling underside,
an energy-conserving transmitted-sun lobe, forward projection of above-water
structures into the window, shared HDR sky radiance, aquatic extinction and
in-scatter, footprint-faded differential-area caustics, full-resolution god rays,
suspended particulates, and the final HDR grade.

Read the
[coastal breaker ocean system](examples/coastal-breaker-ocean/coastal-breaker-ocean.js)
when the defining view sits at the waterline: it provides deterministic
band-limited gravity and capillary fields, a signed-distance mainland and
island coast, coast-normal shallow-water swash chains, persistent breaker and
film foam, camera-following warped geometry, wet-sand optics, and shared sky
radiance.

Read the
[ocean beach waves implementation](examples/ocean-beach-waves/ocean-beach-waves.js)
when the beach is owned by a positivity-preserving finite-volume solver: it
provides a rocky coastal grid, reconstructed water and wet-sand fields,
advected foam, shallow-film optics, reflected and refracted sky radiance, and
impact-triggered spray.

## Spectral non-negotiable gates

- Require a power-of-two grid and a passing FFT impulse/frequency test.
- Keep cascade wavenumber intervals disjoint.
- Derive normals from transformed derivatives, not a detached normal texture.
- Detect breaking from the horizontal-displacement Jacobian.
- Persist foam in simulation state; do not infer all foam anew per frame.
- Submit FFT stages with the synchronization required by the active backend.
- Share sun and sky parameters between the visible sky and ocean reflection.
- Close all three horizon-barcode causes from day one: exclude water/sky from AO with distance fade and reversed depth (`$threejs-screen-space-ambient-occlusion`), sample sky reflections at footprint-matched mip levels, and fade depth-buffer water terms (refraction, depth absorption, depth contact foam) before depth precision fails. Verify with `measure.py --stripes` (`$threejs-visual-validation`).
- Hand lost cascade slope variance to surface roughness against Cox–Munk (`0.003 + 0.00512·U`) and integrate reflections/glitter across the pixel's slope distribution (plus waterline-clipped planar mirrors for scene objects).
- Transport opposite-medium structures by FORWARD projection: rasterize their own vertices at their refracted screen positions. On an open interface, never trace a water pixel backward to a source screen position, and never gate transported radiance on whether a direction's vanishing point lands on screen. (A bounded pool seen only from air can still use the screen-space offset in `$threejs-water-optics`; an ocean whose camera changes medium cannot.)
- Bracket a water-side crossing solve by the critical angle (`tan θc ≈ 1.1346` times the ray's own distance from the interface), not by the camera-to-source span.
- Scale spectral LOD by PIXEL FOOTPRINT — `distance² · pixelAngle / heightGap` — and apply it to vertex displacement, derivatives, and every band that rides them. Fade each band to its own mean when the band is an albedo or radiance term.
- Filter the critical-angle domain test over about one output pixel; never filter the interface normal itself to stabilize what is transported through it.
- Gate the entire optical side from one camera-medium state; do not choose above/below behavior per triangle.
- Terminate distant underwater sightlines with a safely submerged terrain rim; do not mask an empty seabed/ocean horizon with a view-aligned scattering layer.
- Keep a deterministic seed and fixed-camera capture for comparisons.

## Coastal breaker gates

- Keep coastline SDF, arclength tables, ribbon geometry, and swash columns in
  one coast contract; do not derive unstable column ordering from SDF gradients.
- Hand offshore wave level into the coast-normal conserved-volume chain; a
  linear spring chain does not uniquely recover a flat free surface.
- Persist both world-space breaker foam and coast-parameterized film foam.
- Blend water, wet sand, and dry sand by the actual water column, not a detached
  shoreline decal.
- Derive water normals from the same gravity/capillary fields that displace the
  surface, and derivative-filter sand normal detail at grazing distance.
- Share sky radiance and sun direction between the visible surround and ocean
  reflection.
- Keep the orbit camera above the terrain and use a fixed waterline camera for
  comparisons.

## Route elsewhere

- Use `$threejs-water-optics` and its `photoreal-water` example for air-side shallow-water FFT optics, RGB caustics and diffraction glare. Use that skill for bounded water, screen-space refraction, depth thickness, shoreline absorption, and analytic wave surfaces. Its screen-space refraction is valid there because the camera stays in air and the volume is bounded; it is not a substitute for this skill's forward projection across an open interface.
- Add `$threejs-procedural-vfx` only when crest spray or interaction splashes are required.
- Add `$threejs-visual-validation` for cross-seed, temporal, and GPU evidence.
