import * as THREE from "three";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 100);

const world = new THREE.Group();
scene.add(world);
const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x272a2c, roughness: 0.82 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 22), floorMaterial);
floor.rotation.x = -Math.PI / 2;
world.add(floor);

const heroMaterial = new THREE.MeshStandardMaterial({ color: 0x8b3724, roughness: 0.34, metalness: 0.05 });
const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x282d31, roughness: 0.68, metalness: 0.15 });
const accentMaterial = new THREE.MeshStandardMaterial({ color: 0xb48837, roughness: 0.24, metalness: 0.75 });

const hero = new THREE.Group();
const body = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 3.0, 12, 24), heroMaterial);
body.position.y = 2.55;
hero.add(body);
const halo = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.12, 12, 64), accentMaterial);
halo.position.y = 3.2;
halo.rotation.x = Math.PI / 2;
hero.add(halo);
hero.position.set(-1.4, 0, -0.8);
world.add(hero);

const supportLayout = [
  [-6.4, -7.5, 5.2],
  [-4.8, -6.2, 3.6],
  [-3.4, -7.8, 6.1],
  [-6.8, -3.2, 2.3],
  [3.3, -7.4, 4.1],
  [5.0, -6.0, 6.0],
  [6.5, -8.2, 3.0],
  [6.8, -3.0, 2.1],
  [-7.6, 0.5, 1.8],
];
for (let i = 0; i < supportLayout.length; i++) {
  const [x, z, height] = supportLayout[i];
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.1, height, 1.1), supportMaterial);
  mesh.position.set(x, height / 2, z);
  mesh.rotation.y = i % 2 ? 0.2 : -0.16;
  world.add(mesh);
}

const ambient = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambient);
const key = new THREE.SpotLight(0xffc78f, 0, 32, Math.PI / 5, 0.55, 1.3);
key.position.set(-5, 10, 7);
key.target.position.copy(hero.position).add(new THREE.Vector3(0, 2, 0));
scene.add(key, key.target);
const rim = new THREE.DirectionalLight(0x6f9fff, 0);
rim.position.set(5, 5, -7);
scene.add(rim);
const practical = new THREE.PointLight(0xff4a23, 0, 10, 2);
practical.position.set(-0.5, 1.1, -3.5);
scene.add(practical);

let cinematic = true;
function applyMode() {
  if (cinematic) {
    scene.background = new THREE.Color(0x090b10);
    scene.fog = new THREE.FogExp2(0x0a0d14, 0.055);
    camera.fov = 38;
    camera.position.set(9.5, 5.4, 11.5);
    camera.lookAt(-0.8, 2.1, -1.2);
    ambient.intensity = 0.3;
    key.intensity = 520;
    rim.intensity = 4.2;
    practical.intensity = 110;
    renderer.toneMappingExposure = 1.02;
    floorMaterial.color.set(0x171a1e);
    heroMaterial.color.set(0x8b3724);
    supportMaterial.color.set(0x222832);
    document.querySelector("#mode").textContent = "Cinematic treatment";
    document.querySelector("#toggle").textContent = "Show flat baseline (C)";
  } else {
    scene.background = new THREE.Color(0x8b8f94);
    scene.fog = null;
    camera.fov = 52;
    camera.position.set(0, 5.5, 16);
    camera.lookAt(0, 2.2, 0);
    ambient.intensity = 2.2;
    key.intensity = 0;
    rim.intensity = 0;
    practical.intensity = 0;
    renderer.toneMappingExposure = 1.25;
    floorMaterial.color.set(0x777777);
    heroMaterial.color.set(0x777777);
    supportMaterial.color.set(0x777777);
    document.querySelector("#mode").textContent = "Flat baseline";
    document.querySelector("#toggle").textContent = "Show cinematic treatment (C)";
  }
  camera.updateProjectionMatrix();
}
applyMode();

document.querySelector("#toggle").addEventListener("click", () => {
  cinematic = !cinematic;
  applyMode();
});
addEventListener("keydown", (event) => {
  if (event.code === "KeyC") {
    cinematic = !cinematic;
    applyMode();
  }
});
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop((time) => {
  const seconds = time / 1000;
  halo.rotation.z = seconds * 0.16;
  practical.position.y = 1.1 + Math.sin(seconds * 2.1) * 0.12;
  renderer.render(scene, camera);
});
