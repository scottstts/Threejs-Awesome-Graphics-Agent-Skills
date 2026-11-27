import * as THREE from "three/webgpu";
import {
  Fn,
  pass,
  mrt,
  sample,
  normalView,
  packNormalToRGB,
  unpackRGBToNormal,
  builtinAOContext,
  screenUV,
  convertToTexture,
  vec3,
  vec4,
  float,
  mix,
  smoothstep,
  pow,
  max,
  dot,
  step,
  normalize,
  positionWorld,
  positionWorldDirection,
  mx_fractal_noise_float,
  sRGBTransferOETF,
  uniform,
} from "three/tsl";
import { ao } from "three/addons/tsl/display/GTAONode.js";
import { bloom } from "three/addons/tsl/display/BloomNode.js";
import { fxaa } from "three/addons/tsl/display/FXAANode.js";
import { denoise } from "three/addons/tsl/display/DenoiseNode.js";
import {
  createSculptedCastle,
  DEFAULT_SUN_DIR,
} from "/skills/threejs-procedural-architecture/examples/sculpted-castle/sculpted-castle.js";

const SUN_COLOR = new THREE.Color(1.0, 0.925, 0.80);
const uSun = uniform(DEFAULT_SUN_DIR.clone());

const afterglow = Fn(([d]) => {
  const az = d.z.negate().div(max(vec3(d.x, 0, d.z).length(), 1e-4));
  const w = smoothstep(-0.05, 0.9, az);
  const h = d.y;
  const ramp = mix(
    mix(
      mix(vec3(1.0, 0.66, 0.24), vec3(1.0, 0.36, 0.10), smoothstep(0.0, 0.07, h)),
      vec3(0.93, 0.17, 0.16),
      smoothstep(0.06, 0.15, h),
    ),
    vec3(0.78, 0.22, 0.40),
    smoothstep(0.14, 0.24, h),
  );
  const cover = smoothstep(0.27, 0.10, h).mul(smoothstep(-0.25, -0.02, h).mul(0.3).add(0.7));
  const q = vec3(d.x, 0, d.z).div(max(h, 0.0).add(0.16));
  const streak = mx_fractal_noise_float(vec3(q.x.mul(0.55), q.z.mul(2.6), 3.7), 4, 2.1, 0.55).mul(0.5).add(0.5);
  const wisp = mx_fractal_noise_float(vec3(q.x.mul(2.2), q.z.mul(7.0), 9.1), 3, 2.2, 0.5).mul(0.5).add(0.5);
  const cirrus = smoothstep(0.50, 0.78, streak.mul(0.75).add(wisp.mul(0.25)))
    .mul(smoothstep(0.015, 0.07, h))
    .mul(smoothstep(0.34, 0.14, h));
  const lit = mix(vec3(1.0, 0.80, 0.40), vec3(1.0, 0.46, 0.34), smoothstep(0.05, 0.26, h)).mul(1.05);
  const a = max(cover, cirrus.mul(0.9)).mul(w);
  return vec4(mix(ramp.mul(0.95), lit, cirrus), a);
});

const skyRadiance = Fn(([d]) => {
  const h = max(d.y, -0.2);
  const zen = vec3(0.004, 0.030, 0.165);
  const mid = vec3(0.012, 0.085, 0.34);
  const hor = vec3(0.16, 0.30, 0.60);
  const t1 = smoothstep(-0.05, 0.22, h);
  const t2 = smoothstep(0.12, 0.8, h);
  const base = mix(mix(hor, mid, t1), zen, t2);
  const mu = max(dot(d, uSun), 0);
  const glow = pow(mu, 8).mul(0.10).add(pow(mu, 64).mul(0.35));
  const ag = afterglow(d);
  return mix(base.add(vec3(1.0, 0.9, 0.75).mul(glow)), ag.rgb, ag.a);
});

