import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x17191d);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 4, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.append(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 0.5, 0);

const geometry = new THREE.SphereGeometry(0.82, 96, 64);
const roughnesses = [0.08, 0.28, 0.55, 0.9];

const materialFactories = [
  (roughness) => new THREE.MeshPhysicalMaterial({ color: 0xb84b37, roughness, metalness: 0 }),
  (roughness) => new THREE.MeshPhysicalMaterial({ color: 0xd09b32, roughness, metalness: 1 }),
  (roughness) => new THREE.MeshPhysicalMaterial({ color: 0x294f77, roughness, clearcoat: 1, clearcoatRoughness: 0.08 }),
  (roughness) => new THREE.MeshPhysicalMaterial({ color: 0xd8efff, roughness: roughness * 0.35, transmission: 1, thickness: 1.4, ior: 1.5, attenuationColor: new THREE.Color(0x9ed8e8), attenuationDistance: 3 }),
  (roughness) => new THREE.MeshPhysicalMaterial({ color: 0xa73878, roughness, metalness: 1, anisotropy: 0.9, anisotropyRotation: Math.PI * 0.18 }),
];

for (let row = 0; row < materialFactories.length; row++) {
  for (let column = 0; column < roughnesses.length; column++) {
    const mesh = new THREE.Mesh(geometry, materialFactories[row](roughnesses[column]));
    mesh.position.set((column - 1.5) * 2.25, (2 - row) * 2.05, 0);
    scene.add(mesh);
  }
}

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 24),
  new THREE.MeshStandardMaterial({ color: 0x25292f, roughness: 0.82 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -4.2;
scene.add(floor);

const key = new THREE.RectAreaLight(0xffe7cf, 8, 5, 7);
key.position.set(-5, 7, 7);
key.lookAt(0, 0, 0);
scene.add(key);

const rim = new THREE.DirectionalLight(0x7ea7ff, 2);
rim.position.set(6, 3, -5);
scene.add(rim);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
