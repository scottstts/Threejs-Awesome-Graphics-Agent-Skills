import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  applySnowToModelMaterial,
  createModelSnowUniforms,
  createFrozenLake,
  createLakeUniforms,
  createSharedWeatherUniforms,
  createSnow,
  createSnowyGroundMaterial,
  snowDebugModes,
} from "/skills/threejs-precipitation-surfaces/examples/snow-accumulation/snow-system.js";

async function loadAsphaltTextures(resolveAsset, renderer) {
  const loader = new THREE.TextureLoader();
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const make = async (name, srgb = false) => {
    const texture = await loader.loadAsync(resolveAsset(`assets/asphalt/${name}`));
    if (srgb) texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.anisotropy = maxAnisotropy;
    return texture;
  };
  return {
    map: await make("Asphalt025C_1K-JPG_Color.jpg", true),
    aoMap: await make("Asphalt025C_1K-JPG_AmbientOcclusion.jpg"),
    roughnessMap: await make("Asphalt025C_1K-JPG_Roughness.jpg"),
    normalMap: await make("Asphalt025C_1K-JPG_NormalGL.jpg"),
    displacementMap: await make("Asphalt025C_1K-JPG_Displacement.jpg"),
  };
}

function disposeMaterial(material, seenTextures) {
  const textureKeys = [
    "map",
    "aoMap",
    "roughnessMap",
    "metalnessMap",
    "normalMap",
    "emissiveMap",
    "alphaMap",
  ];
  for (const key of textureKeys) {
    const texture = material[key];
    if (texture && !seenTextures.has(texture)) {
      seenTextures.add(texture);
      texture.dispose();
    }
  }
  material.dispose();
}

function prepareSnowModel(root, sharedUniforms) {
  const snowUniforms = createModelSnowUniforms(sharedUniforms);
  const seenTextures = new Set();
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= box.min.y;

  const group = new THREE.Group();
  group.add(root);
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.castShadow = true;
    obj.receiveShadow = true;
    const patchMaterial = (material) => {
      const patched = (material ?? new THREE.MeshStandardMaterial()).clone();
      applySnowToModelMaterial(patched, snowUniforms);
      return patched;
    };
    obj.material = Array.isArray(obj.material)
      ? obj.material.map(patchMaterial)
      : patchMaterial(obj.material);
  });
  function refreshMatrix() {
    group.updateMatrixWorld(true);
    snowUniforms.uModelInv.value.copy(group.matrixWorld).invert();
  }
  refreshMatrix();
  return {
    root: group,
    snowUniforms,
    refreshMatrix,
    dispose() {
      root.traverse((obj) => {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) {
          for (const material of obj.material) disposeMaterial(material, seenTextures);
        } else if (obj.material) {
          disposeMaterial(obj.material, seenTextures);
        }
      });
    },
  };
}

const filmGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.15 },
    uVignetteSize: { value: 0.4 },
    uGrain: { value: 0.095 },
    uChroma: { value: 0.0025 },
    uContrast: { value: 1.0 },
    uSaturation: { value: 1.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float uTime, uVignette, uVignetteSize, uGrain, uChroma, uContrast, uSaturation;
    varying vec2 vUv;
    float rand(vec2 co) {
      return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
    }
    void main() {
      vec2 dir = vUv - 0.5;
      float ca = uChroma * dot(dir, dir) * 4.0;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv - dir * ca).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv + dir * ca).b;
      col = (col - 0.5) * uContrast + 0.5;
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(luma), col, uSaturation);
      float vig = smoothstep(0.85, uVignetteSize, length(dir));
      col *= 1.0 - vig * uVignette;
      float g = rand(vUv + fract(uTime)) - 0.5;
      col += g * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

