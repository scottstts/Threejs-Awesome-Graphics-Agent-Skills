# Shader and VFX rubric

| Dimension | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| visual purpose | decoration/noise | vague mood | clear event/material function | reinforces mechanics and art direction |
| form | unreadable | generic particles | layered primary/secondary/residue | distinctive silhouette and direction |
| timing | constant loop | simple fade | anticipation-impact-decay | expressive hierarchy and interruption |
| aliasing | severe shimmer | tolerable | derivative/filter aware | stable across distance and motion |
| temporal behavior | trails/ghosts | unstable edges | acceptable rejection | robust history and disocclusion |
| integration | pasted on | approximate color | depth/light/material aware | scene-reactive and motivated |
| fallback | none | effect disabled | cheaper equivalent | graceful quality ladder |
| budget | unknown | excessive | measured | scalable by device and event importance |

## Automatic failures

- effect obscures critical gameplay;
- unbounded raymarch/particle growth;
- full-screen pass with no measured benefit;
- bloom is the primary readable form;
- history buffers persist across teleport/reset incorrectly;
- missing cleanup for emitters, render targets, or decals;
- high-frequency shader detail has no filtering strategy.

## QA checklist

- view effect-only and composited output;
- test 30/60/120 Hz and large frame gaps;
- test dark/bright backgrounds;
- test mobile DPR and low quality;
- record overdraw, draw calls, pass resolution, particle count, texture reads, and lifetime;
- verify restart and scene teardown.
