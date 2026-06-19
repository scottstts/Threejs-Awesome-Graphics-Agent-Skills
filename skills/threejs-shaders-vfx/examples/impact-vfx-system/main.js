import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x08090c);
scene.fog = new THREE.FogExp2(0x08090c, 0.045);

const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 100);
camera.position.set(8, 7, 10);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.7, 0);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0x7895c7, 0x17110c, 1.4));
const key = new THREE.DirectionalLight(0xffd4a3, 4);
key.position.set(4, 8, 2);
scene.add(key);

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(28, 28, 28, 28),
  new THREE.MeshStandardMaterial({ color: 0x181b22, roughness: 0.82, metalness: 0.1, wireframe: false }),
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);
scene.add(new THREE.GridHelper(28, 28, 0x35415b, 0x222833));

const ringGeometry = new THREE.RingGeometry(0.72, 1, 64);
const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0x66d9ff, transparent: true, blending: THREE.AdditiveBlending,
  depthWrite: false, side: THREE.DoubleSide,
});
const rings = Array.from({ length: 12 }, () => {
  const mesh = new THREE.Mesh(ringGeometry, ringMaterial.clone());
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  scene.add(mesh);
  return { mesh, age: 10 };
});

const flashGeometry = new THREE.SphereGeometry(1, 18, 12);
const flashes = Array.from({ length: 12 }, () => {
  const mesh = new THREE.Mesh(
    flashGeometry,
    new THREE.MeshBasicMaterial({
      color: 0xffd276, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    }),
  );
  mesh.visible = false;
  scene.add(mesh);
  return { mesh, age: 10 };
});

const sparkCount = 320;
const sparkGeometry = new THREE.IcosahedronGeometry(0.045, 0);
const sparkMaterial = new THREE.MeshBasicMaterial({ color: 0xffbd59 });
const sparks = new THREE.InstancedMesh(sparkGeometry, sparkMaterial, sparkCount);
sparks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(sparks);
const sparkState = Array.from({ length: sparkCount }, () => ({
  active: false, age: 0, life: 0, position: new THREE.Vector3(), velocity: new THREE.Vector3(),
}));
const dummy = new THREE.Object3D();
let ringCursor = 0;
let sparkCursor = 0;
let cameraImpulse = 0;

function emitImpact(point) {
  const ring = rings[ringCursor];
  const flash = flashes[ringCursor];
  ringCursor = (ringCursor + 1) % rings.length;
  ring.age = 0;
  ring.mesh.visible = true;
  ring.mesh.position.copy(point).addScaledVector(THREE.Object3D.DEFAULT_UP, 0.025);
  flash.age = 0;
  flash.mesh.visible = true;
  flash.mesh.position.copy(point).addScaledVector(THREE.Object3D.DEFAULT_UP, 0.18);

  for (let i = 0; i < 28; i++) {
    const spark = sparkState[sparkCursor];
    sparkCursor = (sparkCursor + 1) % sparkCount;
    const angle = Math.random() * Math.PI * 2;
    const speed = THREE.MathUtils.lerp(2.5, 7, Math.random());
    spark.active = true;
    spark.age = 0;
    spark.life = THREE.MathUtils.lerp(0.45, 0.95, Math.random());
    spark.position.copy(point).add(new THREE.Vector3(0, 0.12, 0));
    spark.velocity.set(Math.cos(angle) * speed, THREE.MathUtils.lerp(2, 6.5, Math.random()), Math.sin(angle) * speed);
  }
  cameraImpulse = Math.min(cameraImpulse + 0.22, 0.45);
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
renderer.domElement.addEventListener("pointerdown", (event) => {
  pointer.set(event.clientX / innerWidth * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObject(floor, false)[0];
  if (hit) emitImpact(hit.point);
});
emitImpact(new THREE.Vector3());
setInterval(() => {
  emitImpact(new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(8),
    0,
    THREE.MathUtils.randFloatSpread(7),
  ));
}, 1300);

let previousTime = performance.now();
renderer.setAnimationLoop((time) => {
  const dt = Math.min((time - previousTime) / 1000, 0.033);
  previousTime = time;
  controls.update();

  for (let i = 0; i < rings.length; i++) {
    const ring = rings[i];
    const flash = flashes[i];
    ring.age += dt;
    flash.age += dt;
    if (ring.age < 0.72) {
      const t = ring.age / 0.72;
      ring.mesh.scale.setScalar(0.25 + t * 4.2);
      ring.mesh.material.opacity = (1 - t) * 0.8;
    } else ring.mesh.visible = false;
    if (flash.age < 0.18) {
      const t = flash.age / 0.18;
      flash.mesh.scale.setScalar(0.25 + t * 1.4);
      flash.mesh.material.opacity = (1 - t) * 0.9;
    } else flash.mesh.visible = false;
  }

  for (let i = 0; i < sparkCount; i++) {
    const spark = sparkState[i];
    if (spark.active) {
      spark.age += dt;
      if (spark.age >= spark.life) spark.active = false;
      else {
        spark.velocity.y -= 13 * dt;
        spark.position.addScaledVector(spark.velocity, dt);
        if (spark.position.y < 0.04) {
          spark.position.y = 0.04;
          spark.velocity.y *= -0.28;
          spark.velocity.x *= 0.72;
          spark.velocity.z *= 0.72;
        }
      }
    }
    const scale = spark.active ? Math.max(0, 1 - spark.age / spark.life) : 0;
    dummy.position.copy(spark.position);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    sparks.setMatrixAt(i, dummy.matrix);
  }
  sparks.instanceMatrix.needsUpdate = true;

  cameraImpulse *= Math.exp(-18 * dt);
  const shake = new THREE.Vector3(
    (Math.random() - 0.5) * cameraImpulse,
    (Math.random() - 0.5) * cameraImpulse,
    (Math.random() - 0.5) * cameraImpulse,
  );
  camera.position.add(shake);
  renderer.render(scene, camera);
  camera.position.sub(shake);
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
