import * as THREE from "three";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1018);
scene.fog = new THREE.Fog(0x0b1018, 14, 42);
const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 100);
camera.position.set(7, 6, 10);

scene.add(new THREE.HemisphereLight(0xa8d8ff, 0x27180d, 2.1));
const sun = new THREE.DirectionalLight(0xffd7a3, 3.2);
sun.position.set(5, 9, 4);
scene.add(sun);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(44, 44),
  new THREE.MeshStandardMaterial({ color: 0x1c2730, roughness: 0.88 }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
scene.add(new THREE.GridHelper(44, 44, 0x31526b, 0x203440));

const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.48, 0.8, 8, 16),
  new THREE.MeshStandardMaterial({ color: 0x52d9ff, roughness: 0.25, emissive: 0x062c3a }),
);
body.position.y = 0.9;
player.add(body);
const facing = new THREE.Mesh(
  new THREE.ConeGeometry(0.18, 0.55, 10),
  new THREE.MeshStandardMaterial({ color: 0xffd56a, roughness: 0.35 }),
);
facing.rotation.x = Math.PI / 2;
facing.position.set(0, 1.05, 0.55);
player.add(facing);
scene.add(player);

for (let i = 0; i < 16; i++) {
  const h = 0.4 + Math.random() * 1.8;
  const obstacle = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, h, 1.2),
    new THREE.MeshStandardMaterial({ color: i % 3 === 0 ? 0xb9683c : 0x455463, roughness: 0.72 }),
  );
  const angle = i / 16 * Math.PI * 2;
  obstacle.position.set(Math.cos(angle) * (5 + i * 0.4), h / 2, Math.sin(angle) * (5 + i * 0.4));
  obstacle.rotation.y = angle * 0.7;
  scene.add(obstacle);
}

const landingRing = new THREE.Mesh(
  new THREE.RingGeometry(0.6, 0.72, 48),
  new THREE.MeshBasicMaterial({ color: 0x80e9ff, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
);
landingRing.rotation.x = -Math.PI / 2;
landingRing.visible = false;
scene.add(landingRing);

const keys = new Set();
let tuned = true;
let verticalVelocity = 0;
let grounded = true;
let coyote = 0;
let jumpBuffer = 0;
let landingAge = 1;
const velocity = new THREE.Vector3();
const desired = new THREE.Vector3();
const cameraTarget = new THREE.Vector3();

addEventListener("keydown", (event) => {
  keys.add(event.code);
  if (event.code === "Space") jumpBuffer = 0.12;
  if (event.code === "KeyT" && !event.repeat) {
    tuned = !tuned;
    document.querySelector("#mode").textContent = tuned ? "tuned" : "raw";
  }
});
addEventListener("keyup", (event) => keys.delete(event.code));

function inputAxis(negative, positive) {
  return (keys.has(positive) ? 1 : 0) - (keys.has(negative) ? 1 : 0);
}

let previousTime = performance.now();
renderer.setAnimationLoop((time) => {
  const dt = Math.min((time - previousTime) / 1000, 0.033);
  previousTime = time;
  jumpBuffer = Math.max(0, jumpBuffer - dt);
  coyote = grounded ? 0.1 : Math.max(0, coyote - dt);

  desired.set(
    inputAxis("KeyA", "KeyD") + inputAxis("ArrowLeft", "ArrowRight"),
    0,
    inputAxis("KeyW", "KeyS") + inputAxis("ArrowUp", "ArrowDown"),
  );
  if (desired.lengthSq() > 1) desired.normalize();
  desired.multiplyScalar(tuned ? 6.5 : 6.5);

  if (tuned) {
    const accelerating = desired.lengthSq() > 0;
    const response = accelerating ? 14 : 20;
    const blend = 1 - Math.exp(-response * dt);
    velocity.x = THREE.MathUtils.lerp(velocity.x, desired.x, blend);
    velocity.z = THREE.MathUtils.lerp(velocity.z, desired.z, blend);
  } else {
    velocity.x = desired.x;
    velocity.z = desired.z;
  }

  const wantsJump = tuned ? jumpBuffer > 0 && coyote > 0 : keys.has("Space") && grounded;
  if (wantsJump) {
    verticalVelocity = 7.3;
    grounded = false;
    jumpBuffer = 0;
    coyote = 0;
  }
  verticalVelocity -= 19 * dt;
  player.position.addScaledVector(velocity, dt);
  player.position.y += verticalVelocity * dt;
  if (player.position.y <= 0) {
    if (!grounded && verticalVelocity < -3) {
      landingAge = 0;
      landingRing.visible = tuned;
      landingRing.position.set(player.position.x, 0.025, player.position.z);
      body.scale.set(1.13, 0.82, 1.13);
    }
    player.position.y = 0;
    verticalVelocity = 0;
    grounded = true;
  }

  if (velocity.lengthSq() > 0.15) {
    player.rotation.y = Math.atan2(velocity.x, velocity.z);
  }
  if (tuned) {
    body.scale.lerp(new THREE.Vector3(1, 1, 1), 1 - Math.exp(-14 * dt));
  } else body.scale.set(1, 1, 1);

  landingAge += dt;
  if (landingAge < 0.38 && tuned) {
    const t = landingAge / 0.38;
    landingRing.scale.setScalar(0.7 + t * 2.5);
    landingRing.material.opacity = 1 - t;
  } else landingRing.visible = false;

  cameraTarget.copy(player.position).add(new THREE.Vector3(7, 6, 10));
  if (tuned) camera.position.lerp(cameraTarget, 1 - Math.exp(-5.5 * dt));
  else camera.position.copy(cameraTarget);
  camera.lookAt(player.position.x, player.position.y + 1, player.position.z);
  renderer.render(scene, camera);
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
