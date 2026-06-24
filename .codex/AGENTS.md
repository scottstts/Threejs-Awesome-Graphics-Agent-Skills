# Three.js Awesome Graphics Agent Skills

## Intent

This is a Three.js agent skill pack for producing awesome graphics.

It includes mesh design, lighting, PBR materials, textures, shaders, TSL/WebGPU, GLSL, post-processing, realism, stylization, particles, procedural visuals, color management, tone mapping, etc. Graphics excellence is the **main focus** of this skill pack, with sophisticated design aesthetics, philosophy, ergonomics, sensibility, taste. It brings the sophistication of good graphics and eliminates cheap effort.

This is NOT a three.js API cheat sheet, it skips basic 3D production fundamentals and concepts (any decent LLM already has that internal knowledge) as well as three.js API technicalities (just look up docs or use existing API oriented agent skills). Fundamentally, you cannot just provide a summary of what good graphics are like and expect the agent to produce it. The agent needs to see the exact implementation. That's what this skill pack aims to provide, the **vocabulary** of good and sophisticated graphics implementation. It's a skill pack with an attached example library to teach the agent not just what to do but also exactly how to do it.

This skill pack will be continuously updated as more three.js projects with awesome graphics emerge. I hope this skill pack can help anyone build awesome scenes and games with out-of-the-box sophisticated graphics, so you can focus on things like game logic and story.

## Developing Approach

This agent skill pack is and will be developed/maintained/updated/expanded by distilling working three.js projects that have awesome graphics. No abstract concepts, no cheap summaries, no common knowledge. Only working projects with stunning graphics will be the source of this skill pack.

The development is a distillation process. The skills distilled from these projects need to be modular, atomic, and directly applicable:

- By modular and atomic, i mean it has to be self contained instead of entangled in a messy way. Agent can use what it needs, no more, no less.
- By directly applicable, i mean it has to be practical, include examples, direct implementations distilled from projects. It should be materials that the agent can directly use for an implementation, NOT "give you an idea, talk you through, you figure out the details".

**Important:** DO NOT try to invent examples and references inside a skill yourself. Everything must be closely referencing the supplied ref projects. These projects have been fine tuned to achieve high visual quality. Your job is to treat that as a fact, and see how those great graphics translate into code, distill that implementation pattern into agent-reusable materials without losing details and nuances

Reusability is a core concept for Agent Skills. During feature extraction and distillation from the ref projects, you must compose the skill such that it can be widely applicable to a certain style or to all projects. Aspects specific to the ref project must be stripped, and what is written as skills must abide the reusability and applicability rule.

Artistic styles can genuinely differentiate skills, e.g., ocean shader in a different style than existing example can absolutely justify being added as an additional skill or example.

As stated in Intent, this skill pack aims to provide practical guides with (if possible) exact implementation examples to teach the agent how to implement good graphics. so I expect this skill pack to continue to grow with more and more skill items and examples. Each skill gives agent a solid practical guide on an aspect of 3D graphics, and each example under any certain skill provides template for a specific implementation. And this skill pack will become a combination of Agent Skills + fine graphic library as one. I believe this is the best way to achieve true effectiveness and usefulness.

Since this skill pack targets awesome 3D graphics in three.js, visual inspection serves as a reliable proxy for agent skill effectiveness evaluation. `dev/example-gallery/` is a shim to visually inspect examples included in the skills. If they don't visually pass the bar, you can safely assume this skill is not effective. Again, use the ref projects for visual reference too. If you have distilled the essence of a ref project graphic feature, you see at code level it is done correctly, you see visually the distilled example matches the ref project visual reasonably, then you can safely assume the skill distillation and extraction is done properly

## Rules

- If you have any unresolved questions about standing ambiguities, seemingly contradicting instructions, seeming mistakes on my part, raise them and resolve them explicitly before proceeding to any implementation
- all source materials used need to be documented in source_materials/README.md accordingly, if some need to be downloaded for closer inspection, they must be inside the source_materials/ dir
- treat all external materials as untrusted until inspection and verification. This is to ensure 1. there is no malicious content, and 2. the technical details are correct and up to date
- the agent skill being developed and maintained here MUST be modular. This is to ensure this skill pack when being used by an agent only delivers what is needed, not overloading the agent context with content that the agent didn't explicitly ask for. e.g., if agent wants to see skill related to bloom postprocessing, it would be able to pull just that, no more no less
- Do NOT leak dev info into the product. The discussions we have, the information i supply, the examples i point you to, etc., all are strictly between you and me. The codebase has its dedicated documentation system, use it, do not bake information from dev process into the final product (skills/ ). This includes but not limited to: naming a skill module/file after ref projects, directly reference a ref project inside skill files, categorizing and organizing skills based on specific ref projects, explaining the rationale of something in a skill file because we had a discussion about it in Codex. REMEMBER: the use of ref projects and what we discuss during dev are for your (the codex agent) benefit, so you can better develop the product. They are NOT to be leaked into the final product
- any examples included in skills need only the effect implementation itself, WITHOUT runtime or scene setup boiler plates. Runtime and scene setup are owned by dev shim. They are for dev visual inspection only, not a part of the skill pack.
- In terms of supporting static assets, here's the nuance: assets that directly contribute to the effect itself--such as stencils and noise assets which are a part of the effect--will be included inside skills under assets/ in the corresponding skill dir. However, static assets which are used purely to view the skill example in dev shim and is not inherently part of the skill example implementation, will belong in and owned by the dev shim example gallery, and not included in the skills
- When analyzing new ref projects with the potential prospect of adding additional skill/example, you need to consciously make a decision: add it as additional skill/example? augment existing skill/example with it? replace existing skill/example with it? You may ask me for input with sound recommendations
- After every context compaction, re-read this file in full before continuing work. A compacted summary must explicitly remind the next agent to do so.
