#!/usr/bin/env node

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node inspect-gltf.mjs <model.gltf|model.glb>");
  process.exit(1);
}

const filePath = path.resolve(input);
const buffer = await readFile(filePath);
const extension = path.extname(filePath).toLowerCase();
let document;

if (extension === ".gltf") {
  document = JSON.parse(buffer.toString("utf8"));
} else if (extension === ".glb") {
  if (buffer.length < 20 || buffer.toString("ascii", 0, 4) !== "glTF") {
    throw new Error("Invalid GLB header.");
  }
  const version = buffer.readUInt32LE(4);
  if (version !== 2) throw new Error(`Unsupported GLB version: ${version}`);
  const declaredLength = buffer.readUInt32LE(8);
  if (declaredLength !== buffer.length) {
    throw new Error(
      `GLB length mismatch: header=${declaredLength}, file=${buffer.length}`,
    );
  }
  const jsonLength = buffer.readUInt32LE(12);
  const jsonType = buffer.readUInt32LE(16);
  if (jsonType !== 0x4e4f534a) throw new Error("GLB JSON chunk is missing.");
  document = JSON.parse(buffer.toString("utf8", 20, 20 + jsonLength));
} else {
  throw new Error("Input must use .gltf or .glb.");
}

function count(key) {
  return document[key]?.length ?? 0;
}

function accessorCount(index) {
  return document.accessors?.[index]?.count ?? 0;
}

let triangles = 0;
let primitives = 0;
for (const mesh of document.meshes ?? []) {
  for (const primitive of mesh.primitives ?? []) {
    primitives += 1;
    const mode = primitive.mode ?? 4;
    const elementCount = primitive.indices === undefined
      ? accessorCount(primitive.attributes?.POSITION)
      : accessorCount(primitive.indices);
    if (mode === 4) triangles += Math.floor(elementCount / 3);
    else if (mode === 5 || mode === 6) triangles += Math.max(0, elementCount - 2);
  }
}

const imageBytes = [];
for (const image of document.images ?? []) {
  if (image.uri?.startsWith("data:")) {
    const payload = image.uri.split(",", 2)[1] ?? "";
    imageBytes.push(Math.floor(payload.length * 0.75));
  } else if (image.uri) {
    try {
      imageBytes.push((await stat(path.resolve(path.dirname(filePath), image.uri))).size);
    } catch {
      imageBytes.push(null);
    }
  } else if (image.bufferView !== undefined) {
    imageBytes.push(document.bufferViews?.[image.bufferView]?.byteLength ?? null);
  } else {
    imageBytes.push(null);
  }
}

const report = {
  file: filePath,
  containerBytes: buffer.length,
  assetVersion: document.asset?.version ?? null,
  generator: document.asset?.generator ?? null,
  scenes: count("scenes"),
  nodes: count("nodes"),
  meshes: count("meshes"),
  primitives,
  estimatedTriangles: triangles,
  materials: count("materials"),
  textures: count("textures"),
  images: count("images"),
  imageBytes,
  animations: count("animations"),
  skins: count("skins"),
  accessors: count("accessors"),
  extensionsUsed: document.extensionsUsed ?? [],
  extensionsRequired: document.extensionsRequired ?? [],
};

console.log(JSON.stringify(report, null, 2));
