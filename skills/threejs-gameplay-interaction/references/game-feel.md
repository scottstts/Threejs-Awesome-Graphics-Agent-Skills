# Game feel

## Response chain

For each important action, design:

1. anticipation or input affordance;
2. immediate motion response;
3. contact or result;
4. visual effect;
5. audio or haptic cue where available;
6. camera/UI response;
7. recovery and readiness for the next action.

Feedback should communicate state, not decorate every event equally.

## High-value variables

- input buffer and coyote time;
- acceleration and deceleration;
- turn rate;
- jump apex and gravity curve;
- attack startup, active, and recovery time;
- pickup magnetism;
- hit stop;
- camera lag and impulse;
- retry delay;
- difficulty spacing.

Expose these through a gated debug panel when repeated tuning is expected.

## Iteration

Change one axis, play several short loops, and record the result. Revert a harmful change rather than compensating with additional complexity.

## Accessibility

- remappable or alternative inputs where scope allows;
- no critical information from color alone;
- reduced camera shake and flashing;
- readable text and safe-area-aware touch controls;
- pause and focus recovery;
- audio mute and level controls;
- sufficient target and interaction size.

## Readability under motion

Evaluate while moving at full speed. Thin geometry, small labels, subtle material changes, and dense particles often fail only during real play.