function buildEnvironmentProbe(renderer, scene) {
  const envScene = new THREE.Scene();
  const mat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide });
  const d = normalize(positionWorldDirection);
  const zen = vec3(0.10, 0.27, 0.86);
  const cloudLit = vec3(0.92, 0.95, 1.0);
  const cloudShade = vec3(0.42, 0.52, 0.78);
  const below = vec3(0.80, 0.72, 0.58);
  const toSun = dot(normalize(vec3(d.x, 0, d.z)), normalize(vec3(uSun.x, 0, uSun.z))).mul(0.5).add(0.5);
  const cloud = mix(cloudLit, cloudShade, toSun.mul(0.75));
  const up = mix(cloud, zen, smoothstep(0.30, 0.82, d.y));
  mat.colorNode = mix(below, up, smoothstep(-0.10, 0.06, d.y));
  const sphereGeo = new THREE.SphereGeometry(50, 48, 24);
  envScene.add(new THREE.Mesh(sphereGeo, mat));
  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(envScene, 0, 0.1, 200);
  scene.environment = rt.texture;
  scene.environmentIntensity = 0.17;
  pmrem.dispose();
  sphereGeo.dispose();
  mat.dispose();
  return rt;
}

function createGroundPlinth() {
  const geo = new THREE.CircleGeometry(420, 64);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshStandardNodeMaterial();
  const r = positionWorld.xz.length();
  const grain = mx_fractal_noise_float(positionWorld.mul(0.08), 3, 2.0, 0.5).mul(0.5).add(0.5);
  const stoneColor = mix(vec3(0.72, 0.70, 0.67), vec3(0.80, 0.78, 0.75), grain);
  const horizonTint = vec3(0.38, 0.48, 0.68);
  mat.colorNode = mix(stoneColor, horizonTint, smoothstep(95, 360, r));
  mat.roughnessNode = float(0.86);
  mat.metalnessNode = float(0.0);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = -0.04;
  mesh.receiveShadow = true;
  return { mesh, geo, mat };
}

function fitStaticShadow(sun, box) {
  sun.updateMatrixWorld();
  sun.target.updateMatrixWorld();
  const cam = sun.shadow.camera;
  cam.position.copy(sun.position);
  cam.lookAt(sun.target.position);
  cam.updateMatrixWorld();
  const inv = cam.matrixWorld.clone().invert();
  const b2 = new THREE.Box3();
  const v = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    v.set(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z).applyMatrix4(inv);
    b2.expandByPoint(v);
  }
  cam.left = b2.min.x - 6;
  cam.right = b2.max.x + 6;
  cam.bottom = b2.min.y - 6;
  cam.top = b2.max.y + 6;
  cam.near = Math.max(1, -b2.max.z - 25);
  cam.far = Math.max(1200, -b2.min.z + 450);
  cam.updateProjectionMatrix();
  sun.shadow.autoUpdate = false;
  sun.shadow.needsUpdate = true;
}

