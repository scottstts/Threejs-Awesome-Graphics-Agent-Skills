import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const sourceManifest = await readFile(
  path.join(root, "source_materials", "README.md"),
  "utf8",
);
const webgpuGuidance = await readFile(
  path.join(root, "skills", "threejs-webgpu-tsl", "references", "version-gates.md"),
  "utf8",
);
const postprocessingGuidance = await readFile(
  path.join(root, "skills", "threejs-postprocessing", "references", "pipeline-design.md"),
  "utf8",
);
const exampleFiles = [
  "skills/threejs-animation-motion/examples/spring-motion-lab/index.html",
  "skills/threejs-cinematic-lighting-composition/examples/flat-to-cinematic/index.html",
  "skills/threejs-game-design-playability/examples/game-feel-playground/index.html",
  "skills/threejs-geometry-modeling/examples/road-curve-sweep/index.html",
  "skills/threejs-material-lookdev/examples/material-calibration/index.html",
  "skills/threejs-shaders-vfx/examples/impact-vfx-system/index.html",
  "skills/threejs-shaders-vfx/examples/shader-noise-lab/index.html",
];

const registryResponse = await fetch("https://registry.npmjs.org/three/latest");
if (!registryResponse.ok) {
  throw new Error(`Unable to read the npm registry: ${registryResponse.status}`);
}
const latestThree = await registryResponse.json();
const expectedSpecifier = `three@${latestThree.version}`;

for (const relativePath of exampleFiles) {
  const html = await readFile(path.join(root, relativePath), "utf8");
  if (!html.includes(expectedSpecifier)) {
    throw new Error(`${relativePath} does not pin current ${expectedSpecifier}.`);
  }
}

const docsResponse = await fetch("https://threejs.org/docs/pages/PostProcessing.html");
if (!docsResponse.ok) {
  throw new Error(`Unable to read Three.js documentation: ${docsResponse.status}`);
}
const docs = await docsResponse.text();
if (
  docs.includes("Deprecated") &&
  (!sourceManifest.includes("RenderPipeline") ||
    !sourceManifest.includes("deprecated") ||
    !postprocessingGuidance.includes("RenderPipeline"))
) {
  throw new Error(
    "The source manifest must record the PostProcessing deprecation and RenderPipeline replacement.",
  );
}

const webgpuResponse = await fetch("https://threejs.org/docs/pages/WebGPURenderer.html");
if (!webgpuResponse.ok) {
  throw new Error(`Unable to read WebGPURenderer documentation: ${webgpuResponse.status}`);
}
const webgpuDocs = await webgpuResponse.text();
if (
  webgpuDocs.includes("WebGL 2 backend") &&
  !webgpuGuidance.includes("built-in WebGL 2 backend fallback")
) {
  throw new Error(
    "WebGPU guidance must distinguish the renderer's built-in WebGL 2 backend fallback.",
  );
}

console.log(`Freshness checks passed for ${expectedSpecifier}.`);