export default {
  initialTime: 12.0,
  renderer: {
    options: { antialias: true },
    toneMapping: 7,
    exposure: 0.5,
    clearColor: 0x0a0e16,
  },
  camera: {
    fov: 18,
    near: 0.1,
    far: 500,
    position: [6, 20, 32],
  },
  controls: {
    target: [0, 0, 0],
    minDistance: 2,
    maxDistance: 70,
    maxPolarAngle: Math.PI * 0.495,
    enablePan: true,
  },
  async setup({ renderer, scene, camera, resolveAsset }) {
    scene.background = new THREE.Color(0x0a0e16);
    scene.fog = new THREE.FogExp2(0x0a0e16, 0.007);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.35;

    const keyLight = new THREE.DirectionalLight(0xfff1dd, 3.0);
    keyLight.position.set(8, 12, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 60;
    keyLight.shadow.camera.left = -15;
    keyLight.shadow.camera.right = 15;
    keyLight.shadow.camera.top = 15;
    keyLight.shadow.camera.bottom = -15;
    keyLight.shadow.bias = -0.0002;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x4a6cff, 0.6);
    fillLight.position.set(-9, 5, -4);
    scene.add(fillLight);

    const rimLight = new THREE.SpotLight(0xffd9a0, 120, 50, Math.PI * 0.25, 0.4, 1.2);
    rimLight.position.set(-6, 8, -10);
    rimLight.target.position.set(0, 0, 0);
    scene.add(rimLight, rimLight.target);
    scene.add(new THREE.AmbientLight(0x223044, 0.4));

    const shared = createSharedWeatherUniforms({
      wind: new THREE.Vector3(1.2, 0, 0.5),
    });
    const lakeUniforms = createLakeUniforms();
    const maps = await loadAsphaltTextures(resolveAsset, renderer);
    const groundMaterial = createSnowyGroundMaterial({
      maps,
      sharedUniforms: shared,
      lakeUniforms,
    });
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20, 256, 256),
      groundMaterial,
    );
    ground.geometry.setAttribute("uv1", ground.geometry.attributes.uv);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const snow = createSnow({ camera, sharedUniforms: shared, maxCount: 30000 });
    scene.add(snow.mesh);

    const lake = createFrozenLake({
      lakeUniforms,
      sharedUniforms: shared,
      sunDir: keyLight.position,
      sunColor: keyLight.color,
    });
    scene.add(lake.mesh);

    const ktx2Loader = new KTX2Loader()
      .setTranscoderPath("/node_modules/three/examples/jsm/libs/basis/")
      .detectSupport(renderer);
    const gltfLoader = new GLTFLoader()
      .setKTX2Loader(ktx2Loader)
      .setMeshoptDecoder(MeshoptDecoder);
    const gltf = await gltfLoader.loadAsync(
      resolveAsset("assets/old_rusty_car_2.glb"),
    );
    const snowCar = prepareSnowModel(gltf.scene, shared);
    scene.add(snowCar.root);

    let debugMode = "final";
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bokeh = new BokehPass(scene, camera, {
      focus: 9.7,
      aperture: 0.0012,
      maxblur: 0.005,
    });
    bokeh.enabled = false;
    composer.addPass(bokeh);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.04, 0.7, 0.62);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const grade = new ShaderPass(filmGradeShader);
    composer.addPass(grade);

    return {
      setDebugMode(mode) {
        debugMode = mode;
        groundMaterial.userData.snowUniforms.uDebugMode.value =
          snowDebugModes.get(mode) ?? 0;
        snow.setDebugMode(mode);
        lakeUniforms.uLakeEnabled.value = mode === "lake" ? 1 : 0;
        lake.applyShape();
      },
      update({ delta, elapsed }) {
        shared.uTime.value = elapsed;
        snow.update();
        lake.update(camera.position);
        snowCar.refreshMatrix();
        if (debugMode !== "lake" && lakeUniforms.uLakeEnabled.value !== 0) {
          lakeUniforms.uLakeEnabled.value = 0;
          lake.applyShape();
        }
      },
      resize({ width, height, dpr }) {
        composer.setPixelRatio(dpr);
        composer.setSize(width, height);
        bloom.setSize(width, height);
      },
      render({ state, delta }) {
        if (state.debugMode === "final") {
          grade.uniforms.uTime.value += delta;
          composer.render();
        } else {
          renderer.render(scene, camera);
        }
      },
      metrics() {
        return {
          flakes: String(snow.mesh.geometry.instanceCount),
          model: "rusty car",
          snowCoverage: groundMaterial.userData.snowUniforms.uSnowCoverage.value.toFixed(2),
        };
      },
      dispose() {
        snow.dispose();
        lake.dispose();
        snowCar.dispose();
        composer.dispose();
        ktx2Loader.dispose();
        ground.geometry.dispose();
        groundMaterial.dispose();
        for (const texture of Object.values(maps)) texture.dispose();
        env.dispose();
        pmrem.dispose();
      },
    };
  },
};
