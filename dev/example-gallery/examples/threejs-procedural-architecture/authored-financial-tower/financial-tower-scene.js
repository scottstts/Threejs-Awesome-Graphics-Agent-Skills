import * as THREE from "three";
import {
  compileBuilding,
  createBuildingPlan,
} from "/skills/threejs-procedural-architecture/examples/authored-financial-tower/building-system.js";
import {
  createCachedShadowClipmaps,
  createShadowReceiverMaterial,
} from "/skills/threejs-procedural-architecture/examples/authored-financial-tower/shadow-clipmaps.js";
import {
  createDaylightEnvironment,
  daylightSunDirection,
} from "./daylight-environment.js";

export async function createFinancialTowerScene({
  renderer,
  scene,
  camera,
  controls,
}) {
const daylightEnvironment = createDaylightEnvironment(renderer);
scene.background = daylightEnvironment.background;
scene.environment = daylightEnvironment.environment;
scene.environmentIntensity = 0.32;
scene.backgroundIntensity = 0.45;
scene.fog = new THREE.Fog(0xc6d5df, 175, 360);
const linearColor = (r, g, b) => new THREE.Color().setRGB(r, g, b);
const textureLoader = new THREE.TextureLoader();
const [limestoneMap, limestoneNormal, ornamentMap, ornamentNormal] =
  await Promise.all([
    textureLoader.loadAsync(
      "/dev/example-gallery/examples/threejs-procedural-architecture/authored-financial-tower/assets/limestone-albedo.png",
    ),
    textureLoader.loadAsync(
      "/dev/example-gallery/examples/threejs-procedural-architecture/authored-financial-tower/assets/limestone-normal.png",
    ),
    textureLoader.loadAsync(
      "/dev/example-gallery/examples/threejs-procedural-architecture/authored-financial-tower/assets/ornaments-albedo.png",
    ),
    textureLoader.loadAsync(
      "/dev/example-gallery/examples/threejs-procedural-architecture/authored-financial-tower/assets/ornaments-normal.png",
    ),
  ]);
for (const texture of [limestoneMap, ornamentMap]) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
}
for (const texture of [limestoneNormal, ornamentNormal]) {
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
}
const materials = {
  limestone: new THREE.MeshStandardMaterial({
    color: linearColor(0.98, 0.96, 0.9),
    map: limestoneMap,
    normalMap: limestoneNormal,
    normalScale: new THREE.Vector2(0.22, 0.22),
    roughness: 0.78,
    metalness: 0.02,
  }),
  granite: new THREE.MeshStandardMaterial({
    color: linearColor(0.28, 0.27, 0.25),
    roughness: 0.82,
    metalness: 0.02,
  }),
  glass: new THREE.MeshStandardMaterial({
    color: linearColor(0.018, 0.028, 0.035),
    roughness: 0.08,
    metalness: 0.72,
  }),
  bronze: new THREE.MeshStandardMaterial({
    color: linearColor(0.62, 0.42, 0.2),
    roughness: 0.32,
    metalness: 0.86,
  }),
  "black-metal": new THREE.MeshStandardMaterial({
    color: linearColor(0.02, 0.02, 0.018),
    roughness: 0.42,
    metalness: 0.55,
  }),
  ornament: new THREE.MeshStandardMaterial({
    color: linearColor(0.98, 0.96, 0.9),
    map: ornamentMap,
    normalMap: ornamentNormal,
    normalScale: new THREE.Vector2(0.22, 0.22),
    roughness: 0.86,
    metalness: 0.02,
  }),
  roof: new THREE.MeshStandardMaterial({
    color: linearColor(0.2, 0.2, 0.19),
    roughness: 0.76,
    metalness: 0.08,
  }),
};

const plan = createBuildingPlan();
const building = compileBuilding(plan, materials);
scene.add(building.root);

const plaza = new THREE.Mesh(new THREE.PlaneGeometry(90, 90, 1, 1));
plaza.rotation.x = -Math.PI / 2;
plaza.position.y = -0.01;
scene.add(plaza);

const clipmaps = createCachedShadowClipmaps(renderer, scene, plaza);
plaza.material = createShadowReceiverMaterial(clipmaps.uniforms);
plaza.receiveShadow = false;

const sun = new THREE.DirectionalLight(0xfff7e8, 4);
sun.position.copy(controls.target).addScaledVector(daylightSunDirection, 140);
sun.target.position.copy(controls.target);
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(0xd7e4ee, 0x8a806f, 0.28));
const fill = new THREE.DirectionalLight(0xffffff, 0.06);
fill.position.set(-32, 28, 46);
scene.add(fill);

const debugModes = new Map([
  ["final", 0],
  ["topology", 1],
  ["placements", 2],
  ["material-slots", 3],
  ["shadow-levels", 4],
  ["texel-grid", 5],
  ["no-shadows", 6],
]);
  return {
      setDebugMode(modeName) {
        const mode = debugModes.get(modeName) ?? 0;
        clipmaps.uniforms.uDebugMode.value = mode;
        building.setDebugMode(modeName);
      },
      update() {
        clipmaps.update(camera);
      },
      metrics() {
        return {
          tier:
            `seed 1042 / ${building.moduleCount} placements / 3 clipmaps`,
        };
      },
  };
}
