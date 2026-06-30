import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { BokehPass } from "three/addons/postprocessing/BokehPass.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import {
  createGpuComputedGrassSystem,
  createGpuGrassTerrainMaterial,
} from "/skills/threejs-procedural-vegetation/examples/gpu-computed-grass/gpu-grass-system.js";

const TERRAIN = {
  amplitude: 2.5,
  frequency: 0.1,
  seed: 0.0,
  color: "#1a3310",
};

const grassToneShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSaturation: { value: 0.78 },
    uContrast: { value: 0.94 },
    uBrightness: { value: 1.03 },
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
    uniform float uSaturation;
    uniform float uContrast;
    uniform float uBrightness;
    varying vec2 vUv;
    void main() {
      vec3 color = texture2D(tDiffuse, vUv).rgb;
      color = (color - 0.5) * uContrast + 0.5;
      float luma = dot(color, vec3(0.299, 0.587, 0.114));
      color = mix(vec3(luma), color, uSaturation) * uBrightness;
      gl_FragColor = vec4(color, 1.0);
    }
  `,
};

export default {
  initialTime: 0.0,
  renderer: {
    options: { antialias: true },
    toneMapping: 7,
    exposure: 1.0,
    clearColor: 0x0a0e16,
  },
  camera: {
    fov: 45,
    near: 0.1,
    far: 120,
    position: [0, 3, 10],
  },
  controls: {
    target: [0, 0, 0],
    minDistance: 5,
    maxDistance: 20,
    minPolarAngle: Math.PI / 4,
    maxPolarAngle: Math.PI / 2.2,
    enablePan: true,
  },
  async setup({ renderer, scene, camera }) {
    scene.background = new THREE.Color(0x000000);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;
    scene.environmentIntensity = 0.2;

    const lightBasePosition = new THREE.Vector3(0, 5, 5);
    const lightPosition = new THREE.Vector3().copy(lightBasePosition);
    const lightTarget = new THREE.Vector3(0, 0, 0);
    const lightRotation = new THREE.Matrix4();
    const lightDirection = new THREE.Vector3();
    const sun = new THREE.DirectionalLight(0xffffff, 2.0);
    sun.position.copy(lightBasePosition);
    scene.add(sun);
    scene.add(sun.target);

    const terrainMaterial = createGpuGrassTerrainMaterial(TERRAIN);
    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20, 128, 128),
      terrainMaterial,
    );
    terrain.rotation.x = -Math.PI / 2;
    scene.add(terrain);

    const grass = createGpuComputedGrassSystem(renderer, {
      gridSize: 384,
      patchSize: 20,
      lightDirection: lightDirection
        .subVectors(lightTarget, lightPosition)
        .normalize(),
      lightColor: sun.color.clone(),
      lightIntensity: sun.intensity,
      terrain: TERRAIN,
    });
    scene.add(grass.object);

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bokeh = new BokehPass(scene, camera, {
      focus: 4.5,
      aperture: 0.000025,
      maxblur: 0.003,
    });
    composer.addPass(bokeh);
    const bloom = new UnrealBloomPass(new THREE.Vector2(1280, 720), 0.24, 0.45, 0.42);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    composer.addPass(new ShaderPass(grassToneShader));

    return {
      setDebugMode(mode) {
        grass.setDebugMode(mode);
      },
      update({ elapsed }) {
        lightRotation.makeRotationY(elapsed * 0.5);
        lightPosition.copy(lightBasePosition).applyMatrix4(lightRotation);
        sun.position.copy(lightPosition);
        sun.target.position.copy(lightTarget);
        sun.target.updateMatrixWorld();
        grass.setLight({
          direction: lightDirection.subVectors(lightTarget, lightPosition).normalize(),
          color: sun.color,
          intensity: sun.intensity,
        });
        grass.update({ elapsed });
      },
      resize({ width, height, dpr }) {
        composer.setPixelRatio(dpr);
        composer.setSize(width, height);
      },
      render({ state }) {
        if (state.debugMode === "final") composer.render();
        else renderer.render(scene, camera);
      },
      metrics() {
        return {
          blades: "147456",
          compute: "3 MRT channels",
        };
      },
      dispose() {
        grass.dispose();
        composer.dispose();
        terrain.geometry.dispose();
        terrainMaterial.dispose();
        environment.dispose();
        pmrem.dispose();
      },
    };
  },
};
