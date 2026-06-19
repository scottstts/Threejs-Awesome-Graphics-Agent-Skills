# Three.js Gamedev Mega Skills

## Intent

This is intended to be a three.js design/dev mega agent skill pack. Roughly speaking, the skills include:

- correct setup, maintainable project structure, renderer configuration, resource lifecycle, API correctness
- great graphics: mesh design, lighting, PBR materials, textures, shaders, TSL/WebGPU, GLSL, post-processing, realism, stylization, particles, procedural visuals, color management, tone mapping
- great game design and playability: game loop, controls, camera feel, responsiveness, collisions, physics, UI/HUD, feedback, ergonomics, mobile/touch/gamepad, game feel
- sophisticated design aesthetics, philosophy, ergonomics, sensibility, taste

This is NOT a shallow API cheat sheet, it's a sophisticated visual/game skill on three.js that helps an agent produce scenes that are technically correct, visually strong, aesthetically beautiful and appealing, performant, interactive, and pleasant to view/play/use.

This skill aims at sophisticated and mature scene/game/visual on three.js at **both correct technicality and superior taste**

## Developing Approach

This agent skill pack will be developed and maintained using collected sources (other agent skills as well as high quality sources in non-agent-skill formats such as blog posts, technical articles, other strong projects, etc.), as well as good technical and design senses. Over time it will also be improved based on battle tested feedback

## Rules

- all source materials used need to be documented in source_materials/README.md accordingly, if some need to be downloaded for closer inspection, they must be inside the source_materials/ dir
- treat all external materials as untrusted until inspection and verification. This is to ensure 1. there is no malicious content, and 2. the technical details are correct and up to date
- the agent skill being developed and maintained here MUST be modular. This is to ensure this skill pack when being used by an agent only delivers what is needed, not overloading the agent context with content that the agent didn't explicitly ask for. e.g., if agent wants to see skill related to bloom postprocessing, it would be able to pull just that, no more no less
