import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import {
  captureRendererSnapshot,
} from "../skills/threejs-performance-profiling/scripts/capture-renderer-snapshot.js";

const execFileAsync = promisify(execFile);
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "threejs-skill-scripts-"));
const gltfPath = path.join(temporaryRoot, "triangle.gltf");
await writeFile(gltfPath, JSON.stringify({
  asset: { version: "2.0", generator: "threejs-gamedev-mega-skills-test" },
  accessors: [{ count: 3, type: "VEC3", componentType: 5126 }],
  meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
  nodes: [{ mesh: 0 }],
  scenes: [{ nodes: [0] }],
  scene: 0,
}));

const inspector = await execFileAsync(process.execPath, [
  "skills/threejs-asset-pipeline/scripts/inspect-gltf.mjs",
  gltfPath,
]);
const report = JSON.parse(inspector.stdout);
if (
  report.meshes !== 1 ||
  report.primitives !== 1 ||
  report.estimatedTriangles !== 1
) {
  throw new Error("glTF inspector returned incorrect counts.");
}

const renderer = {
  info: {
    frame: 6,
    memory: { geometries: 2, textures: 3 },
    programs: [{}],
    render: { calls: 4, triangles: 5 },
  },
  getPixelRatio: () => 2,
  outputColorSpace: "srgb",
  shadowMap: { enabled: true },
  toneMapping: 1,
};
const snapshot = captureRendererSnapshot(renderer);
if (
  snapshot.render.calls !== 4 ||
  snapshot.memory.textures !== 3 ||
  snapshot.programs !== 1
) {
  throw new Error("Renderer snapshot helper returned incorrect values.");
}

console.log("Skill script tests passed.");
