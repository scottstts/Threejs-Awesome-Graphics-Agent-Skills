# Visual example gallery

This is repository-level development tooling. It is not distributed as an agent skill.

Run:

```sh
npm run dev:examples
```

Capture all examples or one exact/partial example ID:

```sh
npm run capture:examples
npm run capture:examples -- --example threejs-volumetric-clouds/weather-volume-clouds
npm run capture:examples -- --example weather-volume-clouds --debug density
```

The server discovers development adapters:

```text
dev/example-gallery/examples/<skill-name>/<example-name>/scene.js
dev/example-gallery/examples/<skill-name>/<example-name>/example.json
```

The matching skill example contains only the reusable effect implementation.
The development adapter owns its scene, runtime integration, metadata, and
supporting static assets. No central manifest is edited when an adapter is
added.

## Example metadata

```json
{
  "title": "Procedural Planet Surface",
  "description": "Coupled macro terrain, craters, biomes, and procedural normals.",
  "backend": "WebGPU / TSL",
  "techniques": ["tangential domain warp", "crater profiles", "altitude filtering"],
  "defaultViewport": { "width": 1440, "height": 900 },
  "defaultDpr": 1,
  "debugModes": [
    { "value": "final", "label": "Final" },
    { "value": "macro", "label": "Macro height" }
  ],
  "controls": ["pause", "timeScale", "dpr", "capture"]
}
```

Development provenance belongs in
[`source_materials/example-traces.json`](../../source_materials/example-traces.json),
keyed by the discovered `<skill>/<example>` ID. Source IDs must exist in
[`source_materials/trace-manifest.json`](../../source_materials/trace-manifest.json).
Every listed file and copied asset is validated against the reviewed trace.
Unlicensed sources must use the `conceptual-only` boundary. Development
`example.json` files must not contain repository identities, revisions, or
source paths.

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
