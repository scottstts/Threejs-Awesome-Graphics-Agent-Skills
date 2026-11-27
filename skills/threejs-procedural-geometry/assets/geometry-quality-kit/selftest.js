/** Run after copying this folder: `node selftest.js`. */
import {
  BufferAttribute,
  BufferGeometry,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
} from "three";
import {
  annularPrism,
  aperturedPrism,
  arcPts,
  bevel,
  beveledPrismMesh,
  bez,
  box,
  ccw,
  chamferRect,
  circle,
  cleanMesh,
  densify,
  faceNormal,
  flatShade,
  hollowPrism,
  insetPoly,
  join,
  loft,
  meshObj,
  offsetPolyline,
  panelWithHoles,
  placeYaw,
  plate,
  polyArea,
  polyOffset,
  prism,
  prismXZ,
  prismYZ,
  recalcNormals,
  revolve,
  rotX,
  rotY,
  rotateZ,
  roundedBox,
  roundedBoxMesh,
  roundedRect,
  runMolding,
  scaleMesh,
  smoothAngleForSegments,
  smoothShade,
  solidify,
  subsurf,
  sweepPlanarLoop,
  sweepRectFrame,
  toGeometry,
  toTriangles,
  toYUp,
  transform4,
  translate,
  tubeAlong,
  wallRun,
  writeAll,
  writeInto,
} from "./procedural-mesh.js";
import {
  auditFaceting,
  auditGeometry,
  auditGroupClearance,
  auditSupport,
} from "./geometry-audit.js";
import { auditMeshData, auditTriangleSoup } from "./mesh-topology-audit.js";
import {
  assertGeometryContract,
  boundsContains,
  boundsGapAlongAxis,
  boundsIntersectionDepth,
  maximumCheck,
  minimumCheck,
  nearCheck,
  predicateCheck,
  rangeCheck,
  runGeometryContract,
} from "./geometry-contract.js";
import {
  buildMergedAssembly,
  buildNamedAuditGroup,
  disposeHierarchy,
} from "./assembly.js";

let checks = 0;
let failures = 0;

function check(name, pass, detail = "") {
  checks++;
  if (pass) return;
  failures++;
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
}

function inspectSolid(name, meshData) {
  const prepared = cleanMesh(meshData.clone());
  const topology = auditMeshData(prepared);
  const emitted = auditTriangleSoup(toTriangles(prepared));
  check(`${name}: topology`, topology.ok, JSON.stringify(topology.issues.slice(0, 3)));
  check(`${name}: emitted triangles`, emitted.triangles > 0, String(emitted.triangles));
  check(`${name}: emitted data`, emitted.ok, JSON.stringify(emitted.issues.slice(0, 3)));
}

function inspectSurface(name, meshData) {
  const prepared = cleanMesh(meshData.clone());
  const topology = auditMeshData(prepared, {
    closed: false,
    maxComponents: 1,
    checkOrientation: false,
  });
  const emitted = auditTriangleSoup(toTriangles(prepared));
  check(`${name}: surface topology`, topology.ok, JSON.stringify(topology.issues.slice(0, 3)));
  check(`${name}: surface emits triangles`, emitted.triangles > 0, String(emitted.triangles));
  check(`${name}: surface emitted data`, emitted.ok, JSON.stringify(emitted.issues.slice(0, 3)));
}

console.log("procedural geometry quality-kit self-test");

inspectSolid("box", box(0, 0, 0, 1, 1, 1));
inspectSolid("rounded box", roundedBoxMesh([0, 0, 0, 1, 0.6, 0.4], 0.05, 2));
inspectSolid(
  "hollow prism",
  hollowPrism(
    roundedRect(0.6, 0.4, 0.05, 3),
    0,
    0.2,
    roundedRect(0.5, 0.3, 0.04, 3),
    0.05,
  ),
);
inspectSolid(
  "apertured prism",
  aperturedPrism(
    roundedRect(1, 0.6, 0.05, 3),
    roundedRect(0.4, 0.3, 0.04, 3),
    0,
    0.04,
    0.006,
    2,
  ),
);
inspectSolid(
  "profile tube",
  tubeAlong(
    [[0, 0, 0], [1, 0, 0], [1, 1, 0]],
    roundedRect(0.05, 0.03, 0.008, 2),
  ),
);
inspectSolid(
  "revolve with welded poles",
  smoothShade(revolve([[0, 0], [0.3, 0.15], [0.4, 0.4], [0.3, 0.65], [0, 0.8]], 16), 40),
);

const unitSquare = [[0, 0], [1, 0], [1, 1], [0, 1]];
inspectSolid("prism", prism(unitSquare, 0, 1));
inspectSolid("prism XZ", prismXZ(unitSquare, 0, 1));
inspectSolid("prism YZ", prismYZ(unitSquare, 0, 1));
inspectSolid(
  "beveled prism",
  beveledPrismMesh(roundedRect(0.4, 0.3, 0.04, 3), 0, 0.06, 0.008, 2),
);
inspectSolid("rounded plate", plate(0, 0, 0.4, 0.3, 0, 0.02));
inspectSolid("panel with aperture", panelWithHoles(1, 1, 0.1, [[0.25, 0.25, 0.75, 0.75]]));
inspectSolid("wall with opening", wallRun([0, 0], [4, 0], 0.2, 0, 2.6, [[1, 2, 0, 2.1]]));
inspectSolid(
  "annular prism",
  annularPrism(circle(0.3, 24), circle(0.2, 24), 0, 0.04, 0.006, 2),
);
inspectSolid(
  "mitred profile tube",
  tubeAlong(densify([[0, 0, 0], [1, 0, 0], [1, 1, 0]], 0.06), circle(0.03, 8), { miter: true }),
);
inspectSolid("swept rectangular frame", sweepRectFrame(1, 0.8, roundedRect(0.04, 0.03, 0.006, 2)));
inspectSolid("swept planar loop", sweepPlanarLoop(circle(1, 16), roundedRect(0.06, 0.05, 0.01, 2)));
inspectSurface("open swept planar path", sweepPlanarLoop([[0, 0], [1, 0], [1, 1]], roundedRect(0.06, 0.05, 0.01, 2), false));
inspectSolid("closed molding", runMolding(circle(1, 12), roundedRect(0.05, 0.04, 0.008, 2), true, true));
inspectSolid("subdivision", subsurf(box(0, 0, 0, 1, 1, 1), 1));
inspectSolid("rounded-box convenience", roundedBox([0, 0, 0, 1, 1, 1], 0.04, 2));
inspectSolid(
  "solidified surface",
  solidify(loft([
    [[0, 0, 0], [1, 0, 0], [2, 0, 0]],
    [[0, 1, 0.1], [1, 1, 0.2], [2, 1, 0.1]],
  ]), 0.02),
);
inspectSurface("open loft", loft([
  [[0, 0, 0], [1, 0, 0], [1, 1, 0]],
  [[0, 0, 1], [1, 0, 1], [1, 1, 1]],
]));

