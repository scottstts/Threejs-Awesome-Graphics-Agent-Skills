# Visual example gallery

This is repository-level development tooling. It is not distributed as an agent skill.

Run:

```sh
npm run dev:examples
```

The server discovers:

```text
skills/<skill-name>/examples/<example-name>/index.html
skills/<skill-name>/examples/<example-name>/example.json
```

No central manifest is edited when an example is added.

## Example metadata

```json
{
  "title": "Planet Field Stack",
  "description": "Coupled macro terrain, craters, biomes, and procedural normals.",
  "backend": "WebGPU / TSL",
  "techniques": ["tangential domain warp", "crater profiles", "altitude filtering"],
  "defaultViewport": { "width": 1440, "height": 900 },
  "defaultDpr": 1,
  "debugModes": [
    { "value": "final", "label": "Final" },
    { "value": "macro", "label": "Macro height" }
  ],
  "controls": ["pause", "timeScale", "dpr", "capture"],
  "sourceTrace": [
    {
      "source": "stellar",
      "files": [
        "src/game/runtime/solar/bodyMaterial.ts",
        "src/game/runtime/solar/atmosphere.ts"
      ],
      "mechanisms": [
        "tangential sphere-domain warp",
        "shared geological field bundle",
        "shell and post atmosphere handoff"
      ],
      "boundary": "independent-distillation",
      "assets": [
        {
          "sourcePath": "src/app/public/textures/leaves/ash.png",
          "localPath": "assets/ash.png"
        }
      ]
    }
  ]
}
```

`source` must exist in
[`source_materials/trace-manifest.json`](../../source_materials/trace-manifest.json).
Every listed file is checked against the reviewed trace. An unlicensed source
must use the `conceptual-only` boundary. Examples without file-level traceability
fail pack validation.

Import the optional runtime contract:

```js
import {
  exampleRuntime,
} from "/dev/example-gallery/runtime/example-runtime.js"
```

Use it to:

- read and react to pause, DPR, time scale, and debug mode;
- bind a Three.js renderer's pixel ratio;
- scale animation delta;
- report FPS, draw calls, triangles, or active quality tier;
- expose a canvas for capture;
- report runtime errors to the gallery.

An example remains runnable standalone. The runtime becomes a no-op parent bridge when the page is not inside the gallery.

## Gallery self-test

The development fixture is excluded from the normal gallery:

```sh
npm run dev:examples:fixture
```

It verifies the runtime protocol without presenting itself as a skill example.
