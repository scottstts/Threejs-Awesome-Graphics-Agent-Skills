import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build, transform } from "esbuild";
import { Box3 } from "three";
import { ashMedium } from "../skills/threejs-procedural-vegetation/examples/structured-ash-growth/ash-preset.js";
import { compileAshTree } from "../skills/threejs-procedural-vegetation/examples/structured-ash-growth/tree-system.js";
import { SUBMARINE_DIMENSIONS } from "../skills/threejs-procedural-geometry/examples/porcelain-brass-submarine/source/design-contract.js";
import {
  createSubmarineHullPlan,
  sampleSubmarineHullRing,
} from "../skills/threejs-procedural-geometry/examples/porcelain-brass-submarine/source/submarine-model.js";
import {
  gridGeometry,
  ringPoints,
} from "../skills/threejs-procedural-geometry/examples/porcelain-brass-submarine/source/mesh-kit.js";
import {
  CAUCHY_K,
  LAMBDA_D,
  LAMBDA_MAX,
  LAMBDA_MIN,
  absorptionCoefficients,
  cauchyCoefficients,
} from "../skills/threejs-procedural-materials/examples/spectral-dispersive-glass/glass-optics.js";
import {
  DIFFRACTION_GRATING_DEFAULTS,
  diffractionEffectiveAzimuthSigma,
  diffractionOrderWavelengthNm,
} from "../skills/threejs-procedural-materials/examples/physical-diffraction-grating/physical-diffraction-grating.js";
import {
  SOFTBODY_JELLY_DEFAULTS,
  SOFTBODY_JELLY_LOOKS,
  RefractiveLightField,
  SoftBody,
  makeFlowerCage,
  refractRay,
} from "../skills/threejs-procedural-materials/examples/softbody-jelly/softbody-jelly.js";
import {
  OPTIMUS_COLLECTION_ORDER,
  createProceduralOptimusHumanoid,
} from "../skills/threejs-procedural-geometry/examples/procedural-optimus-humanoid/source/optimus-humanoid-system.js";
import { wormholeRadius } from "../skills/threejs-raymarched-space-effects/examples/traversable-wormhole-transit/wormhole-effect.js";

function assertVector(actual, expected, label, epsilon = 1e-5) {
  assert.equal(actual.length, expected.length, `${label}: dimension mismatch`);
  for (let index = 0; index < expected.length; index += 1) {
    assert.ok(
      Math.abs(actual[index] - expected[index]) <= epsilon,
      `${label}[${index}]: expected ${expected[index]}, received ${actual[index]}`,
    );
  }
}

function testPorcelainBrassSubmarineHullParity() {
  const plan = createSubmarineHullPlan();
  assert.equal(plan.n, 240, "submarine hull plan sample count");
  assertVector(
    [plan.r[0], plan.cy[0], plan.z[0], plan.tiltA[0], plan.v[0]],
    [0.995, -0.03694313003061203, 0.792103635930036, 0.4188790204786391, 0],
    "submarine hull plan first sample",
  );
  assertVector(
    [plan.r[120], plan.cy[120], plan.z[120], plan.tiltA[120], plan.v[120]],
    [0.8316283989299039, -0.011954225941197664, -0.25832496788420806, 0, 0.4786890204598546],
    "submarine hull plan middle sample",
  );
  assertVector(
    [plan.r[239], plan.cy[239], plan.z[239], plan.tiltA[239], plan.v[239]],
    [0.3, 0.075, -1.3, 0, 1],
    "submarine hull plan final sample",
  );

  const rows = [];
  const vRow = [];
  for (let index = 0; index < SUBMARINE_DIMENSIONS.hull.rings; index += 1) {
    const ring = sampleSubmarineHullRing(
      plan,
      index / (SUBMARINE_DIMENSIONS.hull.rings - 1),
    );
    rows.push(ringPoints(
      ring.c,
      ring.axU,
      ring.axV,
      ring.r,
      SUBMARINE_DIMENSIONS.hull.segs,
    ));
    vRow.push(ring.v);
  }
  const geometry = gridGeometry(rows, { closeU: true, flip: true, vRow });
  geometry.computeBoundingBox();
  assert.equal(
    geometry.getAttribute("position").count,
    7224,
    "submarine hull vertex count",
  );
  assert.equal(geometry.getIndex().count / 3, 14080, "submarine hull triangle count");
  assertVector(
    geometry.boundingBox.min.toArray(),
    [-1.0162882804870605, -0.9790741801261902, -1.2999999523162842],
    "submarine hull bounds minimum",
  );
  assertVector(
    geometry.boundingBox.max.toArray(),
    [1.0162882804870605, 1.005637764930725, 1.19680655002594],
    "submarine hull bounds maximum",
  );
  geometry.dispose();
}

function testEzTreeAshParity() {
  const compiled = compileAshTree(ashMedium);
  const branchPosition = compiled.branchGeometry.getAttribute("position");
  const branchIndex = compiled.branchGeometry.getIndex();
  const leafPosition = compiled.leafGeometry.getAttribute("position");
  const leafIndex = compiled.leafGeometry.getIndex();

  assert.equal(branchPosition.count, 6639, "ez-tree Ash branch vertex count");
  assert.equal(branchIndex.count / 3, 9120, "ez-tree Ash branch triangle count");
  assert.equal(leafPosition.count, 21760, "ez-tree Ash leaf vertex count");
  assert.equal(leafIndex.count / 3, 10880, "ez-tree Ash leaf triangle count");
  assert.deepEqual(
    compiled.stats.branchJobs,
    [1, 8, 40, 160],
    "ez-tree Ash branch jobs by hierarchy level",
  );
  assert.deepEqual(
    compiled.stats.continuations,
    [1, 1, 8, 40],
    "ez-tree Ash continuation jobs by hierarchy level",
  );
  assert.deepEqual(
    compiled.stats.lateralChildren,
    [0, 7, 32, 120],
    "ez-tree Ash lateral jobs by hierarchy level",
  );
  assert.equal(compiled.stats.leafCards, 5440, "ez-tree Ash leaf card count");

  assertVector(
    compiled.branchGeometry.boundingBox.min.toArray(),
    [-23.327627182006836, 0, -19.976058959960938],
    "ez-tree Ash branch bounds minimum",
  );
  assertVector(
    compiled.branchGeometry.boundingBox.max.toArray(),
    [29.321561813354492, 80.29814147949219, 31.910205841064453],
    "ez-tree Ash branch bounds maximum",
  );
  assertVector(
    compiled.leafGeometry.boundingBox.min.toArray(),
    [-27.341381072998047, 15.998337745666504, -23.50076675415039],
    "ez-tree Ash leaf bounds minimum",
  );
  assertVector(
    compiled.leafGeometry.boundingBox.max.toArray(),
    [33.317710876464844, 83.69017028808594, 34.63191604614258],
    "ez-tree Ash leaf bounds maximum",
  );
}