{
  const bad = box(0, 0, 0, 1, 1, 1);
  bad.verts.push([...bad.verts[0]], [20, 20, 20]);
  const report = auditMeshData(bad);
  check("topology: catches duplicate vertices", report.counts.duplicateVertexPairs > 0);
  check("topology: catches loose vertices", report.counts.looseVertices === 2, String(report.counts.looseVertices));
}

{
  const open = box(0, 0, 0, 1, 1, 1);
  open.faces.pop();
  const report = auditMeshData(open);
  check("topology: catches open boundaries", report.counts.boundaryEdges === 4, String(report.counts.boundaryEdges));
}

{
  const nonManifold = box(0, 0, 0, 1, 1, 1);
  nonManifold.faces.push([...nonManifold.faces[0]]);
  const report = auditMeshData(nonManifold);
  check("topology: catches non-manifold edges", report.counts.nonManifoldEdges === 4, String(report.counts.nonManifoldEdges));
}

{
  const detached = join([
    box(0, 0, 0, 1, 1, 1),
    box(2, 0, 0, 3, 1, 1),
  ]);
  const report = auditMeshData(detached);
  check("topology: catches detached face components", report.counts.components === 2, String(report.counts.components));
  check("topology: detached components fail by default", !report.ok);
}

{
  const insideOut = box(0, 0, 0, 1, 1, 1);
  for (const face of insideOut.faces) face.reverse();
  const report = auditMeshData(insideOut);
  check("topology: catches inside-out closed volume", report.issues.some((entry) => entry.code === "inside-out"), String(report.signedVolume));
}

{
  const outward = box(0, 0, 0, 3, 3, 3);
  const inward = box(5, 0, 0, 6, 1, 1);
  for (const face of inward.faces) face.reverse();
  const report = auditMeshData(join([outward, inward]), { maxComponents: 2 });
  check("topology: orientation is checked per disconnected component", report.issues.some((entry) => entry.code === "inside-out") && report.componentVolumes.some((value) => value < 0), JSON.stringify(report.componentVolumes));
}

{
  const invalid = box(0, 0, 0, 1, 1, 1);
  invalid.faces[0][0] = 999;
  const report = auditMeshData(invalid);
  check("topology: catches invalid face indices", report.issues.some((entry) => entry.code === "invalid-index"));
}

{
  const malformed = box(0, 0, 0, 1, 1, 1);
  malformed.verts[0] = null;
  malformed.faces.push(null);
  let report;
  try {
    report = auditMeshData(malformed);
  } catch {
    report = null;
  }
  check("topology: malformed data reports instead of throwing", !!report && report.issues.some((entry) => entry.code === "non-finite-vertex"));
}

{
  const inconsistent = box(0, 0, 0, 1, 1, 1);
  inconsistent.faces[0].reverse();
  const report = auditMeshData(inconsistent);
  check("topology: catches locally inconsistent winding", report.counts.inconsistentWindingEdges === 4 && report.issues.some((entry) => entry.code === "inconsistent-winding"), JSON.stringify(report.issues));
}

{
  const pointTouch = meshObj(
    [[0, 0, 0], [1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0]],
    [[0, 1, 2], [0, 3, 4]],
  );
  const report = auditMeshData(pointTouch, { closed: false, checkOrientation: false });
  check("topology: vertex-only contact remains two components", report.counts.components === 2, String(report.counts.components));
}

{
  const materialMismatch = box(0, 0, 0, 1, 1, 1);
  materialMismatch.faceMat = [0];
  const report = auditMeshData(materialMismatch);
  check("topology: catches material-face mismatch", report.issues.some((entry) => entry.code === "material-face-count"));
  materialMismatch.faceMat = new Array(materialMismatch.faces.length).fill(0);
  materialMismatch.faceMat[0] = -1;
  const invalidSlot = auditMeshData(materialMismatch);
  check("topology: catches invalid material index", invalidSlot.issues.some((entry) => entry.code === "invalid-material-index"));
}

{
  const attributes = box(0, 0, 0, 1, 1, 1);
  attributes.colors = [[1, 1, Number.NaN]];
  attributes.uvs = [attributes.faces[0].map(() => [0, 0])];
  const report = auditMeshData(attributes);
  check("topology: catches color count and finite-value defects", report.issues.some((entry) => entry.code === "color-vertex-count") && report.issues.some((entry) => entry.code === "invalid-vertex-color"));
  check("topology: catches UV face count defects", report.issues.some((entry) => entry.code === "uv-face-count"));
}

