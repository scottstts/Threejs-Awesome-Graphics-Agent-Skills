---
name: threejs-visual-validation
description: Validate advanced Three.js graphics as authored systems rather than subjective screenshots. Use for fixed-view visual contracts, field and pass diagnostics, no-post baselines, seed sweeps, camera-scale tests, temporal stability checks, GPU budgets, and regression evidence for procedural scenes.
---

# Visual Validation

Evaluate the mechanism that creates the image. A beautiful hero screenshot can hide unstable fields, broken depth, seed failures, or post-processing dependence.

## Validation sequence

1. Freeze deterministic inputs.
2. Capture the no-post baseline.
3. Capture system-specific diagnostic views.
4. Test the intended camera-distance envelope.
5. Sweep representative seeds and parameter extremes.
6. Test motion and temporal stability.
7. Record image, geometry, memory, and timing budgets.
8. Keep a small regression set tied to visual invariants.

Read [references/graphics-validation-protocol.md](references/graphics-validation-protocol.md).

## Required evidence

- fixed camera and seed manifest;
- final and no-post captures;
- field/pass diagnostic mosaic;
- near, design, and far camera views;
- at least one stress seed;
- frame-time and render-target inventory;
- written invariants and known compromises.

## Failure conditions

- approval relies on a single frame;
- post-processing cannot be disabled per pass;
- random seeds are not reproducible;
- GPU time is inferred only from CPU frame time;
- temporal artifacts are judged from still images;
- comparison thresholds ignore intentional stochastic pixels without stabilizing them.
