---
name: threejs-visual-validation
description: Validate advanced Three.js graphics as authored systems rather than subjective screenshots. Use for fixed-view visual contracts, per-layer isolation and gap attribution, quantitative region/local-contrast/glow/horizon-barcode measurements (measure.py), 0.3 px visual flicker sweeps, single-sided clay checks, field and pass diagnostics, no-post baselines, seed sweeps, camera-scale tests, temporal stability checks, cost-by-redesign rules, GPU budgets, and regression evidence for procedural scenes.
---

# Visual Validation

Evaluate the mechanism that creates the image and measure visual gaps objectively. A pleasing hero screenshot can hide unstable fields, broken depth, surface flatness, horizon barcodes, seed failures, or post-processing dependence.

## Validation sequence

1. Freeze deterministic inputs.
2. Inspect structure in **single-sided clay** and run sub-pixel (`~0.3 px`) flicker sweeps across hero, orbit, and junction views.
3. Capture per-layer isolation views (albedo, clay sun-only, clay sun+sky+GI, pre-grade, no-post baseline, final) and system-specific diagnostics.
4. Measure region percentiles, `p1` black level, `8×8` local contrast, saturation, glow falloff, and open-water horizon stripes (`scripts/measure.py`) and attribute every gap to its owning layer.
5. Test the intended camera-distance envelope (`near`, `design`, `far`, plus `4+` orbit angles).
6. Sweep representative seeds and parameter extremes.
7. Test motion and temporal stability (`$threejs-temporal-stability`).
8. Record image, geometry, memory, and timing budgets; optimize expensive features via **cost by redesign** (baking, structural LOD, stable amortisation) rather than blind resolution cuts.
9. Keep a small regression set tied to visual invariants.

Read [references/graphics-validation-protocol.md](references/graphics-validation-protocol.md)
for visual contracts, required inspection controls, mechanism-specific
evidence, temporal checks, budgets, and explicit rejection criteria.

Read [references/measured-comparison-and-attribution.md](references/measured-comparison-and-attribution.md)
(and optional [scripts/measure.py](scripts/measure.py)) for per-layer isolation
and gap attribution, raycast pixel verification, quantitative region/flatness/
glow/barcode metrics, sub-pixel flicker sweeps, and cost-by-redesign rules.

## Required evidence

- fixed camera and seed manifest;
- per-layer isolation captures (albedo, single-sided clay, pre-grade, no-post, final);
- field/pass diagnostic mosaic and quantitative region measurements;
- near, design, far, and orbit camera views plus sub-pixel flicker sweep;
- open-water horizon stripe check (`measure.py --stripes`) when water reaches the horizon;
- at least one stress seed;
- frame-time and render-target inventory;
- written invariants and known compromises.

## Failure conditions

- approval relies on a single hero still frame;
- structure is signed off in double-sided clay that hides flipped faces;
- metrics match mean color while `8×8` local contrast hides flat surfaces;
- gaps are patched in color grading instead of attributed to their owning layer;
- post-processing cannot be disabled per pass;
- random seeds are not reproducible;
- GPU time is inferred only from CPU frame time, or cost is cut by degrading core phenomena;
- temporal artifacts are judged from still images;
- comparison thresholds ignore intentional stochastic pixels without stabilizing them.

## Routing boundary

This skill evaluates an implementation and attributes gaps to owning layers; it does not supply rendering mechanisms. Use `$threejs-reference-reading` to decode a visual reference up front, `$threejs-temporal-stability` for motion-only bisection, and the owning subject/lighting/post skill to implement each fix.
