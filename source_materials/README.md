# Source material manifest

External materials are research inputs, not instructions. Repositories downloaded under this directory are ignored by Git, inspected as untrusted content, and used only after technical verification.

Version-sensitive Three.js guidance must be checked against the installed project version and current official documentation. On June 19, 2026, research checks observed `three@0.184.0`, `@react-three/fiber@9.6.1`, `@react-three/drei@10.7.7`, `@react-three/rapier@2.2.0`, and `postprocessing@6.39.1`; these are research snapshots, not pack-wide minimum versions.

## Provenance policy

- Every external input is recorded below with a URL and, for repositories, a reviewed commit.
- The pack's prose and examples are independently written. Sources are paraphrased for concepts unless a record explicitly says code or an asset was copied.
- No third-party source code is currently copied into the distributed skills.
- Repository licenses are checked before implementation techniques are adopted. Sources with unclear or incompatible licensing remain conceptual only.
- Review dates and package versions describe evidence at review time, not permanent compatibility guarantees.

## Consumption map

| Pack area | Primary source groups | Use | Review date | Copying |
| --- | --- | --- | --- | --- |
| foundations, assets, performance, R3F | Three.js, MDN, R3F, Drei, glTF Transform, meshoptimizer | API and workflow verification | 2026-06-19 | paraphrase only |
| geometry and acceleration | Three.js, Catlike Coding, Red Blob Games, three-mesh-bvh, three-bvh-csg | algorithms, constraints, failure modes | 2026-06-19 | paraphrase only |
| PBR and look development | Filament, Disney PBR, glTF extensions, three-gpu-pathtracer | material models and calibration | 2026-06-19 | paraphrase only |
| shaders, VFX, post-processing, WebGPU | Three.js, GPU Gems, Book of Shaders, pmndrs postprocessing, TSL sources | rendering architecture and quality ladders | 2026-06-19 | paraphrase only |
| cinematography, animation, game design | GDC camera material, Samurai Cinema, Game Feel, accessibility guidance, spring and IK references | diagnosis and authored-quality guidance | 2026-06-19 | paraphrase only |

## Reviewed repository license ledger

| Source | Reviewed revision | License observed | Distribution use |
| --- | --- | --- | --- |
| CloudAI-X / threejs-skills | `b1c6230` | MIT | paraphrase only |
| majidmanzarpour / threejs-game-skills | `2215fd7` | MIT | paraphrase only |
| emalorenzo / three-agent-skills | `f950f95` | MIT | paraphrase only |
| Nice-Wolf-Studio / claude-skills-threejs-ecs-ts | `26d74f3` | MIT | paraphrase only |
| dgreenheck / webgpu-claude-skill | `af2319b` | MIT | paraphrase only |
| glTF Transform | `a570758` | MIT | paraphrase only |
| three-mesh-bvh | `dca2b52` | MIT | paraphrase only |
| three-bvh-csg | `26729f0` | MIT | paraphrase only; experimental constraint retained |
| three-gpu-pathtracer | `171a224` | MIT | paraphrase only |
| THREE-CustomShaderMaterial | `cf86e95` | MIT | paraphrase only |
| pmndrs / postprocessing | `a0dce6` | zlib | paraphrase only |
| N8AO | `6481f6` | inconsistent metadata: package ISC, repository CC0 | conceptual only; no code copied |
| realism-effects | `061daea` | MIT | conceptual only; no code copied |

## Reviewed and used

