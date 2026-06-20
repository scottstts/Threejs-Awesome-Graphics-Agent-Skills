# Three.js Awesome Graphics Agent Skills

This is intended to be a three.js design/dev mega agent skill pack to produce awesome graphics.

It includes mesh design, lighting, PBR materials, textures, shaders, TSL/WebGPU, GLSL, post-processing, realism, stylization, particles, procedural visuals, color management, tone mapping, etc. Graphics excellence is the **main focus** of this skill pack, with sophisticated design aesthetics, philosophy, ergonomics, sensibility, taste

This is NOT a three.js API cheat sheet, it skips basic 3D production fundamentals (any decent LLM already has that internal knowledge), it also skips three.js API technicalities (just look up docs or use existing API oriented agent skills). This skill pack is meant for agent to produce stunning 3D scenes and graphics that transcend simple demos. It brings the sophistication of good graphics and eliminates cheap effort.

## Operating model

Load `$threejs-skill-router` for a broad visual task, then load only the atomic systems the work actually needs.

Every graphics system is expected to expose:

- deterministic or reproducible inputs;
- named controlling fields and perceptual parameters;
- diagnostic outputs;
- scale, distance, and temporal stability rules;
- an intentional lower-cost mode;
- a no-post baseline that still reads.

## Skills

| Skill | Expertise |
| --- | --- |
| `threejs-skill-router` | Decompose a visual target into the smallest relevant expert systems. |
| `threejs-procedural-fields` | Shared scalar/vector fields, frequency bands, domain warping, causal masks, procedural normals. |
| `threejs-procedural-materials` | Coupled PBR channels, layered identity, wear/wetness, derivative filtering, specular AA. |
| `threejs-procedural-geometry` | Profile sweeps, transported frames, semantic mesh writers, seams, UV density, LOD. |
| `threejs-procedural-vegetation` | Growth hierarchies, branch-ring geometry, stratified children, foliage normals, wind. |
| `threejs-procedural-architecture` | Massing and façade grammars, exposed-edge analysis, modules, material-slot compilation. |
| `threejs-procedural-planets` | Spherical terrain, ridges, craters, biomes, procedural normals, altitude filtering. |
| `threejs-spectral-ocean` | Validated FFT synthesis, spectral cascades, choppy derivatives, Jacobian foam, ocean shading. |
| `threejs-water-optics` | Analytic waves, stable normals, depth thickness, absorption, reflection/refraction, foam. |
| `threejs-atmosphere-aerial-perspective` | Shared Rayleigh/Mie atmosphere, sky, shell/post handoff, depth-based scattering. |
| `threejs-volumetric-clouds` | Weather-shaped density, bounded raymarching, cloud lighting, history, cloud shadows. |
| `threejs-raymarched-space-effects` | Curved-ray integration, black holes, accretion disks, wormholes, bounded quality. |
| `threejs-procedural-vfx` | Event envelopes, particles, trails, plasma, distortion, pooling, HDR emission. |
| `threejs-stylized-shader-transitions` | Holograms, dissolves, reveal fields, scanlines, glitch bands, depth/blend behavior. |
| `threejs-temporal-surfaces` | Ping-pong accumulation for frost, wetness, paint, trails, damage, and interaction fields. |
| `threejs-shadow-systems` | Stable cascades and cached clipmap shadows with update budgets and invalidation. |
| `threejs-screen-space-ambient-occlusion` | GTAO-style horizon sampling, bent normals, bilateral and temporal reconstruction. |
| `threejs-bloom` | HDR extraction, multi-scale filtering, selective contribution, exposure coupling. |
| `threejs-exposure-color-grading` | Luminance metering, eye adaptation, tone mapping, LUTs, gamut and output conversion. |
| `threejs-image-pipeline` | Shared render-signal ownership and ordering across multiple image-space systems. |
| `threejs-visual-validation` | Fixed-view captures, diagnostic mosaics, seed/scale sweeps, temporal and GPU evidence. |

## Examples of use

```text
Use $threejs-skill-router to decompose and build a procedural ocean planet
with a ground-to-orbit camera.
```

```text
Use $threejs-procedural-vegetation to build a deterministic tree species
with coherent branching, bark scale, foliage normals, and hierarchical wind.
```

```text
Use $threejs-bloom to diagnose the HDR signal and tune bloom without making
the glow carry the underlying form.
```

```text
Use $threejs-visual-validation to produce a deterministic evidence set for
this procedural material across camera distance, seeds, motion, and quality tiers.
```

## Install

The published package name and installer command remain `threejs-gamedev-mega-skills` for compatibility.

```sh
# User-wide installation
npx threejs-gamedev-mega-skills install --agent codex
npx threejs-gamedev-mega-skills install --agent claude-code
npx threejs-gamedev-mega-skills install --agent cursor

# Project installation
npx threejs-gamedev-mega-skills install --agent github-copilot --scope project

# Any custom-built agent
npx threejs-gamedev-mega-skills install --agent custom --path ~/.my-agent/skills
```

Supported targets:

| Target | User scope | Project scope |
| --- | --- | --- |
| `universal` | `~/.agents/skills` | `.agents/skills` |
| `codex` | `~/.agents/skills` | `.agents/skills` |
| `claude-code` | `~/.claude/skills` | `.claude/skills` |
| `cursor` | `~/.cursor/skills` | `.cursor/skills` |
| `github-copilot` | `~/.copilot/skills` | `.github/skills` |
| `gemini-cli` | `~/.gemini/skills` | `.gemini/skills` |
| `windsurf` | `~/.codeium/windsurf/skills` | `.windsurf/skills` |
| `custom` | exact `--path` | exact `--path` |

Each installation contains the complete pack so its router can reference every atomic skill. Use `--force` to replace an existing installation and `--dry-run` to inspect changes.

```sh
npx threejs-gamedev-mega-skills uninstall --agent cursor
```

## Development

```sh
npm run validate
npm test
npm run check:freshness
npm pack --dry-run
```

Inspect every included graphics example from one development surface:

```sh
npm run dev:examples
```

The gallery discovers examples from each skill automatically and provides
single-example and live-overview modes, viewport/DPR controls, pause/time
controls, debug-mode routing, standalone launch, runtime metrics, and canvas
capture. It is repository tooling and is not installed as an agent skill.

Generate deterministic captures and a contact sheet:

```sh
npm run capture:examples
```

The gallery contract is documented in
[`dev/example-gallery/README.md`](dev/example-gallery/README.md).

Research provenance and license boundaries are recorded in [`source_materials/README.md`](source_materials/README.md). Downloaded research repositories remain ignored under `source_materials/`.