export default {
  backend: "webgpu",
  renderer: {
    options: { antialias: false, reversedDepthBuffer: true },
    exposure: 0.80,
  },
  camera: {
    fov: 38,
    near: 0.5,
    far: 3200,
    position: [176, 122, 236],
  },
  controls: {
    target: [-2, 72, 2],
    minDistance: 68,
    maxDistance: 460,
    minPolarAngle: 0.08,
    maxPolarAngle: Math.PI * 0.49,
    enablePan: true,
  },
  async setup({ renderer, scene, camera, controls }) {
    const thumbnailMode = new URLSearchParams(window.location.search).get("galleryThumbnail") === "1";

    scene.backgroundNode = skyRadiance(normalize(positionWorldDirection));
    const envTarget = buildEnvironmentProbe(renderer, scene);

    const sun = new THREE.DirectionalLight(SUN_COLOR, 6.6);
    const tgt = new THREE.Vector3(0, 72, 0);
    sun.position.copy(tgt).addScaledVector(DEFAULT_SUN_DIR, 480);
    sun.target.position.copy(tgt);
    sun.castShadow = true;
    const maxDim = renderer.backend.device?.limits?.maxTextureDimension2D || 4096;
    const shadowSize = Math.min(8192, maxDim);
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.bias = -0.00003;
    sun.shadow.normalBias = 0.03;
    sun.shadow.radius = 1.5;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    scene.add(sun, sun.target);

    const hemi = new THREE.HemisphereLight(0x000000, 0xffc98a, 0.16);
    scene.add(hemi);

    // Depth/normal pre-pass -> denoised GTAO feeding indirect bounce and ambient lighting.
    const prePass = pass(scene, camera);
    prePass.transparent = false;
    prePass.setMRT(mrt({ output: packNormalToRGB(normalView) }));
    const nrm = sample((uvNode) => unpackRGBToNormal(prePass.getTextureNode().sample(uvNode)));
    const preDepth = prePass.getTextureNode("depth");
    const aoPass = ao(preDepth, nrm, camera);
    aoPass.resolutionScale = 1;
    aoPass.radius.value = 4.5;
    aoPass.thickness.value = 2.5;
    aoPass.scale.value = 1.7;
    aoPass.samples.value = 16;
    aoPass.distanceExponent.value = 1.2;
    const den = denoise(aoPass.getTextureNode(), preDepth, nrm, camera);
    den.radius.value = 6;
    den.lumaPhi.value = 6;
    den.depthPhi.value = 3;
    den.normalPhi.value = 4;
    const aoValue = convertToTexture(vec4(den.r, den.r, den.r, 1)).sample(screenUV).r;

    const castle = createSculptedCastle({ aoNode: aoValue, sunDir: DEFAULT_SUN_DIR });
    scene.add(castle.root);

    const ground = createGroundPlinth();
    scene.add(ground.mesh);

    fitStaticShadow(sun, castle.bounds);

    // Beauty pass with 4x MSAA, subtle veiling glare, soft-knee shoulder, and FXAA.
    const pipeline = new THREE.RenderPipeline(renderer);
    pipeline.outputColorTransform = false;
    const scenePass = pass(scene, camera, { samples: 4 });
    scenePass.contextNode = builtinAOContext(aoValue);
    let c = scenePass.getTextureNode("output").rgb;
    const hdr = convertToTexture(c.max(0).min(5));
    const glare = bloom(hdr, 1, 0.5, 1.15);
    c = hdr.rgb.add(glare.rgb.mul(0.07));
    const EXPOSURE = uniform(0.80);
    const x = c.mul(EXPOSURE);
    const KNEE = 0.72;
    c = mix(x, x.sub(KNEE).div(1 - KNEE).tanh().mul(1 - KNEE).add(KNEE), step(KNEE, x)).clamp(0, 1);
    c = c.pow(vec3(1.08));
    const lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
    c = mix(vec3(lum), c, 1.10).clamp(0, 1);
    pipeline.outputNode = fxaa(convertToTexture(vec4(sRGBTransferOETF(c), 1)));

    castle.updateLOD(camera.position);
    await renderer.compileAsync(scene, camera);

    let settled = false;
    return {
      setDebugMode(modeName) {
        castle.setDebugMode(modeName);
      },
      update() {
        if (controls) {
          if (controls.target.y < 2) controls.target.y = 2;
          if (camera.position.y < 3) camera.position.y = 3;
        }
        castle.updateLOD(camera.position);
      },
      async render() {
        if (thumbnailMode && !settled) {
          settled = true;
          sun.shadow.needsUpdate = true;
          for (let i = 0; i < 4; i++) {
            await pipeline.render();
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
          await pipeline.render();
          return;
        }
        await pipeline.render();
      },
      metrics() {
        return {
          castle:
            `${castle.stats.chunkCount} chunks / ` +
            `${castle.stats.mergedTriangles.toLocaleString()} merged tris / ` +
            `${castle.stats.instanceCount.toLocaleString()} instances`,
        };
      },
      dispose() {
        castle.dispose();
        ground.geo.dispose();
        ground.mat.dispose();
        envTarget.dispose();
        pipeline.dispose?.();
      },
    };
  },
};
