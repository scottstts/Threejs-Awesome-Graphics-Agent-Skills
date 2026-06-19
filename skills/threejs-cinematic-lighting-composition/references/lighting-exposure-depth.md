# Lighting, exposure, temperature, and depth

## Light hierarchy

- Key: establishes direction, time, and primary form.
- Fill: controls shadow readability; usually broader and weaker.
- Rim/kicker: separates silhouette or emphasizes material.
- Practical: visible source in the scene.
- Motivated extension: offscreen or enhanced light justified by a practical/environment.
- Gameplay light: communicates objective, hazard, path, or state.

Every light should have one primary role.

## Ratios before counts

The relation between key and fill matters more than adding many lights. Reduce ambient flattening before increasing key intensity. Use environment lighting for coherent reflections and broad fill.

## Color temperature

Use warm/cool contrast to separate planes and imply sources. Avoid arbitrary rainbow lighting. A practical’s color, nearby bounce, material response, atmosphere, and grade should agree.

## Exposure and tone mapping

1. Establish plausible material/light ranges.
2. Select tone mapping.
3. Adjust exposure to preserve focal highlights and readable shadows.
4. Tune lights/materials.
5. Add grading last.

Increasing exposure cannot fix missing light direction. Crushing blacks cannot create depth.

## Depth

Create depth through multiple cues:

- overlap and size;
- perspective/parallax;
- value and saturation;
- sharpness/detail density;
- atmosphere/aerial perspective;
- light direction across planes;
- motion rate.

Atmosphere should increase with distance and density, not uniformly veil the image.

## Production insight

Real-Time Samurai Cinema frames lighting, atmosphere, and tone mapping as a combined production system. Translate engine-specific techniques into Three.js-compatible layers: directional light and shadow, environment/ambient basis, height/distance fog, graded output, and carefully budgeted volumetrics.

## Failure modes

- random colored lights: no source hierarchy;
- all planes equally bright: fill/environment too strong;
- highlights clip everywhere: exposure/material roughness/light range mismatch;
- subject only readable through rim: base value and key insufficient;
- fog removes scale: near density too high or color/value wrong.

## Source basis

- [Filament rendering notes](https://google.github.io/filament/main/filament.html)
- [Real-Time Samurai Cinema](https://advances.realtimerendering.com/s2021/jpatry_advances2021/index.html)
