import * as THREE from "three";
import { createLabRuntime } from "../lab-runtime.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);
const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(0, 7.5, 15);
camera.lookAt(0, 0, 0);
const runtime = createLabRuntime({ renderer, scene, camera });
scene.add(new THREE.HemisphereLight(0xaec9ff, 0x17110c, 2.2));
const key = new THREE.DirectionalLight(0xffffff, 3);
key.position.set(4, 8, 5);
scene.add(key);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 12),
  new THREE.MeshStandardMaterial({ color: 0x171b24, roughness: 0.9 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -1;
scene.add(floor);

const lanes = [
  { z: -3, color: 0xff5577, label: "fixed lerp" },
  { z: 0, color: 0x55d8ff, label: "exact damp" },
  { z: 3, color: 0xffd166, label: "spring" },
];
const movers = lanes.map((lane) => {
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.6, 28, 18),
    new THREE.MeshStandardMaterial({ color: lane.color, roughness: 0.28, emissive: lane.color, emissiveIntensity: 0.08 }),
  );
  mesh.position.set(-5, 0, lane.z);
  scene.add(mesh);
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(12, 0.06, 0.08),
    new THREE.MeshBasicMaterial({ color: lane.color, transparent: true, opacity: 0.28 }),
  );
  rail.position.set(0, -0.92, lane.z);
  scene.add(rail);
  return { mesh, velocity: 0 };
});

const targetMarker = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 2.6, 7.2),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28 }),
);
targetMarker.position.x = 5;
scene.add(targetMarker);
let targetX = 5;

function setTargetFromPointer(event) {
  const pointer = runtime.pointerNdc(event);
  targetX = THREE.MathUtils.clamp(pointer.x * 6.4, -5.5, 5.5);
  targetMarker.position.x = targetX;
}
runtime.listen(renderer.domElement, "pointerdown", setTargetFromPointer);

function updateSpring(state, target, dt) {
  const frequency = 2.2;
  const dampingRatio = 0.42;
  const omega = Math.PI * 2 * frequency;
  const acceleration = omega * omega * (target - state.mesh.position.x) - 2 * dampingRatio * omega * state.velocity;
  state.velocity += acceleration * dt;
  state.mesh.position.x += state.velocity * dt;
}

let previousTime = performance.now();
renderer.setAnimationLoop((time) => {
  const dt = Math.min((time - previousTime) / 1000, 0.033);
  previousTime = time;
  movers[0].mesh.position.x = THREE.MathUtils.lerp(movers[0].mesh.position.x, targetX, 0.055);
  movers[1].mesh.position.x = THREE.MathUtils.lerp(
    movers[1].mesh.position.x,
    targetX,
    1 - Math.exp(-5.8 * dt),
  );
  updateSpring(movers[2], targetX, dt);
  renderer.render(scene, camera);
});
