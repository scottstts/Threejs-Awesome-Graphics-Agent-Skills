# Budgets

Budgets are project hypotheses. Set them from target hardware and validate with measurement.

## Track

- frame time percentiles;
- CPU update and render submission time;
- GPU frame time where available;
- draw calls and triangles;
- visible objects and lights;
- shadow-casting lights and shadow texels;
- post-processing passes and resolution scales;
- texture GPU footprint;
- geometry memory;
- active physics bodies and contacts;
- startup bytes, decode time, and time to first interaction.

## Frame targets

Common targets:

- 60 Hz: 16.7 ms total frame;
- 90 Hz: 11.1 ms;
- 120 Hz: 8.3 ms;
- 30 Hz fallback: 33.3 ms.

Leave headroom for browser, UI, thermal throttling, and spikes. Average FPS can hide poor tail latency.

## Quality ladder

Reduce independently:

1. DPR;
2. shadow resolution/update frequency;
3. expensive post effects and their resolution;
4. reflection/environment resolution;
5. particle counts and update frequency;
6. LOD distance and decorative density;
7. physics frequency or noncritical simulation.

Keep interaction responsiveness and core silhouette as long as possible.

## Mobile

Profile sustained load, not only a cold 10-second run. Watch thermal throttling, battery use, touch latency, and memory-related tab reloads.
