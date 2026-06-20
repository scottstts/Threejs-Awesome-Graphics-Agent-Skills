import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { SpectralOceanSystem } from "./ocean-system.js";
import { validateFragmentIFFT } from "./fft-pipeline.js";
import {
  createOceanMaterial,
  createSkyMaterial,
  createSpectrumDebugMaterial,
  updateOceanMaterialTextures,
} from "./ocean-material.js";

const fallbackRuntime = {
  state: { paused: false, dpr: 1, timeScale: 1, debugMode: "final" },
  bindRenderer() {},
  setCaptureCanvas() {},
  onStateChange(callback) {
    callback(this.state);
    return () => {};
  },
  frameDelta(delta) {
    return delta;
  },
  reportMetrics() {},
  ready() {},
};

const { exampleRuntime = fallbackRuntime } = await import(
  "/dev/example-gallery/runtime/example-runtime.js"
).catch(() => ({}));

const canvas = document.querySelector("canvas");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: true,
});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.setClearColor(0x9fb8cc, 1);
exampleRuntime.bindRenderer(renderer);
exampleRuntime.setCaptureCanvas(canvas);

const fftValidation = validateFragmentIFFT(renderer);
if (!fftValidation.pass) {
  throw new Error(
    `IFFT validation failed: impulse=${fftValidation.impulseError}, frequency=${fftValidation.frequencyError}`,
  );
}

const sunDirection = new THREE.Vector3();
const sunAzimuth = THREE.MathUtils.degToRad(135);
const sunElevation = THREE.MathUtils.degToRad(28);
sunDirection
  .set(
    Math.cos(sunElevation) * Math.sin(sunAzimuth),
    Math.sin(sunElevation),
    Math.cos(sunElevation) * Math.cos(sunAzimuth),
  )
  .normalize();

const options = {
  resolution: 64,
  patchLengths: [250, 17, 5],
  boundaryFactor: 6,
  gravity: 9.81,
  depth: 500,
  choppiness: 1.3,
  foamRecovery: 0.4,
  amplitude: 0.72,
  seed: 481516,
  sunDirection,
  local: {
    scale: 1,
    windSpeed: 16,
    directionDegrees: 45,
    fetchMeters: 100000,
    directionality: 1,
    swell: 0.2,
    peakEnhancement: 3.3,
    shortWaveFade: 0.02,
  },
  swell: {
    scale: 0.8,
    windSpeed: 2,
    directionDegrees: 70,
    fetchMeters: 300000,
    directionality: 1,
    swell: 1,
    peakEnhancement: 3.3,
    shortWaveFade: 0.01,
  },
};

const ocean = new SpectralOceanSystem(renderer, options);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x9fb8cc, 0.0045);

const camera = new THREE.PerspectiveCamera(55, 1, 0.5, 30000);
camera.position.set(0, 16, 68);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.target.set(0, 0, -20);
controls.maxPolarAngle = Math.PI * 0.495;
controls.update();

const oceanMaterial = createOceanMaterial(ocean.cascades, options);
const oceanGeometry = new THREE.PlaneGeometry(400, 400, 520, 520);
oceanGeometry.rotateX(-Math.PI * 0.5);
const oceanMesh = new THREE.Mesh(oceanGeometry, oceanMaterial);
oceanMesh.frustumCulled = false;
scene.add(oceanMesh);

const sky = new THREE.Mesh(
  new THREE.SphereGeometry(12000, 48, 24),
  createSkyMaterial(options),
);
scene.add(sky);

const debugScene = new THREE.Scene();
const debugCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const debugQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
debugScene.add(debugQuad);
const spectrumMaterials = ocean.cascades.map((cascade) =>
  createSpectrumDebugMaterial(cascade.spectrum)
);

const debugModeMap = new Map([
  ["final", 0],
  ["cascade-bands", 1],
  ["normals", 2],
  ["jacobian", 3],
]);
let runtimeState = exampleRuntime.state;
exampleRuntime.onStateChange((state) => {
  runtimeState = state;
  oceanMaterial.uniforms.debugMode.value =
    debugModeMap.get(state.debugMode) ?? 0;
});

function resize() {
  const width = Math.max(1, canvas.clientWidth);
  const height = Math.max(1, canvas.clientHeight);
  const dpr = runtimeState.dpr;
  const bufferSize = new THREE.Vector2();
  renderer.getDrawingBufferSize(bufferSize);
  if (
    bufferSize.x !== Math.round(width * dpr) ||
    bufferSize.y !== Math.round(height * dpr)
  ) {
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
}

const clock = new THREE.Clock();
let elapsed = 18.5;
let metricTime = 0;
let frames = 0;

renderer.setAnimationLoop(() => {
  resize();
  const rawDelta = Math.min(clock.getDelta(), 0.05);
  const delta = exampleRuntime.frameDelta(rawDelta);
  elapsed += delta;

  ocean.update(elapsed, Math.max(delta, 1 / 120));
  updateOceanMaterialTextures(oceanMaterial, ocean.cascades);
  oceanMaterial.uniforms.time.value = elapsed;
  controls.update();

  if (runtimeState.debugMode.startsWith("spectrum-")) {
    const index = Number.parseInt(runtimeState.debugMode.at(-1), 10);
    debugQuad.material = spectrumMaterials[index];
    renderer.render(debugScene, debugCamera);
  } else {
    renderer.render(scene, camera);
  }

  metricTime += rawDelta;
  frames += 1;
  if (metricTime >= 1) {
    exampleRuntime.reportMetrics({
      fps: Math.round(frames / metricTime),
      resolution: `${options.resolution}² × ${ocean.cascades.length}`,
      fftPasses: ocean.cascades.length * 2 * (2 * 6 + 3),
      fftTest: `pass ${Math.max(
        fftValidation.impulseError,
        fftValidation.frequencyError,
      ).toExponential(1)}`,
      triangles: renderer.info.render.triangles.toLocaleString(),
    });
    metricTime = 0;
    frames = 0;
  }
});

exampleRuntime.ready();
