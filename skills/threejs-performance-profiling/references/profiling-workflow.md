# Profiling workflow

## Establish a reproducible case

Record:

- device/GPU and browser;
- viewport and DPR;
- quality setting;
- camera and scene state;
- interaction sequence;
- asset cache state;
- expected target.

## Classify the symptom

- CPU-bound: scripting, React work, scene traversal, physics, allocations.
- GPU-bound: fragment load, shadows, post, geometry, bandwidth.
- submission-bound: draw calls, material/program switches.
- loading-bound: network, decode, shader compile, upload.
- memory-bound: texture/target size, leaks, churn.

## Evidence

Use:

- browser performance profile;
- `renderer.info`;
- React profiler for R3F;
- GPU frame capture such as Spector.js for WebGL;
- shader compile logs;
- heap snapshots and repeated mount/unmount tests;
- effect toggles and resolution scaling.

## Isolation tests

- lower DPR: large improvement suggests pixel/GPU cost;
- hide geometry while preserving passes: geometry or draw cost;
- disable shadows: shadow rendering cost;
- disable post passes one at a time;
- freeze simulation: CPU/system cost;
- replace materials with basic material: shader/lighting cost;
- use empty scene with same UI: framework/layout cost.

Report measurements with conditions, not unsupported universal thresholds.