{
  const open = loft([
    [[0, 0, 0], [1, 0, 0], [1, 1, 0]],
    [[0, 0, 1], [1, 0, 1], [1, 1, 1]],
  ]);
  const report = auditMeshData(open, { closed: false, maxComponents: 1, checkOrientation: false });
  check("topology: intentional open surface can opt out", report.ok, JSON.stringify(report.issues));
}

{
  const badSoup = {
    positions: [0, 0, 0, 0, 0, 0, 0, 0, 0],
    normals: [0, 0, 0, 0, 0, 0, 0, 0, Number.NaN],
  };
  const report = auditTriangleSoup(badSoup);
  check("emission: catches degenerate triangle", report.issues.some((entry) => entry.code === "degenerate-triangle"));
  check("emission: catches invalid normals", report.issues.some((entry) => entry.code === "bad-normal"));
}

{
  const report = auditTriangleSoup({
    positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    normals: [0, 0, -1, 0, 0, -1, 0, 0, -1],
  });
  check("emission: catches normals opposed to triangle winding", report.issues.some((entry) => entry.code === "opposed-normal"));
}

{
  const ring = [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]];
  const collapsed = loft([
    ring,
    ring.map((point) => [point[0], point[1], 1]),
    ring.map((point) => [point[0], point[1], 1]),
  ], { closeV: true });
  cleanMesh(collapsed);
  const zeroFaces = collapsed.faces.filter((face) => faceNormal(collapsed.verts, face).every((value) => Math.abs(value) < 1e-12));
  check("cleanup: removes collapsed-ring zero-area faces", zeroFaces.length === 0, String(zeroFaces.length));
}

{
  const distance = 2e-5;
  const seam = meshObj(
    [[0.49 * distance, 0, 0], [0.51 * distance, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]],
    [[0, 2, 3], [1, 3, 4]],
  );
  cleanMesh(seam, distance);
  check("cleanup: welds close vertices across spatial-cell boundaries", seam.verts.length === 4, String(seam.verts.length));
}

{
  const report = runGeometryContract({
    name: "seat",
    checks: [
      rangeCheck("seat-height", (value) => value.height, 0.43, 0.46),
      minimumCheck("slat-gap", (value) => value.gap, 0.004),
    ],
  }, { height: 0.45, gap: 0.008 });
  check("contract: passing measurements", report.ok, JSON.stringify(report.failures));
  const failed = runGeometryContract({
    name: "seat",
    checks: [rangeCheck("seat-height", (value) => value.height, 0.43, 0.46)],
  }, { height: 0.6 });
  check("contract: rejects bad measurements", !failed.ok);
}

{
  const report = runGeometryContract({
    name: "mechanism",
    checks: [
      maximumCheck("maximum-gap", (value) => value.gap, 0.01),
      nearCheck("closed-contact", (value) => value.closed, 0, 0.0005),
      predicateCheck("opening-clear", (value) => value.blocked, (blocked) => blocked === false, "false"),
      minimumCheck("warning-only", (value) => value.margin, 0.1, { severity: "warning" }),
    ],
  }, { gap: 0.004, closed: 0.0002, blocked: false, margin: 0.05 });
  check("contract: maximum/near/predicate helpers pass", report.ok, JSON.stringify(report.failures));
  check("contract: warnings do not fail the contract", report.warnings.length === 1, String(report.warnings.length));
  let threw = false;
  try {
    assertGeometryContract(runGeometryContract({
      name: "throws",
      checks: [predicateCheck("exception", () => { throw new Error("measurement failed"); }, () => true, "no exception")],
    }, {}));
  } catch (error) {
    threw = error instanceof Error && error.message.includes("measurement failed");
  }
  check("contract: measurement exceptions become actionable failures", threw);
  let duplicateRejected = false;
  let severityRejected = false;
  try {
    runGeometryContract({
      name: "duplicates",
      checks: [minimumCheck("same", () => 1, 0), minimumCheck("same", () => 1, 0)],
    }, {});
  } catch (error) {
    duplicateRejected = error instanceof TypeError && error.message.includes("duplicate check id");
  }
  try {
    runGeometryContract({
      name: "severity",
      checks: [minimumCheck("value", () => 1, 0, { severity: "warn" })],
    }, {});
  } catch (error) {
    severityRejected = error instanceof TypeError && error.message.includes("severity");
  }
  check("contract: duplicate check identifiers are rejected", duplicateRejected);
  check("contract: severity typos are rejected", severityRejected);
}

{
  const outer = { min: { x: 0, y: 0, z: 0 }, max: { x: 2, y: 2, z: 2 } };
  const inner = { min: { x: 0.5, y: 0.5, z: 0.5 }, max: { x: 1.5, y: 1.5, z: 1.5 } };
  const separate = { min: { x: 3, y: 0, z: 0 }, max: { x: 4, y: 1, z: 1 } };
  check("contract: bounds containment", boundsContains(outer, inner));
  check("contract: bounds gap", boundsGapAlongAxis(outer, separate, "x") === 1);
  check("contract: intersection depth", boundsIntersectionDepth(outer, inner).every((value) => value === 1));
}

function quad(y, flip = false) {
  const positions = flip
    ? [0, y, 0, 0, y, 1, 1, y, 1, 0, y, 0, 1, y, 1, 1, y, 0]
    : [0, y, 0, 1, y, 1, 0, y, 1, 0, y, 0, 1, y, 0, 1, y, 1];
  const normals = [];
  for (let i = 0; i < 6; i++) normals.push(0, flip ? -1 : 1, 0);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3));
  return new Mesh(geometry, new MeshBasicMaterial());
}

function solidMesh(meshData, name) {
  const mesh = new Mesh(toGeometry(cleanMesh(meshData.clone())), new MeshBasicMaterial());
  mesh.name = name;
  return mesh;
}

