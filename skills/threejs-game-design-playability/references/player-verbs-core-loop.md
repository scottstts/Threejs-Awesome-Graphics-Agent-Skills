# Player verbs and core loops

## Player verb

A verb is an expressive action the player performs repeatedly: steer, jump, aim, place, dodge, climb, connect, inspect, manipulate.

Evaluate:

- frequency: what happens every second?
- sensitivity: can the player express degree, timing, direction, or style?
- context: what world constraints give the verb meaning?
- consequence: does the scene react immediately and persistently?
- mastery: can skill improve beyond basic completion?

“Move with WASD” is input. The verb might be drift, balance, evade, herd, or explore.

## Core loop

```text
perceive state
→ choose/express action
→ system responds
→ player reads consequence
→ new state creates next decision
```

If feedback arrives late or the new state is unreadable, the loop breaks.

## Mechanics garden

Prototype the verb in a small test space containing:

- varied widths, heights, slopes, gaps, and turns;
- one safe target and one risky target;
- surfaces/objects with different response;
- instrumentation for speed, timing, and failures;
- instant restart;
- tunable movement and camera values.

Steve Swink’s game-feel analysis emphasizes testing input, response, context, polish, metaphor, and rules independently. Build the garden before content production.

## Meaningful choices

A choice is meaningful when options differ in:

- risk;
- reward;
- timing;
- resource cost;
- information;
- positional consequence;
- future opportunities.

Avoid choices where one action strictly dominates or outcomes are visually indistinguishable.

## Before/after reasoning

```text
Before: player only holds forward through a wide empty corridor.
Change: add route split—safe long route versus narrow boost route—plus early
telegraph, different camera framing, and persistent score/time consequence.
Result: movement becomes a recurring decision rather than locomotion.
```

## Source basis

- [Game Feel: The Secret Ingredient](https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient)
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)
