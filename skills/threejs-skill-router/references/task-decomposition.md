# Task decomposition

## Start from the outcome

Translate broad requests into a short dependency graph.

Example: “Build a cinematic, interactive solar-system experience.”

1. Foundations: renderer, camera, loop, resize, lifecycle.
2. Visual design: scale language, orbital composition, focal hierarchy.
3. Materials/lighting: sun emission, planet response, exposure.
4. Shaders or TSL: atmosphere, procedural surfaces, star field.
5. Interaction: navigation, selection, labels, motion comfort.
6. Performance: LOD, texture budgets, update rates.
7. Quality audit: readability, controls, mobile, teardown.

## Separate primary from supporting work

- Primary skill owns the user-visible outcome.
- Supporting skills solve dependencies.
- Audit skill verifies; it should not silently replace implementation skills.
- Performance skill measures and corrects cost; it should not preemptively flatten the design.

## Stop conditions

Do not load another skill merely because it is adjacent. Add one only when:

- the request explicitly includes that domain;
- current evidence reveals a defect in that domain;
- the primary skill instructs loading it for a conditional path.

## Version-sensitive work

For renderer, TSL, post-processing, R3F, Drei, or physics APIs:

1. Read package and lockfile versions.
2. Inspect current imports and existing usage.
3. Consult official docs or package source matching that version.
4. Prefer adapting a nearby working example over recalling exact names.
5. Record assumptions when code cannot be executed.