function testSpectralDispersiveGlassOpticsParity() {
  assert.equal(
    CAUCHY_K,
    1 / (486.13 * 486.13) - 1 / (656.27 * 656.27),
    "glass Cauchy calibration constant",
  );
  assertVector(
    [LAMBDA_D, LAMBDA_MIN, LAMBDA_MAX],
    [589.29, 415, 695],
    "glass sampled band",
  );

  // The catalogue inversion has to be self-consistent: the index at the d-line
  // must come back as the quoted n_d, and the spread across the sampled band
  // is what the Abbe number buys.
  const { a, b } = cauchyCoefficients(1.5, 32);
  assertVector(
    [a, b],
    [1.4764382680919155, 8182.110735680701],
    "glass Cauchy coefficients",
    1e-9,
  );
  const index = (lambda) => a + b / (lambda * lambda);
  assertVector(
    [index(LAMBDA_D), index(LAMBDA_MIN), index(LAMBDA_MAX)],
    [1.5, 1.5239465319077419, 1.4933775791745316],
    "glass index across the sampled band",
    1e-9,
  );

  // The tint is decoded exactly once. A doubled sRGB decode — the easy mistake,
  // since a Color built from an sRGB literal is already linear — would inflate
  // every coefficient by roughly 2.3x.
  assertVector(
    absorptionCoefficients("#d0edda", 0.5),
    [0.921668754944433, 0.332408526348505, 0.710204100521603],
    "glass absorption spectrum",
    1e-9,
  );
}

function testSoftbodyJellyParity() {
  assert.deepEqual(
    SOFTBODY_JELLY_DEFAULTS,
    {
      density: 1050,
      shear: 600,
      bulk: 65000,
      damping: 3,
      gravity: 9.81,
      step: 1 / 240,
      iterations: 3,
      staticFriction: 0.65,
      dynamicFriction: 0.42,
      restitution: 0.065,
      floor: 0.00015,
      maxGrabForce: 2.8,
    },
    "softbody-jelly physics defaults",
  );
  assert.deepEqual(
    SOFTBODY_JELLY_LOOKS.berry.sigma,
    [5, 46, 23],
    "softbody-jelly berry extinction",
  );

  const cage = makeFlowerCage();
  assert.equal(cage.pos.length / 3, 762, "softbody-jelly cage node count");
  assert.equal(cage.tets.length, 3240, "softbody-jelly tetrahedron count");
  assert.equal(cage.boundary.length, 792, "softbody-jelly boundary triangle count");
  assert.ok(
    Math.abs(cage.totalVolume - 0.00011933031247661388) < 1e-18,
    "softbody-jelly rest volume",
  );

  const body = new SoftBody(cage);
  assert.equal(
    body.surface.stencils.length,
    6338,
    "softbody-jelly smooth-shell vertex count",
  );
  assert.equal(
    body.surface.indices.length / 3,
    12672,
    "softbody-jelly smooth-shell triangle count",
  );
  assert.ok(
    Math.abs(body.totalMass - 0.12529682810044418) < 1e-15,
    "softbody-jelly rest mass",
  );
  assertVector(
    body.center.toArray(),
    [-0.000001684837451731872, 0.031000000000150137, -3.366955965335844e-19],
    "softbody-jelly rest centre",
    1e-15,
  );

  const optics = new RefractiveLightField(body.surface);
  assert.equal(optics.size, 192, "softbody-jelly receiver resolution");
  assert.equal(optics.minSpan, 0.22, "softbody-jelly receiver minimum span");
  assert.equal(optics.maxSpan, 0.75, "softbody-jelly receiver maximum span");
  assert.equal(
    optics.gpu.raysNode.value.array.length,
    65 * 65 * 5 * 4,
    "softbody-jelly adaptive caustic ray storage",
  );
  assert.equal(
    optics.gpu.flagsNode.value.array.length,
    32 * 32,
    "softbody-jelly adaptive caustic cell storage",
  );
  assert.equal(
    optics.gpu.outputTarget.width,
    384,
    "softbody-jelly caustic output resolution",
  );

  const normalIncidence = refractRay([0, -1, 0], [0, 1, 0], 1, 1.35);
  assert.ok(normalIncidence, "softbody-jelly normal-incidence refraction");
  assertVector(
    normalIncidence.direction,
    [0, -1, 0],
    "softbody-jelly normal-incidence direction",
    1e-15,
  );
  assert.equal(
    normalIncidence.transmission,
    0.977818017202354,
    "softbody-jelly normal-incidence transmission",
  );

  body.surface.geometry.dispose();
  optics.gpu.dispose();
  optics.shadowTexture.dispose();
}

function testTraversableWormholeShapeParity() {
  // r(l) is flat across the cylindrical neck, then opens through the lensing
  // shoulder. These samples pin rho, the throat half-length, and M together:
  // W/rho = 0.05 with W = 1.42953 M gives M = 0.03497653074786818, and
  // 2a/rho = 0.01 gives a = 0.005.
  assertVector(
    [
      wormholeRadius(0),
      wormholeRadius(0.005),
      wormholeRadius(-0.005),
      wormholeRadius(0.05),
      wormholeRadius(1),
      wormholeRadius(6),
      wormholeRadius(-6),
      wormholeRadius(260),
    ],
    [
      1,
      1,
      1,
      1.010682375085514,
      1.858696794199227,
      6.7958983696308275,
      6.7958983696308275,
      260.6640465504506,
    ],
    "wormhole shape function",
    1e-12,
  );
}

