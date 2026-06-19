# Cinematic scene rubric

| Dimension | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| focal hierarchy | none | subject identifiable | primary/secondary hierarchy | hierarchy survives motion and resize |
| framing/lens | default/debug | functional | intentional perspective and layers | expressive and gameplay-compatible |
| scale | unreadable | inferred | familiar cues and parallax | convincing across depth and camera motion |
| lighting direction | ambient/random | one obvious light | motivated key/fill/accent | material- and narrative-aware hierarchy |
| value/color | equal/noisy | basic palette | controlled value and temperature | deliberate color script and state |
| depth | flat | fog/blur only | overlap, atmosphere, light, detail | robust multi-cue depth |
| materials | default | varied | hierarchical and light-responsive | integrated with shot purpose |
| post-processing | absent/broken | heavy preset | restrained support | calibrated image pipeline |
| performance | unknown | subjective | measured target-device budget | scalable cinematic ladder |

## Automatic failures

- focal object disappears without bloom/rim;
- UI or hazards are obscured by mood;
- near plane clips environment during intended motion;
- atmosphere is used uniformly to hide missing depth;
- default camera/FOV has not been evaluated;
- all light sources carry equal intensity or saturation.

## QA views

- grayscale;
- thumbnail;
- unlit/base color;
- no post-processing;
- key-only, fill-only, practical-only;
- fog disabled;
- mobile and active-play camera;
- overexposure and underexposure warnings where available.