function triangleMesh(points, name = "triangle") {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(points.flat()), 3));
  const a = points[0];
  const b = points[1];
  const c = points[2];
  const ux = b[0] - a[0];
  const uy = b[1] - a[1];
  const uz = b[2] - a[2];
  const vx = c[0] - a[0];
  const vy = c[1] - a[1];
  const vz = c[2] - a[2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const length = Math.hypot(nx, ny, nz) || 1;
  const normals = [];
  for (let i = 0; i < 3; i++) normals.push(nx / length, ny / length, nz / length);
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3));
  const mesh = new Mesh(geometry, new MeshBasicMaterial());
  mesh.name = name;
  return mesh;
}

{
  const root = new Group();
  const a = quad(1, false);
  const b = quad(1.0005, false);
  const c = quad(1, true);
  a.name = "A";
  b.name = "B";
  c.name = "C";
  root.add(a, b, c);
  const report = auditGeometry(root, { clash: false });
  check("scene audit: planted z-fight", report.zfight.length === 1, JSON.stringify(report.zfight));
  check("scene audit: measures one square metre", report.zfightTotalCm2 > 9000, String(report.zfightTotalCm2));
  check("scene audit: opposed faces are informational", report.backToBack >= 2, String(report.backToBack));
  disposeHierarchy(root, true);
}

{
  const root = new Group();
  root.add(
    triangleMesh([[0, 0, 0], [2, 0, 0], [0, 0, 2]], "lower-left"),
    triangleMesh([[2, 0.0005, 2], [2, 0.0005, 1.1], [1.1, 0.0005, 2]], "upper-right"),
  );
  check("scene audit: overlapping AABBs without triangle overlap stay clean", auditGeometry(root, { clash: false }).zfight.length === 0);
  disposeHierarchy(root, true);
}

{
  const a = quad(1, false);
  const b = quad(1.0005, false);
  const positions = [...a.geometry.getAttribute("position").array, ...b.geometry.getAttribute("position").array];
  const normals = [...a.geometry.getAttribute("normal").array, ...b.geometry.getAttribute("normal").array];
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3));
  const merged = new Mesh(geometry, new MeshBasicMaterial());
  merged.name = "merged-slot";
  const root = new Group();
  root.add(merged);
  const report = auditGeometry(root, { clash: false });
  check("scene audit: same-mesh z-fight after slot merge", report.zfight.length === 1 && report.zfight[0].a === "merged-slot" && report.zfight[0].b === "merged-slot", JSON.stringify(report.zfight));
  a.geometry.dispose();
  a.material.dispose();
  b.geometry.dispose();
  b.material.dispose();
  disposeHierarchy(root, true);
}

{
  const root = new Group();
  const a = quad(1, false);
  const b = quad(1.0005, false);
  a.name = "kept";
  b.name = "skipped";
  b.userData.auditSkip = true;
  root.add(a, b);
  check("scene audit: userData auditSkip", auditGeometry(root, { clash: false }).meshes === 1);
  b.userData.auditSkip = false;
  check("scene audit: skip callback", auditGeometry(root, { clash: false, skip: (_mesh, name) => name === "skipped" }).meshes === 1);
  disposeHierarchy(root, true);
}

{
  const root = new Group();
  const a = quad(1, false);
  const b = quad(1.0005, false);
  a.position.x = 20;
  b.position.x = 20;
  root.add(a, b);
  const bounded = auditGeometry(root, {
    clash: false,
    bounds: { radius: 1, minY: -2, maxY: 2, centerX: 0, centerZ: 0 },
  });
  check("scene audit: bounds exclude comparison triangles", bounded.compared === 0 && bounded.zfight.length === 0, JSON.stringify(bounded));
  disposeHierarchy(root, true);
}

{
  const root = new Group();
  root.add(quad(1, false), quad(1.0005, false));
  const report = auditGeometry(root, { clash: false, maxTriangles: 1 });
  check("scene audit: triangle cap reports truncation", report.truncated && report.compared === 1);
  disposeHierarchy(root, true);
}

{
  const root = new Group();
  const a = quad(0, false);
  const b = quad(0, false);
  b.rotation.z = 0.01;
  root.add(a, b);
  check("scene audit: angleRadians is a true angular tolerance", auditGeometry(root, { clash: false }).zfight.length === 0 && auditGeometry(root, { clash: false, angleRadians: 0.02 }).zfight.length === 1);
  disposeHierarchy(root, true);
}

{
  const root = new Group();
  root.add(quad(0, false), quad(0.003, false));
  check("scene audit: planeDistance option controls separation", auditGeometry(root, { clash: false }).zfight.length === 0 && auditGeometry(root, { clash: false, planeDistance: 0.004 }).zfight.length === 1);
  check("scene audit: overlapArea option controls reportable area", auditGeometry(root, { clash: false, planeDistance: 0.004, overlapArea: 2 }).zfight.length === 0);
  disposeHierarchy(root, true);
}

{
  const hiddenParent = new Group();
  hiddenParent.visible = false;
  hiddenParent.add(quad(0, false), quad(0.0005, false));
  const root = new Group();
  root.add(hiddenParent);
  check("scene audit: invisible ancestors suppress descendants", auditGeometry(root, { clash: false }).meshes === 0);
  disposeHierarchy(root, true);
}

{
  const bad = quad(0, false);
  const normals = bad.geometry.getAttribute("normal");
  for (let i = 0; i < normals.count; i++) normals.setXYZ(i, 0, 2, 0);
  const root = new Group();
  root.add(bad);
  const report = auditGeometry(root, { clash: false });
  check("scene audit: non-unit normals are defects", report.defects.length === 1 && report.defects[0].badNormals === 6, JSON.stringify(report.defects));
  disposeHierarchy(root, true);
}

