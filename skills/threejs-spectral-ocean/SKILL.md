---
name: threejs-spectral-ocean
description: Build large procedural oceans in Three.js from directional wave spectra. Use for WebGPU/TSL FFT oceans, multi-cascade wavelength bands, choppy displacement, spectral derivatives, Jacobian whitecaps, temporal foam, analytic sky reflection, crest scatter, and GPU validation.
---

# Spectral Ocean

Treat an ocean as a sampled stochastic wave field with explicit frequency-space ownership. Do not approximate this target with a pile of Gerstner waves, scrolling normal maps, or unrelated foam noise.

## Build order

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

Read the independently implemented [spectral cascade ocean system](examples/spectral-cascade-ocean/ocean-system.js)
and its adjacent spectrum, FFT, material, and detail modules for the cascade,
FFT, derivative, Jacobian, foam-history, and shading contracts. Its WebGL2
fragment-FFT backend is an explicit compatibility tier; preserve the
production WebGPU/TSL architecture described in the reference when the target
supports it.

## Non-negotiable gates

- Require a power-of-two grid and a passing FFT impulse/frequency test.
- Keep cascade wavenumber intervals disjoint.
- Derive normals from transformed derivatives, not a detached normal texture.
- Detect breaking from the horizontal-displacement Jacobian.
- Persist foam in simulation state; do not infer all foam anew per frame.
- Submit FFT stages with the synchronization required by the active backend.
- Share sun and sky parameters between the visible sky and ocean reflection.
- Keep a deterministic seed and fixed-camera capture for comparisons.

## Route elsewhere

- Use `$threejs-water-optics` for bounded water, screen-space refraction, depth thickness, shoreline absorption, and analytic wave surfaces.
- Add `$threejs-procedural-vfx` only when crest spray or interaction splashes are required.
- Add `$threejs-visual-validation` for cross-seed, temporal, and GPU evidence.