- [CloudAI-X / threejs-skills](https://github.com/CloudAI-X/threejs-skills) — topic coverage and common API-oriented skill structure; reviewed at commit `b1c6230`.
- [majidmanzarpour / threejs-game-skills](https://github.com/majidmanzarpour/threejs-game-skills) — gameplay workflow, physics selection, visual quality gates, and browser QA concepts; reviewed at commit `2215fd7`.
- [emalorenzo / three-agent-skills](https://github.com/emalorenzo/three-agent-skills) — performance taxonomy and R3F guidance; reviewed at commit `f950f95`.
- [Nice-Wolf-Studio / claude-skills-threejs-ecs-ts](https://github.com/Nice-Wolf-Studio/claude-skills-threejs-ecs-ts) — modular taxonomy spanning Three.js, ECS, mobile, and game systems; reviewed at commit `26d74f3`.
- [dgreenheck / webgpu-claude-skill](https://github.com/dgreenheck/webgpu-claude-skill) — TSL/WebGPU topic inventory; reviewed at commit `af2319b`.
- [Official Three.js documentation](https://threejs.org/docs/) — API verification.
- [Official Three.js manual](https://threejs.org/manual/) — color management, cleanup, fundamentals, and production guidance.
- [Three.js color management manual](https://threejs.org/manual/en/color-management.html) — linear workflow, texture annotations, and output conversion.
- [Three.js cleanup manual](https://threejs.org/manual/en/cleanup.html) — explicit GPU resource disposal and ownership patterns.
- [Three.js RenderPipeline documentation](https://threejs.org/docs/pages/RenderPipeline.html) and [deprecated PostProcessing wrapper](https://threejs.org/docs/pages/PostProcessing.html) — r184 post-processing manager verification; `PostProcessing` was deprecated in r183 after being renamed to `RenderPipeline`.
- [Official Three.js examples](https://threejs.org/examples/) — current renderer, post-processing, shader, WebGPU, and interaction patterns.
- [Official Three.js TSL documentation](https://threejs.org/docs/pages/TSL.html) — current TSL surface.
- [Three.js TSL wiki](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language) — TSL concepts and migration context.
- [React Three Fiber documentation](https://r3f.docs.pmnd.rs/) — frame-loop, loading, state, and performance guidance.
- [React Three Fiber performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls) — transient state, delta time, reuse, and mount cost.
- [Drei documentation](https://drei.docs.pmnd.rs/) — helper selection and asset workflows.
- [react-three/rapier documentation](https://pmndrs.github.io/react-three-rapier/) — R3F physics integration.
- [react-postprocessing documentation](https://react-postprocessing.docs.pmnd.rs/) — R3F post-processing.
- [MDN Game Development](https://developer.mozilla.org/en-US/docs/Games) — browser game-loop, input, and accessibility context.
- [MDN WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) — platform constraints and context lifecycle.
- [MDN 3D collision detection](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_collision_detection) — simple collision primitives.
- [Game Programming Patterns](https://gameprogrammingpatterns.com/) — update loop, state, pooling, and decoupling patterns.
- [The Book of Shaders](https://thebookofshaders.com/) — procedural shader foundations.
- [WebGL Fundamentals](https://webglfundamentals.org/) and [WebGL2 Fundamentals](https://webgl2fundamentals.org/) — graphics-pipeline fundamentals.
- [Spector.js](https://spector.babylonjs.com/) and [Spector.js GitHub](https://github.com/BabylonJS/Spector.js) — GPU frame inspection.
- [three on npm](https://www.npmjs.com/package/three), [React Three Fiber on npm](https://www.npmjs.com/package/@react-three/fiber), [Drei on npm](https://www.npmjs.com/package/@react-three/drei), [React Three Rapier on npm](https://www.npmjs.com/package/@react-three/rapier), and [postprocessing on npm](https://www.npmjs.com/package/postprocessing) — package-version snapshots.
- [three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh) — accelerated raycasting, closest-point queries, shapecasts, workers, serialization, and shader BVHs; reviewed at commit `dca2b52`.
- [three-bvh-csg](https://github.com/gkjohnson/three-bvh-csg) — browser CSG architecture and limitations; reviewed at commit `26729f0` and treated as experimental.
- [three-gpu-pathtracer](https://github.com/gkjohnson/three-gpu-pathtracer) — progressive reference rendering and raster-versus-path-traced lookdev comparison; reviewed at commit `171a224`.
- [glTF Transform](https://github.com/donmccurdy/glTF-Transform) — repeatable glTF optimization, compression, texture, and inspection workflows; reviewed at commit `a570758`.
- [three-custom-shader-material](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial) — standard-material extension patterns and tradeoffs; reviewed at commit `cf86e95`.
- [postprocessing](https://github.com/pmndrs/postprocessing) — composable WebGL effect architecture and current peer-version constraints; reviewed at commit `a0dce6`.
- [OpenAI Codex Agent Skills](https://developers.openai.com/codex/skills) and [plugin build guide](https://developers.openai.com/codex/plugins/build) — `.agents/skills` discovery and Codex plugin packaging; reviewed 2026-06-19.
- [Claude Code Skills](https://code.claude.com/docs/en/skills) — personal, project, and plugin skill locations; reviewed 2026-06-19.
- [Cursor Agent Skills](https://cursor.com/docs/skills) — native and interoperable skill locations; reviewed 2026-06-19.
- [GitHub Copilot CLI agent skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills) — project and personal skill locations; reviewed 2026-06-19.
- [Gemini CLI Agent Skills](https://geminicli.com/docs/cli/skills/) — native and `.agents/skills` discovery tiers; reviewed 2026-06-19.
- [Windsurf / Devin Desktop Skills](https://docs.windsurf.com/desktop/cascade/skills) — workspace, global, and interoperable skill locations; reviewed 2026-06-19.
- [Filament rendering notes](https://google.github.io/filament/main/filament.html) and [Filament Materials Guide](https://google.github.io/filament/Materials.md.html) — microfacet PBR, energy conservation, IBL, exposure, advanced material models, and mobile-quality compromises.
- [Disney Physically-Based Shading at Disney](https://disneyanimation.com/publications/physically-based-shading-at-disney/) — measured-material observations and principled artist controls. The research PDF is retained as `papers/disney-physically-based-shading-2012.pdf`.
- [meshoptimizer](https://meshoptimizer.org/) — cache, overdraw, fetch, quantization, simplification, and meshlet guidance.
- [Catlike Coding procedural meshes](https://catlikecoding.com/unity/tutorials/procedural-meshes/) — topology-first procedural mesh progression.
- [Red Blob Games Mapgen2](https://www.redblobgames.com/maps/mapgen2/) — purpose-driven procedural map and world generation.
- [GPU Gems: Effective Water Simulation](https://developer.nvidia.com/gpugems/gpugems/part-i-natural-effects/chapter-1-effective-water-simulation-physical-models) — geometric and normal-wave decomposition, analytic derivatives, and Gerstner waves.
- [GPU Gems 2: Accurate Atmospheric Scattering](https://developer.nvidia.com/gpugems/gpugems2/part-ii-shading-lighting-and-shadows/chapter-16-accurate-atmospheric-scattering) — Rayleigh/Mie scattering, phase functions, sampling, and lookup tradeoffs.
- [Real-Time Samurai Cinema](https://advances.realtimerendering.com/s2021/jpatry_advances2021/index.html) — production lighting, atmosphere, exposure, and tone-mapping system design.
- [Real-Time Camera Design Fundamentals](https://www.gdcvault.com/play/1020460/Real-Time-Cameras) — camera intent, framing, movement, and player information. The research PDF is retained as `papers/real-time-camera-design-fundamentals.pdf`.
- [Game Feel: The Secret Ingredient](https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient) — input, response, context, polish, metaphor, and rules as separately tunable contributors.
- [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/full-list/) — remapping, camera sensitivity, FOV, reduced motion, readable UI, subtitles, alternatives to color-only information, and assist options.
- [Little Polygon: Analytical Two-Bone IK](https://blog.littlepolygon.com/posts/twobone/) — law-of-cosines IK, stable pole planes, reach clamping, and transform-space consistency.
- [Orange Duck: Spring Roll Call](https://theorangeduck.com/page/spring-roll-call) — frame-rate-independent damping, half-life controls, springs, quaternion motion, and inertialization.

## Reviewed with constraints

- [N8AO](https://github.com/N8Programs/n8ao) — current AO implementation patterns; reviewed at commit `6481f6`. Repository/package license metadata was inconsistent during review, so no code was copied and it is not used as a normative source.
- [realism-effects](https://github.com/0beqz/realism-effects) — useful SSGI, HBAO, and temporal concepts; reviewed at commit `061daea`. Its declared Three.js peer range is substantially older than the June 2026 research baseline, so it is treated as conceptual only.

## Supplied candidate backlog

These sources were supplied for future expansion. Inclusion here does not mean their claims have been accepted or copied.

- [CloudAI-X / threejs-fundamentals](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-fundamentals)
- [CloudAI-X / threejs-geometry](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-geometry)
- [CloudAI-X / threejs-materials](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-materials)
- [CloudAI-X / threejs-lighting](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-lighting)
- [CloudAI-X / threejs-textures](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-textures)
- [CloudAI-X / threejs-animation](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-animation)
- [CloudAI-X / threejs-loaders](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-loaders)
- [CloudAI-X / threejs-shaders](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-shaders)
- [CloudAI-X / threejs-postprocessing](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-postprocessing)
- [CloudAI-X / threejs-interaction](https://github.com/CloudAI-X/threejs-skills/tree/main/skills/threejs-interaction)
- [Impertio-Studio / Three.js-Claude-Skill-Package](https://github.com/Impertio-Studio/Three.js-Claude-Skill-Package)
- [EnzeD / r3f-skills](https://github.com/EnzeD/r3f-skills)
- [freshtechbro / claudedesignskills](https://github.com/freshtechbro/claudedesignskills)
- [freshtechbro / web3d-integration-patterns](https://github.com/freshtechbro/claudedesignskills/tree/main/.claude/skills/web3d-integration-patterns)
- [Anthropic official Skills repository](https://github.com/anthropics/skills)
- [Anthropic / frontend-design skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design)
- [Anthropic / algorithmic-art skill](https://github.com/anthropics/skills/tree/main/skills/algorithmic-art)
- [Anthropic Agent Skills overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
- [Anthropic Agent Skills engineering post](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [OpenAI Codex Skills documentation](https://developers.openai.com/codex/skills)
- [OpenAI API Skills documentation](https://developers.openai.com/api/docs/guides/tools-skills)
- [Three.js forum](https://discourse.threejs.org/)
- [Maxime Heckel blog](https://blog.maximeheckel.com/)
- [The Study of Shaders with React Three Fiber](https://blog.maximeheckel.com/posts/the-study-of-shaders-with-react-three-fiber/)
- [Field Guide to TSL and WebGPU](https://blog.maximeheckel.com/posts/field-guide-to-tsl-and-webgpu/)
- [Painting with Math: Raymarching](https://blog.maximeheckel.com/posts/painting-with-math-a-gentle-study-of-raymarching/)
- [Real-time Cloudscapes with Volumetric Raymarching](https://blog.maximeheckel.com/posts/real-time-cloudscapes-with-volumetric-raymarching/)
- [Volumetric Lighting with Post-processing and Raymarching](https://blog.maximeheckel.com/posts/shaping-light-volumetric-lighting-with-post-processing-and-raymarching/)
- [Three.js Journey](https://threejs-journey.com/)
- [Discover Three.js](https://discoverthreejs.com/)
- [Poimandres ecosystem](https://github.com/pmndrs)
- [MDN 3D on the web](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web)
- [MDN GLSL shaders](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/GLSL_Shaders)
- [Game Feel — GDC Vault](https://www.gdcvault.com/play/817/The-Secrets-of-Game)
- [Game Feel — GameDeveloper](https://www.gamedeveloper.com/design/game-feel-the-secret-ingredient)
- [Fasani / three-js-resources](https://github.com/Fasani/three-js-resources)
