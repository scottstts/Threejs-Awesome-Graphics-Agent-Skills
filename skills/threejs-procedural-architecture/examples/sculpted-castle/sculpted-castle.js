// Complete sculpted castle keep generator: compiles the massing plan into merged
// material-slot meshes and dual-LOD instanced architectural parts with deterministic diagnostics.
import * as THREE from "three/webgpu";
import { buildCastlePlan, CASTLE_GATE } from "./source/castle-plan.js";
import { Chunk, emitTier, emitDome, gateFace } from "./source/tier-compiler.js";
import { PARTS } from "./source/part-library.js";
import { createCastleMaterials, bakeCarveTexture, DEFAULT_SUN_DIR } from "./source/castle-materials.js";

export { buildCastlePlan, CASTLE_GATE, createCastleMaterials, bakeCarveTexture, DEFAULT_SUN_DIR };
export const LOD_NEAR = 120;

const CUSTOM_FACES = { gate: gateFace };
const CHUNK_PALETTE = [0x4c8bf5, 0xe86f52, 0x3eb489, 0xd8a832, 0x9b6bd6];

function writerToGeometry(W) {
  const a = W.arrays();
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(a.position, 3));
  g.setAttribute("normal", new THREE.BufferAttribute(a.normal, 3));
  g.setAttribute("tint", new THREE.BufferAttribute(a.tint, 1));
  g.setAttribute("carve", new THREE.BufferAttribute(a.carve, 3));
  g.setIndex(new THREE.BufferAttribute(a.index, 1));
  return g;
}

function buildPartGeometries() {
  const partGeos = {};
  for (const key in PARTS) {
    partGeos[key] = [0, 1].map((lod) => {
      const built = PARTS[key](lod);
      const out = {};
      for (const slot in built) {
        if (built[slot].tris) out[slot] = writerToGeometry(built[slot]);
      }
      return out;
    });
  }
  return partGeos;
}

/** Compile a castle plan into material-slot chunks (pure JS geometry arrays + instance matrices). */
export function buildCastleChunks(plan = buildCastlePlan()) {
  const map = new Map();
  const get = (id) => {
    let c = map.get(id);
    if (!c) map.set(id, (c = new Chunk(id)));
    return c;
  };
  for (const item of plan) {
    const c = get(item.chunk);
    if (item.t === "tier") {
      const faces = item.faces.map((f) => (f && f.kind ? { ...f, custom: CUSTOM_FACES[f.kind] } : f));
      emitTier(c, { ...item, faces });
    } else if (item.t === "dome") {
      emitDome(c, item);
    }
  }
  return [...map.values()];
}

/** Update per-chunk instanced part LOD visibility with hysteresis around LOD_NEAR. */
export function updateCastleLOD(groups, cameraPosition, forceLOD = -1) {
  for (const g of groups) {
    const u = g.userData;
    const d = u.box.distanceToPoint(cameraPosition);
    const lod = forceLOD >= 0 ? forceLOD : d < (u.lod === 0 ? LOD_NEAR * 1.1 : LOD_NEAR) ? 0 : 1;
    if (lod !== u.lod) {
      u.lod = lod;
      for (const m of u.near) m.visible = lod === 0;
      for (const m of u.far) m.visible = lod === 1;
    }
  }
}

/**
 * Build the complete sculpted castle keep into a Three.js Group hierarchy with dual-LOD
 * instanced parts, procedural TSL materials, deterministic topology stats, and diagnostic modes.
 */