{
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([0, 0, 0, 0, 0, 0, 0, 0, 0]), 3));
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array(9), 3));
  const bad = new Mesh(geometry, new MeshBasicMaterial());
  bad.name = "bad-mesh";
  bad.material.dispose();
  bad.material = null;
  const root = new Group();
  root.add(bad);
  const report = auditGeometry(root, { clash: false });
  check("scene audit: degenerate and bad normals", report.defects.length === 1 && report.defects[0].degenerate === 1 && report.defects[0].badNormals === 3, JSON.stringify(report.defects));
  check("scene audit: missing material", report.noMaterial.length === 1 && report.noMaterial[0] === "bad-mesh", JSON.stringify(report.noMaterial));
  disposeHierarchy(root);
}

{
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([
    0, 0, 0, 1, 0, 0, 0, 1, 0, 2, 2, 2,
  ]), 3));
  geometry.setAttribute("normal", new BufferAttribute(new Float32Array([
    0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1,
  ]), 3));
  const root = new Group();
  root.add(new Mesh(geometry, new MeshBasicMaterial()));
  const report = auditGeometry(root, { clash: false });
  check("scene audit: incomplete triangle tails are defects", report.defects.length === 1 && report.defects[0].incompleteCorners === 1, JSON.stringify(report.defects));
  disposeHierarchy(root, true);
}

{
  const geometry = toGeometry(cleanMesh(box(0, 0, 0, 1, 1, 1)));
  const material = new MeshBasicMaterial();
  const instances = new InstancedMesh(geometry, material, 2);
  instances.name = "fastener";
  instances.position.x = 10;
  instances.setMatrixAt(0, new Matrix4().makeTranslation(0, 0, 0));
  instances.setMatrixAt(1, new Matrix4().makeTranslation(3, 0, 0));
  const root = new Group();
  root.add(instances);
  check("scene audit: instances excluded by default", auditGeometry(root, { clash: false }).meshes === 0);
  instances.count = 3;
  const included = auditGeometry(root, { clash: false, includeInstanced: true });
  check("scene audit: every available instance expands with its world transform", included.meshes === 2 && included.triangles === 24, JSON.stringify(included));
  const secondOnly = auditGeometry(root, {
    clash: false,
    includeInstanced: true,
    bounds: { radius: 1, minY: -0.1, maxY: 1.1, centerX: 13.5, centerZ: 0.5 },
  });
  check("scene audit: parent and instance transforms compose", secondOnly.compared === 12, JSON.stringify(secondOnly));
  disposeHierarchy(root, true);
}

{
  const root = new Group();
  const a = quad(1, false);
  const b = quad(1.01, false);
  a.name = "A";
  b.name = "B";
  root.add(a, b);
  check("scene audit: ten millimetres is clean", auditGeometry(root, { clash: false }).zfight.length === 0);
  disposeHierarchy(root, true);
}

{
  const root = new Group();
  root.name = "assembly";
  root.add(
    solidMesh(box(0, 0, 0, 1, 1, 1), "P"),
    solidMesh(box(0.94, 0.3, 0.3, 1.6, 0.7, 0.7), "Q"),
  );
  check("scene audit: sixty-millimetre clash", auditGeometry(root).clash.length === 1);
  check("scene audit: narrow named clash allowance", auditGeometry(root, { clashAllow: [["P", "Q"]] }).clash.length === 0);
  check("scene audit: clash pass can be disabled", auditGeometry(root, { clash: false }).clash.length === 0);
  disposeHierarchy(root, true);

  const touching = new Group();
  touching.add(
    solidMesh(box(0, 0, 0, 1, 1, 1), "P"),
    solidMesh(box(1, 0.3, 0.3, 1.6, 0.7, 0.7), "Q"),
  );
  check("scene audit: butt joint is not a clash", auditGeometry(touching).clash.length === 0);
  disposeHierarchy(touching, true);
}

{
  const root = new Group();
  root.add(
    solidMesh(box(0, 0, 0, 1, 1, 1), "shallow-a"),
    solidMesh(box(0.994, 0.3, 0.3, 1.6, 0.7, 0.7), "shallow-b"),
  );
  check("scene audit: clashDepth option admits explicitly requested shallow penetrations", auditGeometry(root).clash.length === 0 && auditGeometry(root, { clashDepth: 0.004 }).clash.length === 1);
  disposeHierarchy(root, true);
}

{
  const root = new Group();
  root.add(
    solidMesh(box(0, 0, 0, 100, 100, 1), "large-slab"),
    solidMesh(box(49, 49, -1, 51, 51, 2), "piercing-column"),
  );
  const report = auditGeometry(root);
  check("scene audit: oversized hash triangles retain clash coverage", report.clash.length === 1, JSON.stringify(report.clash));
  disposeHierarchy(root, true);
}

