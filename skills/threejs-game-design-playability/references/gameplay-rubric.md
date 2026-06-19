# Gameplay rubric

| Dimension | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| player verb | absent | functional | expressive and contextual | mastery-rich |
| input response | broken/laggy | usable | predictable and tunable | device-aware and nuanced |
| feedback | absent/noisy | generic | synchronized hierarchy | material/state-specific |
| camera | obstructive | follows | supports decisions and comfort | adapts without stealing control |
| collision fairness | contradictory | deterministic | readable and learnable | robust at edge cases/speed |
| level readability | confusing | marked path | world-guided decisions | layered exploration and mastery |
| challenge/pacing | arbitrary | linear | teaches/composes/recovers | varied decision pressure |
| HUD/UI | missing/debug | functional | hierarchical and responsive | integrated and accessible |
| accessibility | blocked | basic options | broad baseline | mechanic-specific assist/testing |
| restart/recovery | broken/slow | works | fast and complete | preserves learning flow |

## Automatic failures

- core verb cannot be triggered reliably;
- camera hides required information;
- failure lacks attributable cause;
- essential state uses color alone;
- restart leaves stale state;
- touch/gamepad is claimed but untested;
- feedback obscures the play space;
- challenge increases only by raw speed/health without readability.

## Playtest prompts

- What does the player do every second?
- What meaningful choice occurred in the last ten seconds?
- What did the game communicate before failure?
- Can the player recover orientation after camera collision?
- Which feedback layer can be removed without losing information?
- Does the game remain playable with reduced motion and muted audio?