export function createSculptedCastle({ aoNode = null, sunDir = DEFAULT_SUN_DIR, materials = null } = {}) {
  const ownsMaterials = !materials;
  const materialBundle = materials ?? createCastleMaterials({ aoNode, sunDir });
  const slotMaterials = materialBundle.slots ?? materialBundle;
  const plan = buildCastlePlan();
  const chunks = buildCastleChunks(plan);
  const partGeometries = buildPartGeometries();

  const root = new THREE.Group();
  root.name = "SCULPTED_CASTLE_KEEP";
  const groups = [];
  const bounds = new THREE.Box3();
  const mergedGeometries = [];
  const chunkBindings = [];
  const chunkDebugMaterials = [];

  let mergedTriangles = 0;
  let totalInstances = 0;
  const partCounts = {};

  for (let idx = 0; idx < chunks.length; idx++) {
    const chunk = chunks[idx];
    const grp = new THREE.Group();
    grp.name = chunk.id;
    const box = new THREE.Box3();
    let chunkTris = 0;
    const bindings = [];

    const chunkColor = new THREE.Color(CHUNK_PALETTE[idx % CHUNK_PALETTE.length]);
    const chunkMergedMat = new THREE.MeshStandardNodeMaterial({ color: chunkColor, roughness: 0.72, metalness: 0.05 });
    const chunkInstMat = new THREE.MeshStandardNodeMaterial({
      color: chunkColor.clone().lerp(new THREE.Color(0xffffff), 0.42),
      roughness: 0.55,
      metalness: 0.05,
    });
    chunkDebugMaterials.push(chunkMergedMat, chunkInstMat);

    for (const slot in chunk.W) {
      const W = chunk.W[slot];
      if (!W.tris) continue;
      const g = writerToGeometry(W);
      g.computeBoundingBox();
      g.computeBoundingSphere();
      box.union(g.boundingBox);
      mergedGeometries.push(g);
      const mesh = new THREE.Mesh(g, slotMaterials[slot]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      grp.add(mesh);
      bindings.push({ mesh, finalMaterial: slotMaterials[slot], chunkMaterial: chunkMergedMat });
      chunkTris += W.tris;
    }

    const near = [];
    const far = [];
    for (const part in chunk.inst) {
      const arr = new Float32Array(chunk.inst[part]);
      const count = arr.length / 16;
      partCounts[part] = (partCounts[part] ?? 0) + count;
      totalInstances += count;
      for (let l = 0; l < 2; l++) {
        for (const slot in partGeometries[part][l]) {
          const im = new THREE.InstancedMesh(partGeometries[part][l][slot], slotMaterials[slot], count);
          im.instanceMatrix = new THREE.InstancedBufferAttribute(arr, 16);
          im.instanceMatrix.setUsage(THREE.StaticDrawUsage);
          im.castShadow = true;
          im.receiveShadow = true;
          im.matrixAutoUpdate = false;
          im.computeBoundingSphere();
          im.computeBoundingBox();
          box.union(im.boundingBox);
          (l ? far : near).push(im);
          im.visible = l === 1;
          grp.add(im);
          bindings.push({ mesh: im, finalMaterial: slotMaterials[slot], chunkMaterial: chunkInstMat });
        }
      }
    }

    grp.matrixAutoUpdate = false;
    const sph = new THREE.Sphere();
    box.getBoundingSphere(sph);
    grp.userData = { near, far, sph, box, tris: chunkTris, lod: 1 };
    bounds.union(box);
    mergedTriangles += chunkTris;
    groups.push(grp);
    chunkBindings.push(bindings);
    root.add(grp);
  }

  let currentMode = "final";
  function setDebugMode(mode = "final") {
    currentMode = mode;
    const useChunks = mode === "chunk-topology";
    if (materialBundle.uMode) {
      materialBundle.uMode.value = mode === "clay" ? 1 : mode === "recess-tint" ? 2 : 0;
    }
    for (const bindings of chunkBindings) {
      for (const b of bindings) {
        b.mesh.material = useChunks ? b.chunkMaterial : b.finalMaterial;
      }
    }
  }

  const stats = Object.freeze({
    chunkCount: chunks.length,
    tierCount: plan.filter((i) => i.t === "tier").length,
    domeCount: plan.filter((i) => i.t === "dome").length,
    mergedTriangles,
    instanceCount: totalInstances,
    partCounts: Object.freeze(partCounts),
    bounds: Object.freeze({
      min: bounds.min.toArray(),
      max: bounds.max.toArray(),
    }),
  });

  return {
    root,
    chunks: groups,
    materials: slotMaterials,
    bounds,
    stats,
    get debugMode() {
      return currentMode;
    },
    updateLOD(cameraPosition, forceLOD = -1) {
      updateCastleLOD(groups, cameraPosition, forceLOD);
    },
    setDebugMode,
    dispose() {
      for (const g of mergedGeometries) g.dispose();
      for (const key in partGeometries) {
        for (const lodObj of partGeometries[key]) {
          for (const g of Object.values(lodObj)) g.dispose();
        }
      }
      for (const m of chunkDebugMaterials) m.dispose();
      if (ownsMaterials) materialBundle.dispose?.();
    },
  };
}