{
  const material = new MeshBasicMaterial();
  const parts = [
    { name: "frame:left", slot: "metal", meshData: roundedBoxMesh([-1, 0, 0, -0.8, 1, 1], 0.02, 2), contract: { support: "ground" } },
    { name: "frame:right", slot: "metal", meshData: roundedBoxMesh([0.8, 0, 0, 1, 1, 1], 0.02, 2) },
  ];
  const before = JSON.stringify(parts.map((part) => ({ verts: part.meshData.verts, faces: part.meshData.faces })));
  const named = buildNamedAuditGroup(parts, { metal: material });
  const merged = buildMergedAssembly(parts, { metal: material });
  check("assembly: named audit parts survive", named.children.map((child) => child.name).join(",") === "frame:left,frame:right");
  check("assembly: contract metadata survives", named.children[0].userData.geometryPart.contract.support === "ground");
  check("assembly: one merged mesh per slot", merged.children.length === 1, String(merged.children.length));
  check("assembly: builders do not mutate caller MeshData", JSON.stringify(parts.map((part) => ({ verts: part.meshData.verts, faces: part.meshData.faces }))) === before);
  check("assembly: clean before and after merge", auditGeometry(named).zfight.length === 0 && auditGeometry(merged).zfight.length === 0);
  const plainSource = JSON.parse(JSON.stringify(box(0, 0, 0, 1, 1, 1)));
  const plainBefore = JSON.stringify(plainSource);
  const plainGroup = buildNamedAuditGroup([{ name: "plain", slot: "metal", meshData: plainSource }], { metal: material });
  check("assembly: plain mesh-data objects are cloned before cleanup", JSON.stringify(plainSource) === plainBefore);
  const colored = box(4, 0, 0, 5, 1, 1);
  colored.colors = colored.verts.map(() => [0.2, 0.4, 0.6]);
  colored.colorName = "surfaceMask";
  const coloredAssembly = buildMergedAssembly([
    { name: "colored", slot: "metal", meshData: colored },
    { name: "default-color", slot: "metal", meshData: box(6, 0, 0, 7, 1, 1) },
  ], { metal: material });
  const colorAttribute = coloredAssembly.children[0].geometry.getAttribute("surfaceMask");
  check("assembly: merged slots preserve and default vertex-color attributes", colorAttribute?.count === coloredAssembly.children[0].geometry.getAttribute("position").count);
  disposeHierarchy(named);
  disposeHierarchy(merged);
  disposeHierarchy(plainGroup);
  disposeHierarchy(coloredAssembly);
  material.dispose();
}

{
  const material = new MeshBasicMaterial();
  let missingName = false;
  let missingMaterial = false;
  let duplicateName = false;
  try {
    buildNamedAuditGroup([{ slot: "metal", meshData: box(0, 0, 0, 1, 1, 1) }], { metal: material });
  } catch (error) {
    missingName = error instanceof TypeError && error.message.includes("stable name");
  }
  try {
    buildNamedAuditGroup([{ name: "part", slot: "metal", meshData: box(0, 0, 0, 1, 1, 1) }], {});
  } catch (error) {
    missingMaterial = error instanceof Error && error.message.includes("no material");
  }
  try {
    buildNamedAuditGroup([
      { name: "part", slot: "metal", meshData: box(0, 0, 0, 1, 1, 1) },
      { name: "part", slot: "metal", meshData: box(2, 0, 0, 3, 1, 1) },
    ], { metal: material });
  } catch (error) {
    duplicateName = error instanceof Error && error.message.includes("duplicate assembly part name");
  }
  check("assembly: rejects unnamed parts", missingName);
  check("assembly: rejects unbound material slots", missingMaterial);
  check("assembly: rejects duplicate stable names", duplicateName);
  material.dispose();
}

{
  const clockwise = [...unitSquare].reverse();
  check("profiles: polygon area sign", polyArea(unitSquare) === 1 && polyArea(clockwise) === -1);
  check("profiles: ccw normalizes winding", polyArea(ccw(clockwise)) > 0);
  check("profiles: outward offset grows area", polyArea(polyOffset(unitSquare, 0.1)) > 1);
  check("profiles: inset shrinks area", polyArea(insetPoly(unitSquare, 0.1)) < 1);
  const offset = offsetPolyline([[0, 0], [1, 0], [1, 1]], 0.1);
  check("profiles: open polyline offset preserves endpoints", offset.length === 3 && Math.abs(offset[0][1] + 0.1) < 1e-9);
  check("profiles: chamfer rectangle has eight corners", chamferRect(1, 0.5, 0.05).length === 8);
  const arc = arcPts(0, 0, 1, 0, Math.PI / 2, 4);
  check("profiles: arc endpoints", Math.abs(arc[0][0] - 1) < 1e-9 && Math.abs(arc.at(-1)[1] - 1) < 1e-9);
  const curve = bez([0, 0], [0, 1], [1, 1], [1, 0], 8);
  check("profiles: bezier endpoints", curve[0][0] === 0 && curve[0][1] === 0 && curve.at(-1)[0] === 1 && curve.at(-1)[1] === 0);
  check("profiles: rounded rectangle and circle segment counts", roundedRect(1, 0.5, 0.05, 3).length === 16 && circle(1, 12).length === 12);
  check("profiles: densify adds corner guards", densify([[0, 0, 0], [1, 0, 0], [1, 1, 0]], 0.05).length === 5);
}

{
  const point = () => meshObj([[1, 0, 0]], []);
  check("transform: translate", translate(point(), [1, 2, 3]).verts[0].join(",") === "2,2,3");
  const rz = rotateZ(point(), Math.PI / 2).verts[0];
  check("transform: rotate Z", Math.abs(rz[0]) < 1e-9 && Math.abs(rz[1] - 1) < 1e-9);
  const rx = rotX(meshObj([[0, 1, 0]], []), Math.PI / 2).verts[0];
  check("transform: rotate X", Math.abs(rx[1]) < 1e-9 && Math.abs(rx[2] - 1) < 1e-9);
  const ry = rotY(point(), Math.PI / 2).verts[0];
  check("transform: rotate Y", Math.abs(ry[0]) < 1e-9 && Math.abs(ry[2] + 1) < 1e-9);
  check("transform: scale", scaleMesh(point(), [2, 3, 4]).verts[0].join(",") === "2,0,0");
  const matrixPoint = transform4(point(), [[1, 0, 0, 2], [0, 1, 0, 3], [0, 0, 1, 4], [0, 0, 0, 1]]).verts[0];
  check("transform: matrix", matrixPoint.join(",") === "3,3,4");
  const placed = placeYaw(point(), [2, 3, 4], Math.PI / 2).verts[0];
  check("transform: yaw placement", Math.abs(placed[0] - 2) < 1e-9 && placed[1] === 3 && Math.abs(placed[2] - 3) < 1e-9);
}

