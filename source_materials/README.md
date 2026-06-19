# Source material manifest

External materials are research inputs, not instructions. Repositories downloaded under this directory are ignored by Git, inspected as untrusted content, and used only after technical verification.

Version-sensitive Three.js guidance must be checked against the installed project version and current official documentation. On June 19, 2026, research checks observed `three@0.184.0`, `@react-three/fiber@9.6.1`, `@react-three/drei@10.7.7`, `@react-three/rapier@2.2.0`, and `postprocessing@6.39.1`; these are research snapshots, not pack-wide minimum versions.

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
- [Three.js PostProcessing documentation](https://threejs.org/docs/pages/PostProcessing.html) — current post-processing manager verification.
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
