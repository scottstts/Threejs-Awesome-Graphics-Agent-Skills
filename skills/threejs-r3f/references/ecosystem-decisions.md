# Ecosystem decisions

## Drei

Use Drei helpers when they remove tested integration work and their behavior matches the product. Inspect defaults for controls, environments, staging, contact shadows, text, and loaders. Do not combine several staging helpers without understanding their lights and render cost.

## Zustand

Use for shared application/game state with focused selectors. Keep high-frequency transforms transient. Separate persisted preferences from live Three.js objects.

## React postprocessing

Use when the project already uses R3F and the desired effects are supported. Profile effect order, selection, multisampling, and resolution. Keep DOM UI outside the effect chain.

## React Three Rapier

Use for R3F-integrated Rapier ownership. Keep body types, colliders, sensors, collision groups, and fixed-step assumptions explicit. Avoid driving dynamic body transforms through JSX every frame.

## Leva and debug tools

Use for tuning and diagnostics. Gate from production builds or hide behind a deliberate debug mode. Tunable controls should map to meaningful visual or gameplay concepts.

## Native Three.js

Prefer native APIs when a wrapper adds no lifecycle or ergonomics benefit. A mixed R3F/native implementation is valid when ownership remains clear.