{
  const rawBox = box(0, 0, 0, 1, 1, 1);
  const before = rawBox.verts.length;
  bevel(rawBox, 0.04, 2);
  check("modifier: provenance-aware box bevel", rawBox.verts.length > before);
  const rawPrism = prism(unitSquare, 0, 1);
  const prismBefore = rawPrism.verts.length;
  bevel(rawPrism, 0.04, 2);
  check("modifier: provenance-aware prism bevel", rawPrism.verts.length > prismBefore);
  flatShade(rawPrism);
  check("shading: flat mode", rawPrism.shading.mode === "flat");
  smoothShade(rawPrism, 37);
  check("shading: smooth mode and angle", rawPrism.shading.mode === "smooth" && rawPrism.shading.angle === 37);
  for (const face of rawPrism.faces) face.reverse();
  recalcNormals(rawPrism);
  check("winding: reconstruction restores positive volume", auditMeshData(rawPrism).signedVolume > 0);
}

{
  const authored = box(0, 0, 0, 1, 2, 3);
  const once = toYUp(authored.clone());
  const snapshot = JSON.stringify({ verts: once.verts, faces: once.faces });
  toYUp(once);
  check("emission: Y-up conversion is idempotent", JSON.stringify({ verts: once.verts, faces: once.faces }) === snapshot);
}

{
  const swept = sweepPlanarLoop(
    [[0, 0], [1, 0], [1, 1]],
    [[-0.1, 0], [0.1, 0], [0.1, 0.1], [-0.1, 0.1]],
    false,
  );
  const firstRing = swept.verts.slice(0, 4);
  const lastRing = swept.verts.slice(-4);
  check("sweep: open-path first frame uses first segment", firstRing.every((point) => Math.abs(point[0]) < 1e-9), JSON.stringify(firstRing));
  check("sweep: open-path last frame uses last segment", lastRing.every((point) => Math.abs(point[1] - 1) < 1e-9), JSON.stringify(lastRing));
}

{
  const multi = box(0, 0, 0, 1, 1, 1);
  multi.faceMat = [0, 0, 1, 1, 2, 2];
  const geometry = toGeometry(multi);
  check("emission: face material slots become geometry groups", geometry.groups.length === 3 && geometry.groups.every((group, index) => group.materialIndex === index && group.count === 12), JSON.stringify(geometry.groups));
  geometry.dispose();
}

{
  const calls = [];
  const writer = { raw: (...args) => calls.push(args) };
  writeInto(writer, "metal", box(0, 0, 0, 1, 1, 1));
  writeAll(writer, {
    metal: [box(0, 0, 0, 1, 1, 1), box(2, 0, 0, 3, 1, 1)],
    glass: box(4, 0, 0, 5, 1, 1),
  });
  check("writer: writeInto/writeAll preserve slots", calls.length === 4 && calls[0][0] === "metal" && calls.at(-1)[0] === "glass");
  check("writer: emitted arrays stay aligned", calls.every(([, positions, normals, uvs]) => positions.length === normals.length && uvs.length * 3 === positions.length * 2));
}

{
  let state = 0x51f15e;
  const random = () => {
    state = Math.imul(state ^ state >>> 15, 1 | state);
    state ^= state + Math.imul(state ^ state >>> 7, 61 | state);
    return ((state ^ state >>> 14) >>> 0) / 4294967296;
  };
  const failures = [];
  const validate = (label, meshData) => {
    const prepared = cleanMesh(meshData);
    const topology = auditMeshData(prepared);
    const emission = auditTriangleSoup(toTriangles(prepared));
    if (!topology.ok || !emission.ok) failures.push({ label, topology: topology.issues, emission: emission.issues });
  };
  for (let i = 0; i < 24; i++) {
    const sides = 3 + i % 10;
    const radius = 0.15 + random() * 0.85;
    const height = 0.05 + random() * 1.5;
    const polygon = circle(radius, sides, 0, 0, random() * Math.PI);
    validate(`sweep prism ${i}`, prism(polygon, -height * 0.5, height * 0.5));
    validate(`sweep loft ${i}`, loft([
      polygon.map(([x, y]) => [x * 0.7, y * 0.7, 0]),
      polygon.map(([x, y]) => [x, y, height * 0.5]),
      polygon.map(([x, y]) => [x * 0.8, y * 0.8, height]),
    ], { closeV: true, capStart: true, capEnd: true }));
    validate(`sweep rounded box ${i}`, roundedBoxMesh(
      [-radius, -radius * 0.6, 0, radius, radius * 0.6, height],
      Math.min(radius * 0.2, height * 0.2),
      1 + i % 3,
    ));
    validate(`sweep tube ${i}`, tubeAlong([
      [0, 0, 0],
      [0.3 + random(), random() * 0.2, 0.1 + random() * 0.2],
      [0.8 + random(), 0.4 + random() * 0.3, 0.3 + random() * 0.2],
    ], circle(0.02 + random() * 0.08, 6 + i % 10), { miter: i % 2 === 0 }));
  }
  check("deterministic sweep: 96 generated solids pass topology and emission", failures.length === 0, JSON.stringify(failures.slice(0, 2)));
}

{
  const failures = [];
  for (let i = 0; i < 24; i++) {
    const root = new Group();
    root.rotation.set(i * 0.173, i * 0.271, i * 0.119);
    const a = quad(0, false);
    const b = quad(0.0005, false);
    a.name = `rotated-a-${i}`;
    b.name = `rotated-b-${i}`;
    root.add(a, b);
    const report = auditGeometry(root, { clash: false });
    if (report.zfight.length !== 1) failures.push({ i, report });
    disposeHierarchy(root, true);
  }
  check("deterministic sweep: rotated coplanar pairs survive plane-grid boundaries", failures.length === 0, JSON.stringify(failures.slice(0, 2)));
}

