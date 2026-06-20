import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const sourceManifest = await readFile(
  path.join(root, "source_materials", "README.md"),
  "utf8",
);
const imagePipeline = await readFile(
  path.join(root, "skills", "threejs-image-pipeline", "SKILL.md"),
  "utf8",
);
const materialGuidance = await readFile(
  path.join(
    root,
    "skills",
    "threejs-procedural-materials",
    "references",
    "procedural-pbr-system.md",
  ),
  "utf8",
);

const registryResponse = await fetch("https://registry.npmjs.org/three/latest");
if (!registryResponse.ok) {
  throw new Error(`Unable to read the npm registry: ${registryResponse.status}`);
}
const latestThree = await registryResponse.json();

for (const url of [
  "https://threejs.org/docs/pages/RenderPipeline.html",
  "https://threejs.org/docs/pages/TSL.html",
]) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Unable to read current Three.js documentation: ${url}`);
  }
}

if (
  !sourceManifest.includes("version-sensitive") &&
  !sourceManifest.includes("Version-sensitive")
) {
  throw new Error("Source ledger must state that Three.js API syntax is version-sensitive.");
}
if (!sourceManifest.includes("not a package-wide minimum")) {
  throw new Error("Research snapshot must not be presented as a package minimum.");
}
if (
  !sourceManifest.includes("RenderPipeline") ||
  !sourceManifest.includes("deprecated in r183")
) {
  throw new Error("Source ledger must record the RenderPipeline migration.");
}
if (!imagePipeline.includes("$threejs-bloom")) {
  throw new Error("Image-pipeline integration must route to atomic post skills.");
}
if (!materialGuidance.includes("supported node/material hooks")) {
  throw new Error("Material guidance must preserve version-sensitive renderer hooks.");
}

console.log(
  `Freshness checks passed. npm currently reports three@${latestThree.version}; target projects must still be inspected before choosing APIs.`,
);
