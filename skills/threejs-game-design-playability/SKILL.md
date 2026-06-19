---
name: threejs-game-design-playability
description: "Design and evaluate Three.js browser-game verbs, core loops, meaningful choices, fairness, telegraphing, level readability, challenge pacing, HUD, ergonomics, accessibility, failure, and recovery. Use to make a functioning game satisfying; use threejs-gameplay-interaction for input, raycasting, camera rigs, update state, and restart code."
---

# Three.js Game Design and Playability

Design the moment-to-moment verb first; levels, feedback, and progression must give that verb meaning.

## Workflow

1. Name the primary verb and the player intent it expresses.
2. Build a mechanics garden before a content pipeline.
3. Tune input, response, spatial context, feedback, metaphor, and rules separately.
4. Define what the player sees before success and failure.
5. Establish level metrics from movement and camera capability.
6. Add difficulty through richer decisions before raw speed or health inflation.
7. Design UI and accessibility alongside the mechanic.
8. Playtest active states, recovery, and edge cases on target devices.

## Load focused references

- Player verbs, core loops, choice, and mechanics gardens: [player-verbs-core-loop.md](references/player-verbs-core-loop.md)
- Response curves, juice, feedback, and implementation knobs: [game-feel-controls-feedback.md](references/game-feel-controls-feedback.md)
- Camera support, spatial readability, collision fairness, and telegraphs: [camera-space-fairness.md](references/camera-space-fairness.md)
- Level metrics, encounter rhythm, challenge, pacing, and difficulty: [challenge-pacing-level-design.md](references/challenge-pacing-level-design.md)
- HUD, menus, touch/gamepad ergonomics, and accessibility: [ui-accessibility.md](references/ui-accessibility.md)
- Playability quality gate: [gameplay-rubric.md](references/gameplay-rubric.md)

Use the runnable [game-feel playground](examples/game-feel-playground/index.html) to compare raw and tuned acceleration, camera follow, landing response, and feedback.

## Guardrails

- Do not treat polish as an end-of-project pass; prototype feel with the verb.
- Do not use camera friction, motion blur, or shake to manufacture weight.
- Do not make color the only source of critical information.
- Do not infer fairness from deterministic collision alone; anticipation and readable consequence matter.