{
  const failures = [];
  for (let i = 0; i < 12; i++) {
    const penetration = 0.04 + i * 0.005;
    const clashed = new Group();
    clashed.add(
      solidMesh(box(0, 0, 0, 1, 1, 1), `solid-a-${i}`),
      solidMesh(box(1 - penetration, 0.3, 0.3, 1.6, 0.7, 0.7), `solid-b-${i}`),
    );
    const clashReport = auditGeometry(clashed);
    if (clashReport.clash.length !== 1) failures.push({ i, kind: "missed", penetration, clashReport });
    disposeHierarchy(clashed, true);

    const separated = new Group();
    separated.add(
      solidMesh(box(0, 0, 0, 1, 1, 1), `clean-a-${i}`),
      solidMesh(box(1 + i * 0.002, 0.3, 0.3, 1.6, 0.7, 0.7), `clean-b-${i}`),
    );
    const cleanReport = auditGeometry(separated);
    if (cleanReport.clash.length !== 0) failures.push({ i, kind: "false-positive", cleanReport });
    disposeHierarchy(separated, true);
  }
  check("deterministic sweep: clash threshold separates penetration from touching", failures.length === 0, JSON.stringify(failures.slice(0, 2)));
}

{
  const poleMesh = revolve([[0, 0], [0.3, 0.4], [0, 0.8]], 24, { capStart: false, capEnd: false });
  const onAxis = poleMesh.verts.filter((v) => Math.hypot(v[0], v[1]) < 1e-9).length;
  check("revolve: one vertex per pole", onAxis === 2, String(onAxis));
  check("circle helper remains usable", circle(1, 16).length === 16);
}

{
  // Negative-determinant mirroring flips winding automatically
  const mirrored = scaleMesh(box(0, 0, 0, 1, 1, 1), [-1, 1, 1]);
  check("mirror: negative scale preserves outward signed volume", auditMeshData(mirrored).signedVolume > 0);
  const matMirrored = transform4(box(0, 0, 0, 1, 1, 1), [[-1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);
  check("mirror: negative-det transform4 preserves outward signed volume", auditMeshData(matMirrored).signedVolume > 0);
}

{
  // Faceting audit catches 8-sided cylinder shaded below its 45 deg facet angle and flatShading
  const badCyl = prism(circle(0.3, 8), 0, 1);
  smoothShade(badCyl, 34); // 8 sides = 45 deg between faces -> every vertical edge splits
  const goodCyl = prism(circle(0.3, 8), 0, 1);
  smoothShade(goodCyl, smoothAngleForSegments(8));
  const gemCyl = prism(circle(0.3, 8), 0, 1);
  flatShade(gemCyl);

  const root = new Group();
  const badMesh = solidMesh(badCyl, "column:faceted-by-mistake");
  const goodMesh = solidMesh(goodCyl, "column:smooth-by-crease-rule");
  const gemMesh = solidMesh(gemCyl, "gem:intended-facets");
  gemMesh.userData.faceted = true;
  const flatMatMesh = solidMesh(goodCyl, "column:flatShading-flag");
  flatMatMesh.material = new MeshStandardMaterial({ flatShading: true });
  root.add(badMesh, goodMesh, gemMesh, flatMatMesh);

  const fReport = auditFaceting(root);
  const flagged = new Set(fReport.hits.map((h) => h.mesh));
  check("faceting: catches low-crease 8-sided cylinder", flagged.has("column:faceted-by-mistake"), JSON.stringify(fReport.hits));
  check("faceting: catches material.flatShading", flagged.has("column:flatShading-flag"), JSON.stringify(fReport.hits));
  check("faceting: passes smoothAngleForSegments(8)", !flagged.has("column:smooth-by-crease-rule"), JSON.stringify(fReport.hits));
  check("faceting: skips userData.faceted opt-out", !flagged.has("gem:intended-facets"), JSON.stringify(fReport.hits));
  disposeHierarchy(root, true);
}

{
  // Support chain audit catches floating parts and passes grounded stacks
  const root = new Group();
  const base = solidMesh(box(0, 0, 0, 1, 1, 0.5), "pedestal");
  const cap = solidMesh(box(0.1, 0.1, 0.5, 0.9, 0.9, 1.0), "statue");
  const floater = solidMesh(box(2, 2, 0.4, 2.5, 2.5, 0.8), "floating-lamp");
  root.add(base, cap, floater);
  const sReport = auditSupport(root, { groundHeight: () => 0 });
  const unsupported = sReport.hits.map((h) => h.mesh);
  check("support: catches floating part and passes grounded chain", unsupported.length === 1 && unsupported[0] === "floating-lamp", JSON.stringify(sReport.hits));
  disposeHierarchy(root, true);
}

{
  // Group-filtered clearance audit catches vegetation piercing a solid wall/roof
  const root = new Group();
  const wall = solidMesh(box(0, 0, 0, 2, 0.4, 2), "wall:main");
  wall.userData.auditGroup = "solid";
  const branchIn = solidMesh(box(0.8, -0.3, 0.8, 1.0, 0.7, 1.0), "branch:piercing");
  branchIn.userData.auditGroup = "plant";
  const branchClear = solidMesh(box(0.8, 0.6, 0.8, 1.0, 1.2, 1.0), "branch:clear");
  branchClear.userData.auditGroup = "plant";
  root.add(wall, branchIn, branchClear);
  const cReport = auditGroupClearance(root, { between: ["plant", "solid"], seat: 0.01 });
  check("group clearance: catches plant piercing solid", cReport.hits.length === 1 && cReport.hits[0].meshes[0] === "branch:piercing", JSON.stringify(cReport.hits));
  disposeHierarchy(root, true);
}

console.log(`${checks - failures}/${checks} checks passed`);
if (failures) process.exitCode = 1;
