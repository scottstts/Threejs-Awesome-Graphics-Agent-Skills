# UI, HUD, input ergonomics, and accessibility

## HUD hierarchy

Show persistent information only when it supports recurring decisions. Organize:

1. immediate threat/action state;
2. objective/progress;
3. resources/cooldowns;
4. secondary score/history.

Use position, size, value, motion, shape, icon, and sound. Avoid a collection of equal rectangular cards.

## World versus screen UI

- Screen UI: stable readability, menus, resources, accessibility.
- World UI: spatial target, damage area, interaction affordance.
- Diegetic UI: world coherence, but must remain readable.

Do not force diegetic presentation when it damages clarity.

## Touch

- large, separated controls;
- safe-area support;
- no precision gestures as the only path;
- pointer cancel and multi-touch handling;
- movable/resizable controls when scope supports it;
- landscape/portrait policy;
- prevent browser gestures only on the interaction surface.

## Gamepad

- dead zones and radial normalization;
- separate move/look response curves;
- consistent focus navigation;
- reconnect/disconnect handling;
- remapping;
- icon prompts based on active device;
- avoid requiring simultaneous difficult holds.

## Accessibility baseline

The Game Accessibility Guidelines recommend, among other items:

- remappable controls;
- adjustable sensitivity and FOV;
- readable resizable UI;
- no essential fixed-color-only information;
- reduced background movement/camera effects;
- separate audio controls;
- subtitles and visual equivalents for important sounds;
- practice/assist/difficulty options;
- settings persistence;
- disabled-player participation in testing.

Prioritize broad, low-cost baseline features, then plan intermediate and advanced adaptations for the game’s specific mechanics.

## Menus

- all gameplay input methods can operate menus;
- focus is visible and never lost;
- settings preview and revert safely;
- pause works during loading/failure states where possible;
- restart and quit are distinguishable;
- accessibility settings are reachable before demanding sequences.

## QA

- keyboard-only;
- gamepad-only;
- touch-only;
- color-blind simulation;
- reduced motion;
- small viewport and large text;
- muted audio;
- interrupted focus/visibility;
- remapped controls.

## Source basis

- [Game Accessibility Guidelines full list](https://gameaccessibilityguidelines.com/full-list/)