async function testGpuCulledFlowerFieldParity() {
  const implementation = await readFile(
    new URL(
      "../skills/threejs-procedural-vegetation/examples/gpu-culled-flower-field/source/gpu-culled-flower-field.ts",
      import.meta.url,
    ),
    "utf8",
  );
  const transpiled = await transform(implementation, {
    loader: "ts",
    format: "esm",
    target: "es2022",
  });
  const contract = await import(
    `data:text/javascript;base64,${Buffer.from(transpiled.code).toString("base64")}`
  );

  assert.deepEqual(
    [...contract.FLOWER_DRAW_VERTEX_COUNTS],
    [60, 528, 48, 24, 132, 18, 6, 6],
    "flower field eight-draw geometry budget",
  );
  assert.equal(
    contract.maximumFlowerGridSize({
      maxStorageBufferBindingSize: 128 * 1024 * 1024,
      maxBufferSize: 128 * 1024 * 1024,
      maxComputeWorkgroupsPerDimension: 65535,
    }),
    2048,
    "flower field baseline maximum grid",
  );
  assert.equal(
    contract.maximumFlowerGridSize({
      maxStorageBufferBindingSize: 16 * 1024,
      maxBufferSize: 16 * 1024,
      maxComputeWorkgroupsPerDimension: 64,
    }),
    64,
    "flower field minimum grid",
  );
  assert.deepEqual(
    contract.flowerStorageMetrics(2048 * 2048, 126041),
    {
      proceduralCandidateBytes: 0,
      compactedIndexBytes: 504164,
      expandedTransformBytes: 469762048,
      compressionRatio: 469762048 / 504164,
    },
    "flower field zero-record storage contract",
  );

  for (const [pattern, label] of [
    [/@compute @workgroup_size\(\$\{WORKGROUP_SIZE\}\)/, "configured compute workgroups"],
    [/nearIds: array<u32>;[\s\S]*midIds: array<u32>;[\s\S]*farIds: array<u32>;/, "three compacted visible tiers"],
    [/dispatchWorkgroupsIndirect/, "indirect candidate dispatch"],
    [/drawIndirect/, "indirect flower drawing"],
    [/view\.viewProjection\.some\([\s\S]*this\.cullDirty = true;/, "external-camera culling invalidation"],
    [/let octave2 = vec2<f32>\(point\.x \* 0\.78 \+ point\.y \* 0\.63/, "rotated ecology octave"],
    [/uniforms\.field\.y \* 8\.60/, "wide stochastic candidate jitter"],
  ]) {
    assert.match(implementation, pattern, `GPU flower field changed: ${label}`);
  }
}

async function testPhysicalDiffractionGratingParity() {
  assert.deepEqual(
    DIFFRACTION_GRATING_DEFAULTS,
    {
      pitchNm: 1180,
      reliefNm: 86,
      coherenceUm: 14.5,
      azimuthSigma: 0.013,
      grooveAngleRadians: 31 * Math.PI / 180,
      gain: 5.1,
      lightHalfLength: 4.9,
      lightTemperatureK: 5250,
      lightPower: 128,
    },
    "diffraction grating calibrated defaults",
  );
  assert.equal(
    diffractionOrderWavelengthNm(1180, 0.5, 1),
    590,
    "diffraction first-order wavelength",
  );
  assert.ok(
    Math.abs(diffractionEffectiveAzimuthSigma(590, 14.5, 0.013) - 0.020076575829243104) < 1e-15,
    "diffraction coherence and azimuth broadening",
  );

  const implementation = await readFile(
    new URL(
      "../skills/threejs-procedural-materials/examples/physical-diffraction-grating/physical-diffraction-grating.js",
      import.meta.url,
    ),
    "utf8",
  );
  for (const [pattern, label] of [
    [/\bFn, If, Loop, uv,/, "pure TSL control-flow imports"],
    [/const cieXYZ = Fn\(/, "analytic CIE matching curves"],
    [/const blackbodyRelative = Fn\(/, "blackbody spectral weighting"],
    [/Loop\( \{ start: int\( 1 \), end: int\( 4 \)[\s\S]*name: 'm'/, "diffraction orders one through three"],
    [/exp\( z\.mul\( z \)\.mul\( -0\.5 \) \)\.div\( sigmaEff\.mul\( 2\.50662827463 \) \)/, "normalised angular density"],
    [/const jm = besselJ\( \{ m, x: phaseDepth \} \)/, "Bessel-squared order efficiency"],
    [/Loop\( 21,/, "21-sample strip emitter"],
    [/baseResponse\.mul\( 0\.018 \)[\s\S]*starResponse\.mul\( starMask \)\.mul\( 1\.10 \)/, "base, stripe, and star optical weights"],
    [/material\.colorNode = physicalDiffractionCard\(/, "TSL radiance node ownership"],
    [/material\.blending = THREE\.AdditiveBlending;/, "additive HDR optical layer"],
    [/card\.getWorldQuaternion\(worldQ\)/, "object-frame groove axes"],
  ]) {
    assert.match(implementation, pattern, `physical diffraction grating changed: ${label}`);
  }
  assert.doesNotMatch(
    implementation,
    /\bwgslFn\b|\/\*\s*wgsl\s*\*\//i,
    "physical diffraction grating must not embed native shader source",
  );
}

function testProceduralOptimusHumanoidParity() {
  const model = createProceduralOptimusHumanoid();
  const bounds = new Box3().setFromObject(model.root);

  assert.equal(model.root.name, "PROCEDURAL_OPTIMUS_HUMANOID", "Optimus root name");
  assert.deepEqual(
    model.stats,
    { triangles: 891809, objects: 176, heightMetres: 1.73 },
    "Optimus topology statistics",
  );
  assert.deepEqual(
    Object.fromEntries(OPTIMUS_COLLECTION_ORDER.map((name) => [name, model.collections[name].length])),
    { TORSO: 25, HEAD: 2, ARM: 22, HAND: 56, HIP: 27, LEG: 38, FOOT: 6 },
    "Optimus semantic object counts",
  );
  assert.deepEqual(
    Object.keys(model.materials),
    [
      "M_SHELL", "M_SHELL_LEG", "M_BLACK", "M_GLOSSBLACK", "M_VISOR",
      "M_HELMET", "M_LED", "M_DARKMECH", "M_ALU", "M_STEEL", "M_RUBBER",
      "M_FOOT", "M_LOGO", "M_DARKGREY",
    ],
    "Optimus material identities",
  );
  assert.deepEqual(
    [
      model.materials.M_SHELL.type,
      model.materials.M_SHELL.roughness,
      model.materials.M_SHELL.ior,
      Boolean(model.materials.M_SHELL.roughnessNode),
      Boolean(model.materials.M_SHELL.normalNode),
    ],
    ["MeshPhysicalNodeMaterial", 0.34, 1.47, true, true],
    "Optimus white shell material contract",
  );
  assert.deepEqual(
    [
      model.materials.M_DARKMECH.metalness,
      model.materials.M_DARKMECH.roughness,
      Boolean(model.materials.M_DARKMECH.roughnessNode),
      Boolean(model.materials.M_DARKMECH.normalNode),
    ],
    [0.72, 0.42, true, true],
    "Optimus dark mechanism material contract",
  );
  assert.deepEqual(
    [model.materials.M_VISOR.roughness, model.materials.M_VISOR.ior],
    [0.018, 1.58],
    "Optimus visor material contract",
  );
  assert.deepEqual(
    [model.materials.M_LED.type, model.materials.M_LED.emissiveIntensity],
    ["MeshStandardNodeMaterial", 11],
    "Optimus emissive sensor material contract",
  );
  assertVector(
    bounds.min.toArray(),
    [-0.28222090005874634, -0.18700000643730164, -0.0016486322274431586],
    "Optimus bounds minimum",
    1e-8,
  );
  assertVector(
    bounds.max.toArray(),
    [0.28222090005874634, 0.19033148884773254, 1.7320995330810547],
    "Optimus bounds maximum",
    1e-8,
  );

  model.dispose();
}

testPorcelainBrassSubmarineHullParity();
testEzTreeAshParity();
testSpectralDispersiveGlassOpticsParity();
testSoftbodyJellyParity();
testTraversableWormholeShapeParity();
await testGpuCulledFlowerFieldParity();
await testPhysicalDiffractionGratingParity();
testProceduralOptimusHumanoidParity();

const sourceTraceManifest = JSON.parse(
  await readFile(
    new URL("../source_materials/trace-manifest.json", import.meta.url),
    "utf8",
  ),
);

async function loadTypeScriptModule(relativePath) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const result = await transform(source, {
    loader: "ts",
    format: "esm",
    platform: "neutral",
    sourcemap: false,
  });
  return import(`data:text/javascript;charset=utf-8,${encodeURIComponent(result.code)}`);
}

async function testNewExampleContracts() {
  const sandConfig = await loadTypeScriptModule(
    "../skills/threejs-procedural-materials/examples/deformable-sand/source/config.ts",
  );
  const sandClock = await loadTypeScriptModule(
    "../skills/threejs-procedural-materials/examples/deformable-sand/source/simulation/clock.ts",
  );
  assert.deepEqual(
    [sandConfig.SAND.resolution, sandConfig.SAND.particles, sandConfig.SAND.maxContacts],
    [512, 16384, 8],
    "deformable sand simulation contract",
  );
  const clock = new sandClock.FixedClock(sandConfig.SAND.step, sandConfig.SAND.maxSteps);
  assert.equal(clock.advance(0), 0, "deformable sand clock initialisation");
  assert.equal(clock.advance(1000 / 120), 1, "deformable sand clock fixed step");
  assert.equal(clock.advance(1000), 4, "deformable sand clock catch-up cap");
  assert.ok(clock.droppedSeconds > 0, "deformable sand clock reports dropped time");

  const coastalCoast = await import(
    new URL(
      "../skills/threejs-spectral-ocean/examples/ocean-beach-waves/source/coast.js",
      import.meta.url,
    ),
  );
  const coastalSimulation = await import(
    new URL(
      "../skills/threejs-spectral-ocean/examples/ocean-beach-waves/source/simulation.js",
      import.meta.url,
    ),
  );
  assert.deepEqual(
    [coastalCoast.GRID.nx, coastalCoast.GRID.nz, coastalCoast.ROCKS.length],
    [241, 401, 14],
    "ocean beach coastal grid contract",
  );
  assert.ok(Number.isFinite(coastalCoast.terrainHeight(0, -20)), "coastal terrain height");
  assert.ok(Number.isFinite(coastalCoast.bedHeight(0, -20)), "coastal bed height");
  const simulation = new coastalSimulation.ShoreSimulation();
  const before = simulation.metrics();
  simulation.step(1 / 60);
  const after = simulation.metrics();
  assert.equal(after.nonfinite, 0, "ocean beach solver finite-state gate");
  assert.ok(after.time > before.time, "ocean beach solver advances time");
  const packet = simulation.pack();
  assert.equal(packet.surface.length, coastalCoast.GRID.nx * coastalCoast.GRID.nz * 4, "ocean beach packed surface size");
  assert.equal(packet.flow.length, packet.surface.length, "ocean beach packed flow size");
}

const volumetricFireImplementation = await readFile(
  new URL(
    "../skills/threejs-procedural-vfx/examples/volumetric-fluid-fire/source/VolumetricFluidFire.ts",
    import.meta.url,
  ),
  "utf8",
);
const volumetricFireContext = await readFile(
  new URL(
    "../skills/threejs-procedural-vfx/examples/volumetric-fluid-fire/source/FluidFireShaderContext.ts",
    import.meta.url,
  ),
  "utf8",
);
const volumetricFirePreset = await readFile(
  new URL(
    "../skills/threejs-procedural-vfx/examples/volumetric-fluid-fire/volumetric-fluid-fire.js",
    import.meta.url,
  ),
  "utf8",
);

for (const textureName of [
  "curlNoise",
  "velA",
  "velB",
  "dyeA",
  "dyeB",
  "divergence",
  "pressA",
  "pressB",
  "vorticity",
  "sdf",
  "sdfVelocity",
]) {
  assert.match(
    volumetricFireContext,
    new RegExp(`makeDataTexture\\(\\s*"${textureName}"`),
    `volumetric fire is missing ${textureName} texture ownership`,
  );
}

assert.match(
  volumetricFireImplementation,
  /computeShaders\.vorticityPass[\s\S]*computeShaders\.advectPassCompute[\s\S]*computeShaders\.divPassCompute[\s\S]*computeShaders\.jacobiPassABCompute[\s\S]*computeShaders\.projectCompute[\s\S]*computeShaders\.advectDyeCompute[\s\S]*computeShaders\.objectsPassCompute[\s\S]*texture\.dye\.swap\(\)/,
  "volumetric fire compute order changed",
);
assert.match(
  volumetricFireImplementation,
  /fireColor\.mul\(radiance\)\.mul\(crispDensity\)\.mul\(fireAbsorption\)/,
  "volumetric fire final emission formula changed",
);
for (const presetContract of [
  "vorticityConfinementStrength: 7.01",
  "temperature: 8.5",
  "fireDensity: 0.644",
  "turbulenceFrecuency: 6.81",
  "collisionMargin: 0.034",
  "densityDissipation: 1.02",
  "cooling: 0.4831",
  "buoyancy: 2.3729",
  "curlNoiseMultiplier: 5.82",
  "colorRadianceMultiplier: 14.78",
  "temperatureAtMaxColor: 10",
]) {
  assert.ok(
    volumetricFirePreset.includes(presetContract),
    `volumetric fire preset changed: ${presetContract}`,
  );
}

const diamondMaterial = await readFile(
  new URL(
    "../skills/threejs-procedural-materials/examples/raytraced-diamond/diamond-material.js",
    import.meta.url,
  ),
  "utf8",
);

for (const [pattern, label] of [
  [/new MeshBVH\(geometry\.toNonIndexed\(\), \{ strategy: SAH \}\)/, "SAH BVH over a non-indexed copy"],
  [/rayDirection = refract\(rayDirection, normal, 1\.0 \/ ior\);/, "entry refraction"],
  [/rayOrigin = vWorldPosition \+ rayDirection \* 0\.001;/, "entry epsilon"],
  [/for\(float i = 0\.0; i < bounces; i\+\+\) \{/, "bounded bounce loop"],
  [/bvhIntersectFirstHit\( bvh, rayOrigin, rayDirection, faceIndices, faceNormal, barycoord, side, dist \);/, "BVH first-hit call"],
  [/vec3 hitPos = rayOrigin \+ rayDirection \* max\(dist - 0\.001, 0\.0\);/, "hit epsilon"],
  [/rayDirection = reflect\(rayDirection, faceNormal\);\s*rayOrigin = hitPos \+ rayDirection \* 0\.01;/, "internal reflection step"],
  [/max\(ior \* \(1\.0 - aberrationStrength\), 1\.0\)/, "red-channel IOR"],
  [/max\(ior \* \(1\.0 \+ aberrationStrength\), 1\.0\)/, "blue-channel IOR"],
  [/textureGrad\(envMap, rayDirectionR, dFdx\(correctMips \? directionCamPerfect: rayDirection\), dFdy\(correctMips \? directionCamPerfect: rayDirection\)\)\.r/, "mip-correct exit sampling"],
  [/ior = 2\.4,/, "default diamond IOR"],
  [/bounces = 3,/, "default bounce budget"],
  [/aberrationStrength = 0\.01,/, "default aberration strength"],
]) {
  assert.match(
    diamondMaterial,
    pattern,
    `raytraced diamond material changed: ${label}`,
  );
}

const glassMaterial = await readFile(
  new URL(
    "../skills/threejs-procedural-materials/examples/spectral-dispersive-glass/spectral-glass-material.js",
    import.meta.url,
  ),
  "utf8",
);
const glassOptics = await readFile(
  new URL(
    "../skills/threejs-procedural-materials/examples/spectral-dispersive-glass/glass-optics.js",
    import.meta.url,
  ),
  "utf8",
);

for (const [pattern, label] of [
  [/const IOR = 1\.5;/, "index at the d-line"],
  [/const ABBE = 32;/, "Abbe number"],
  [/const SPECTRAL_SAMPLES = 8;/, "spectral sample count"],
  [/const PATH_SEGMENTS = 4;/, "interior segment budget"],
  [/const EXIT_REFINEMENTS = 3;/, "exit-search refinement count"],
  [/const MIN_WALL = 0\.08;/, "minimum wall thickness"],
  [/const FROST_LOD = 0;/, "environment mip bias"],
  [/const TINT = "#d0edda";/, "transmission tint"],
  [/const TINT_DEPTH = 0\.5;/, "tint depth"],
  [/const FALLBACK_THICKNESS_RATIO = 0\.015;/, "silhouette fallback thickness"],
  [/const MAX_SEGMENT_RATIO = 3\.0;/, "maximum interior segment"],
  [/const THROUGHPUT_CUTOFF = 0\.004;/, "throughput break"],
  [/backFaceMaterial\.side = THREE\.DoubleSide;/, "unculled data pass"],
  [/backFaceMaterial\.depthNode = depth\.oneMinus\(\);/, "inverted data-pass depth"],
  [
    /outputNode = vec4\(\s*geometricWorldNormal,\s*positionWorld\.sub\(cameraPosition\)\.length\(\),\s*\);/,
    "data-pass normal and distance payload",
  ],
  [
    /normalize\(modelNormalMatrix\.mul\(normalLocal\)\)/,
    "never-flipped geometric world normal",
  ],
  [
    /texture\(renderTarget\.texture, uv, 0\)/,
    "explicit LOD 0 data fetch",
  ],
  [
    /tSeg\.assign\(dot\(Pb\.sub\(orig\), dir\)\.clamp\(MIN_WALL, maxSegment\)\);/,
    "exit-search segment update",
  ],
  [
    /const F2 = fresnelDielectric\(cos2, n, float\(1\.0\)\);/,
    "exit Fresnel against vacuum",
  ],
  [
    /thr\.mulAssign\(F2\);\s*dir\.assign\(reflect\(dir, NbN\)\);/,
    "Fresnel-weighted internal reflection",
  ],
  [
    /exp\(sigma\.mul\(sLen\.negate\(\)\)\)\s*\.mul\(thr\)/,
    "residual energy after the final segment",
  ],
  [
    /Csum\.div\(Wsum\.max\(vec3\(1e-4\)\)\)/,
    "running spectral weight normalisation",
  ],
  [
    /return this\.sampleEnvironment\(normalize\(normalWorldGeometry\), float\(0\.0\)\);/,
    "background direction from the translation-invariant geometric normal",
  ],
]) {
  assert.match(
    glassMaterial,
    pattern,
    `spectral dispersive glass material changed: ${label}`,
  );
}

for (const [pattern, label] of [
  [
    /select\(\s*sinT2\.greaterThanEqual\(1\.0\),\s*float\(1\.0\),/,
    "total internal reflection from the Fresnel expression",
  ],
  [
    /rs\.mul\(rs\)\.add\(rp\.mul\(rp\)\)\.mul\(0\.5\)\.clamp\(0\.0, 1\.0\)/,
    "unpolarised Fresnel average",
  ],
  [
    /gaussianLobe\(lam, float\(599\.8\), 37\.9, 31\.0\)\.mul\(1\.056\)/,
    "CIE X lobe",
  ],
  [
    /gaussianLobe\(lam, float\(568\.8\), 46\.9, 40\.5\)\.mul\(0\.821\)/,
    "CIE Y lobe",
  ],
  [
    /gaussianLobe\(lam, float\(437\.0\), 11\.8, 36\.0\)\.mul\(1\.217\)/,
    "CIE Z lobe",
  ],
  [
    /vec2\(ndc\.x\.mul\(0\.5\)\.add\(0\.5\), ndc\.y\.mul\(-0\.5\)\.add\(0\.5\)\)/,
    "V-inverted buffer projection",
  ],
  [
    /setStyle\(tint, LinearSRGBColorSpace\)\s*\.convertSRGBToLinear\(\)/,
    "exactly one sRGB decode on the transmission tint",
  ],
]) {
  assert.match(
    glassOptics,
    pattern,
    `spectral dispersive glass optics changed: ${label}`,
  );
}

const wormholeEffect = await readFile(
  new URL(
    "../skills/threejs-raymarched-space-effects/examples/traversable-wormhole-transit/wormhole-effect.js",
    import.meta.url,
  ),
  "utf8",
);
const wormholeSky = await readFile(
  new URL(
    "../skills/threejs-raymarched-space-effects/examples/traversable-wormhole-transit/celestial-spheres.js",
    import.meta.url,
  ),
  "utf8",
);

for (const [pattern, label] of [
  [/const W2M = 1\.42953;/, "lensing width to lensing parameter"],
  [/const W_OVER_RHO = 0\.05;/, "lensing width"],
  [/const A_OVER_RHO = 0\.005;/, "throat half-length"],
  [/const MAX_STEPS = 1024;/, "iteration cap"],
  [/const STEP_K = 0\.15;/, "adaptive step coefficient"],
  [/const ESCAPE_RADIUS = 260\.0;/, "escape radius"],
  [/const RENDER_SCALE = 0\.65;/, "render scale"],
  [/const ACCUMULATION_LIMIT = 512;/, "accumulation limit"],
  [
    /return vec3\( y\.z,\s*b\*ir\*ir,\s*b\*b\*drOfL\(y\.x\)\*ir\*ir\*ir \);/,
    "reduced geodesic derivative",
  ],
  [
    /h = min\(\(uThroatA - al\)\/max\(abs\(y\.z\), 1e-4\) \+ uStepK\*uMlens, 40\.0\*\(uThroatA \+ uRho\)\);/,
    "linear-exact step inside the neck",
  ],
  [
    /h = uStepK\*min\(r, uMlens \+ 0\.9\*\(al - uThroatA\)\);/,
    "curvature-scaled step outside the neck",
  ],
  [
    /if \(r > uREsc && drOfL\(y\.x\)\*y\.z > 0\.0\) \{ capped = false; break; \}/,
    "escape test requires a receding ray",
  ],
  [
    /vec3  D  = drOfL\(y\.x\)\*y\.z\*uf \+ \(b\/rf\)\*tf;/,
    "asymptotic exit direction",
  ],
  [
    /float foot = clamp\(0\.5\*\(length\(dFdx\(D\)\) \+ length\(dFdy\(D\)\)\), 0\.0, 0\.06\);/,
    "ray-bundle footprint",
  ],
  [/if \(capped\) foot = 0\.06;/, "capped rays fall back to mean radiance"],
  [
    /observer\.B\.crossVectors\(observer\.U, observer\.A\);/,
    "frame re-orthogonalisation keeps A x B = U",
  ],
  [
    /Math\.min\(Math\.max\(0\.1, r \* 0\.35\), 14\.0\)/,
    "sphere-radius-scaled travel speed",
  ],
  [
    /const jx = accumCount === 0 \? 0 : still \? halton2\(accumCount \+ 1\) - 0\.5 : Math\.random\(\) - 0\.5;/,
    "pixel-centred first accumulation sample",
  ],
  [
    /\(j \+ k \+ l \+ m\)\*0\.125\s*\+ \(4\.0\*e \+ 2\.0\*\(b \+ d \+ f \+ h\) \+ \(a \+ c \+ g \+ i\)\)\*0\.03125;/,
    "13-tap downsample weights",
  ],
]) {
  assert.match(
    wormholeEffect,
    pattern,
    `traversable wormhole transit changed: ${label}`,
  );
}

for (const [pattern, label] of [
  [/const float U_MIN = 0\.0016;/, "luminosity power-law clamp"],
  [/const float S0    = 0\.00030;/, "intrinsic angular radius of a star"],
  [
    /float k  = \(S0\*S0\)\/\(s\*s\);/,
    "flux-conserving point-spread peak",
  ],
  [
    /float flux  = lum\*pow\(u, -0\.6666667\)\*mix\(1\.0, 2\.3, giant\);/,
    "number-count luminosity law with giants",
  ],
  [
    /return mix\(sum, meanRad, smoothstep\(0\.30, 1\.25, foot\*cells\)\);/,
    "analytic mean-radiance fallback",
  ],
  [
    /vec3  ext  = exp\(-tau\*vec3\(1\.00, 1\.24, 1\.52\)\);/,
    "wavelength-dependent dust extinction",
  ],
  [
    /cRefl\*\(1\.10\*refl \+ 0\.25\*hii\)\)\*sqrt\(ext\);/,
    "nebulae sit inside half the dust column",
  ],
  [
    /\*\(\(sunR\*sunR\)\/\(sunR\*sunR \+ 2\.5066283\*sunR\*sunS \+ 2\.0\*sunS\*sunS\)\)/,
    "sun peak normalised by its own profile integral",
  ],
  [
    /return c\*\(1\.0 - s\.a\) \+ s\.rgb;/,
    "premultiplied planet composite",
  ],
]) {
  assert.match(
    wormholeSky,
    pattern,
    `traversable wormhole celestial spheres changed: ${label}`,
  );
}

async function assertMatchesSourceHash({
  source,
  collection,
  sourcePath,
  copiedPath,
  label,
}) {
  const expected = sourceTraceManifest.sources?.[source]?.[collection]?.[sourcePath];
  assert.match(
    expected ?? "",
    /^[a-f0-9]{64}$/,
    `${label}: missing source SHA-256 trace`,
  );
  const copied = await readFile(new URL(`../${copiedPath}`, import.meta.url));
  const actual = createHash("sha256").update(copied).digest("hex");
  assert.equal(actual, expected, `${label}: copied bytes differ from source trace`);
}

await testNewExampleContracts();

await Promise.all([
  assertMatchesSourceHash({
    source: "rainy-window",
    collection: "files",
    sourcePath: "shaders/rain.frag",
    copiedPath: "skills/threejs-temporal-surfaces/examples/refractive-window-rain/rain-window.frag",
    label: "window rain shader",
  }),
  assertMatchesSourceHash({
    source: "threejs-silhouette-pom",
    collection: "files",
    sourcePath: "ParallaxOcclusion.js",
    copiedPath: "skills/threejs-parallax-occlusion-mapping/examples/silhouette-relief/ParallaxOcclusion.js",
    label: "silhouette POM march",
  }),
  ...["ivy.ts", "flowers.ts", "leafTexture.ts", "wind.ts", "bvh.ts"].map((file) =>
    assertMatchesSourceHash({
      source: "vegetation-generator-threejs",
      collection: "files",
      sourcePath: `src/${file}`,
      copiedPath: `skills/threejs-procedural-vegetation/examples/procedural-surface-ivy/source/${file}`,
      label: `procedural ivy ${file}`,
    })
  ),
  ...[
    "AmbientOcclusion",
    "Color",
    "Displacement",
    "NormalGL",
    "Roughness",
  ].map((suffix) =>
    assertMatchesSourceHash({
      source: "grass-system-threejs",
      collection: "assets",
      sourcePath: `public/Ground103_1K-JPG_${suffix}.jpg`,
      copiedPath: `skills/threejs-procedural-materials/assets/hybrid-soil-moss-surface/Ground103_1K-JPG_${suffix}.jpg`,
      label: `hybrid soil PBR ${suffix}`,
    })
  ),
  ...[
    "AmbientOcclusion",
    "Color",
    "NormalGL",
    "Roughness",
  ].map((suffix) =>
    assertMatchesSourceHash({
      source: "grass-system-threejs",
      collection: "assets",
      sourcePath: `public/Moss002_1K-JPG_${suffix}.jpg`,
      copiedPath: `skills/threejs-procedural-materials/assets/hybrid-soil-moss-surface/moss/Moss002_1K-JPG_${suffix}.jpg`,
      label: `procedural moss ${suffix}`,
    })
  ),
  assertMatchesSourceHash({
    source: "grass-system-threejs",
    collection: "assets",
    sourcePath: "public/old_rusty_car_2.glb",
    copiedPath: "example-gallery/examples/threejs-precipitation-surfaces/snow-accumulation/assets/old_rusty_car_2.glb",
    label: "shared rusty car model",
  }),
  assertMatchesSourceHash({
    source: "n8python-diamonds",
    collection: "assets",
    sourcePath: "diamond.glb",
    copiedPath: "skills/threejs-procedural-materials/assets/raytraced-diamond/diamond.glb",
    label: "faceted diamond model",
  }),
  assertMatchesSourceHash({
    source: "author-local-glass-sculpture",
    collection: "assets",
    sourcePath: "sculpture.glb",
    copiedPath: "example-gallery/examples/threejs-procedural-materials/spectral-dispersive-glass/assets/sculpture.glb",
    label: "glass sculpture subject",
  }),
  assertMatchesSourceHash({
    source: "author-local-glass-sculpture",
    collection: "assets",
    sourcePath: "bar.exr",
    copiedPath: "example-gallery/examples/threejs-procedural-materials/spectral-dispersive-glass/assets/bar.exr",
    label: "glass sculpture environment probe",
  }),
  assertMatchesSourceHash({
    source: "inkwell-webgpu-flowers",
    collection: "assets",
    sourcePath: "public/plant-lab/inkwell-flower-petal-variants-v2.png",
    copiedPath: "skills/threejs-procedural-vegetation/assets/gpu-culled-flower-field/flower-petal-variants.png",
    label: "flower petal variants atlas",
  }),
  assertMatchesSourceHash({
    source: "inkwell-webgpu-flowers",
    collection: "assets",
    sourcePath: "public/textures/hearth-grass-atlas-v6-palette.png",
    copiedPath: "skills/threejs-procedural-vegetation/assets/gpu-culled-flower-field/painted-grass-atlas.png",
    label: "flower field painted grass atlas",
  }),
  assertMatchesSourceHash({
    source: "author-local-diffraction-grating",
    collection: "assets",
    sourcePath: "pokemon_card.png",
    copiedPath: "example-gallery/examples/threejs-procedural-materials/physical-diffraction-grating/assets/card-art.png",
    label: "diffraction gallery card art",
  }),
  ...[
    "config.ts",
    "platform/shader.ts",
    "simulation/flux.ts",
    "simulation/clock.ts",
    "simulation/shaders.ts",
    "simulation/wave-reset-shader.ts",
    "simulation/solver.ts",
    "render/airborne-shadow.ts",
    "render/lighting.ts",
    "render/postprocess.ts",
    "render/water-reset.ts",
    "reset/effect.ts",
    "reset/viewport.ts",
    "reset/wgsl.ts",
    "input/strokes.ts",
  ].map((file) =>
    assertMatchesSourceHash({
      source: "sandboard",
      collection: "files",
      sourcePath: `src/${file}`,
      copiedPath: `skills/threejs-procedural-materials/examples/deformable-sand/source/${file}`,
      label: `deformable sand ${file}`,
    }),
  ),
  assertMatchesSourceHash({
    source: "sandboard",
    collection: "assets",
    sourcePath: "public/scene_assets/coconut_tree.glb",
    copiedPath: "example-gallery/examples/threejs-procedural-materials/deformable-sand/assets/coconut_tree.glb",
    label: "deformable sand tree asset",
  }),
  ...[
    "coast.js",
    "terrain-grid.js",
    "simulation.js",
    "surface.js",
    "spray.js",
    "noise.js",
    "world.js",
    "solver-accelerator.js",
    "solver-kernels.ts",
  ].map((file) =>
    assertMatchesSourceHash({
      source: "coastal-simulation",
      collection: "files",
      sourcePath: `src/${file}`,
      copiedPath: `skills/threejs-spectral-ocean/examples/ocean-beach-waves/source/${file}`,
      label: `ocean beach waves ${file}`,
    }),
  ),
  assertMatchesSourceHash({
    source: "coastal-simulation",
    collection: "assets",
    sourcePath: "src/solver-kernels.wasm",
    copiedPath: "skills/threejs-spectral-ocean/assets/ocean-beach-waves/solver-kernels.wasm",
    label: "ocean beach waves solver kernel",
  }),
  assertMatchesSourceHash({
    source: "coastal-simulation",
    collection: "assets",
    sourcePath: "initial-state.bin.gz",
    copiedPath: "skills/threejs-spectral-ocean/assets/ocean-beach-waves/initial-state.bin.gz",
    label: "ocean beach waves warm state",
  }),
]);
async function testWaterAndDenimContracts() {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const denimRoot = path.join(root, "skills/threejs-procedural-materials/examples/simulated-tearable-denim");
  const waterPath = path.join(root, "skills/threejs-water-optics/examples/photoreal-water/photoreal-water.js");
  const raw = {
    name: "wgsl-text",
    setup(builder) {
      builder.onResolve({ filter: /\?raw$/ }, args => ({
        path: path.resolve(args.resolveDir, args.path.slice(0, -4)), namespace: "wgsl",
      }));
      builder.onLoad({ filter: /.*/, namespace: "wgsl" }, async args => ({
        contents: `export default ${JSON.stringify(await readFile(args.path, "utf8"))};`, loader: "js",
      }));
    },
  };
  async function bundle(entry) {
    const result = await build({ entryPoints: [entry], bundle: true, write: false, format: "esm", platform: "node", plugins: [raw], logLevel: "silent" });
    return result.outputFiles[0].text;
  }
  async function importText(code) {
    return import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
  }

  const fabric = await importText(await bundle(path.join(denimRoot, "source/simulation/fabric-config.ts")));
  const scene = fabric.compileScene(fabric.defaultSceneSpecs());
  assert.equal(scene.nodeCount, 20930);
  assert.deepEqual(scene.layers.map(layer => [layer.nx, layer.ny]), [[182, 115]]);
  assert.equal(fabric.sceneHash(scene), 4202117243, "mechanics/initial-state contract");
  assert.equal(scene.fieldDamage.length, 2260440);
  assert.equal(scene.fieldDamage.filter(value => value === 255).length, 2619, "initial absent yarns");
  assert.ok(Math.abs(scene.mass.reduce((a, b) => a + b, 0) - 0.0808333343999998) < 1e-12);

  const { settledDenimDrape } = await import(path.join(root, "skills/threejs-procedural-materials/assets/simulated-tearable-denim/settled-drape.js"));
  const drape = settledDenimDrape();
  assert.deepEqual(Array.from(new Uint32Array(drape, 0, 4)), [0x50415244, 1, 20930, 4202117243]);
  assert.equal(drape.byteLength, 16 + scene.nodeCount * 16);
  assert.equal(createHash("sha256").update(new Uint8Array(drape)).digest("hex"), "f19a848ed17dca0a6ae2aa3b70e45331c36d9439cd6b00caca094adc2d5ce9bb");
  const positions = new Float32Array(drape, 16);
  assert.ok(positions.every(Number.isFinite));

  const { pebbleTextureURL } = await import(path.join(root, "skills/threejs-water-optics/assets/photoreal-water/pebbles.js"));
  const jpeg = Buffer.from(pebbleTextureURL.split(",")[1], "base64");
  assert.equal(jpeg.readUInt16BE(0), 0xffd8);
  assert.equal(jpeg.readUInt16BE(jpeg.length - 2), 0xffd9);
  assert.equal(createHash("sha256").update(jpeg).digest("hex"), "4b0433540958e448f638d64941222ac3172281950819f7559487457944fbc254");

  const water = await readFile(waterPath, "utf8");
  await bundle(waterPath);
  assert.ok(!/document\.|requestAnimationFrame|innerWidth|innerHeight/.test(water), "water has no page runtime");
  assert.match(water, /const N = 256, LOGN = 8/);
  assert.match(water, /const IORS = \[1\.3315, 1\.3335, 1\.3365\]/);
  assert.match(water, /const TARGET_SLOPE = 0\.078/);
  assert.match(water, /const float SC = 0\.41, WB = 0\.10/);

  // Exercise the public lifecycle without a browser or GPU. Shader compilation
  // is stubbed; executing the passes still detects missing JavaScript bindings.
  const previousImage = globalThis.Image;
  globalThis.Image = class {
    set src(value) { queueMicrotask(() => this.onload()); }
  };
  try {
    const { createPhotorealWater } = await import(waterPath);
    for (const glare of [false, true]) {
      const constants = new Map();
      const gl = new Proxy({ canvas: { width: 1, height: 1 } }, {
        get(target, key) {
          if (key in target) return target[key];
          if (/^[A-Z][A-Z_0-9]*$/.test(key)) {
            if (!constants.has(key)) constants.set(key, constants.size + 1);
            return constants.get(key);
          }
          if (key === "getExtension") return () => ({});
          if (key === "getParameter") return () => 16;
          if (key === "getShaderParameter") return () => true;
          if (key === "getProgramParameter") return (_, parameter) => parameter === gl.ACTIVE_UNIFORMS ? 0 : true;
          if (key === "checkFramebufferStatus") return () => gl.FRAMEBUFFER_COMPLETE;
          if (key === "uniform1f") return (_, value) => assert.ok(Number.isFinite(value), "finite water uniform");
          if (key.startsWith("create")) return () => ({});
          return () => {};
        },
      });
      const effect = await createPhotorealWater(gl, { glare });
      try {
        effect.setSize(32, 18);
        const basis = { pos: [0, 1.55, 0], f: [0, -Math.sin(0.72), -Math.cos(0.72)], r: [1, 0, 0], u: [0, Math.cos(0.72), -Math.sin(0.72)] };
        for (const mode of ["final", "caustics", "no-post", "glare"]) {
          effect.setDebugMode(mode);
          effect.render(0, basis, [0, 1, 0]);
        }
        effect.addDrop(0, -1);
        effect.render(1 / 60, basis, [0, 1, 0], false);
      } finally {
        effect.dispose();
      }
    }
  } finally {
    if (previousImage === undefined) delete globalThis.Image;
    else globalThis.Image = previousImage;
  }
  const implementation = await bundle(path.join(denimRoot, "simulated-tearable-denim.js"));
  assert.ok(!implementation.includes("floor.base"));
  assert.ok(!implementation.includes("vsMount"));
  assert.ok(!implementation.includes("creature"));
  assert.ok(!implementation.includes("AudioContext"));

  async function allFiles(directory) {
    const files = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) files.push(...await allFiles(file));
      else files.push(file);
    }
    return files;
  }
  for (const file of await allFiles(path.join(denimRoot, "source"))) {
    const text = await readFile(file, "utf8");
    assert.ok(!/source_materials|\/Users\/|Break-That-Denim/.test(text), `${file}: self-contained effect`);
  }

}

async function testSculptedCastleParity() {
  const {
    createSculptedCastle,
    bakeCarveTexture,
    CASTLE_GATE,
    LOD_NEAR,
  } = await import("../skills/threejs-procedural-architecture/examples/sculpted-castle/sculpted-castle.js");
  const { Vector3 } = await import("three");

  const castle = createSculptedCastle();
  try {
    assert.equal(castle.root.name, "SCULPTED_CASTLE_KEEP", "sculpted castle root name");
    assert.equal(LOD_NEAR, 120, "sculpted castle LOD near threshold");
    assert.deepEqual(
      [castle.stats.chunkCount, castle.stats.tierCount, castle.stats.domeCount],
      [5, 11, 2],
      "sculpted castle chunk, tier, and dome counts",
    );
    assert.equal(castle.stats.mergedTriangles, 1720646, "sculpted castle merged triangle count");
    assert.equal(castle.stats.instanceCount, 17482, "sculpted castle total instance count");
    assert.deepEqual(
      castle.stats.partCounts,
      {
        colBase: 3934,
        colShaft: 3934,
        colCap: 3934,
        modillion: 2030,
        turret: 102,
        urn: 56,
        kiosk: 20,
        balArc: 3366,
        spike: 104,
        spire: 2,
      },
      "sculpted castle instanced part counts",
    );
    assertVector(
      castle.stats.bounds.min,
      [-48.124107360839844, 0, -49.95613158228787],
      "sculpted castle bounds minimum",
      1e-5,
    );
    assertVector(
      castle.stats.bounds.max,
      [48.124107360839844, 159.65428924560547, 49.95613158228787],
      "sculpted castle bounds maximum",
      1e-5,
    );
    assertVector(
      [CASTLE_GATE.frontZ, CASTLE_GATE.backZ, CASTLE_GATE.halfOpen],
      [48, -48, 6.35],
      "sculpted castle gate coordinates",
      1e-5,
    );

    const carveTex = bakeCarveTexture(64);
    try {
      const data = carveTex.image.data;
      let nonZeroR = 0;
      let nonZeroG = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 0) nonZeroR++;
        if (data[i + 1] > 0) nonZeroG++;
      }
      assert.ok(nonZeroR > 0 && nonZeroG > 0, "sculpted castle baked relief channels populated");
    } finally {
      carveTex.dispose();
    }

    castle.updateLOD(new Vector3(0, 40, 60));
    assert.ok(castle.chunks.some((g) => g.userData.lod === 0), "sculpted castle near LOD activates close up");
    castle.updateLOD(new Vector3(0, 200, 600));
    assert.ok(castle.chunks.every((g) => g.userData.lod === 1), "sculpted castle far LOD activates at distance");

    for (const mode of ["clay", "recess-tint", "chunk-topology", "final"]) {
      castle.setDebugMode(mode);
      assert.equal(castle.debugMode, mode, `sculpted castle debug mode ${mode}`);
    }
  } finally {
    castle.dispose();
  }
}

await testWaterAndDenimContracts();
await testSculptedCastleParity();
console.log("Reference example parity checks passed.");
