import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x11151b);
scene.fog = new THREE.Fog(0x11151b, 35, 90);

const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, 0.1, 160);
camera.position.set(18, 14, 24);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.append(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0, -4);
controls.enableDamping = true;

scene.add(new THREE.HemisphereLight(0xbfdcff, 0x342d26, 1.5));
const sun = new THREE.DirectionalLight(0xffe2b8, 3.2);
sun.position.set(-12, 18, 8);
scene.add(sun);

const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-18, 0, 12),
  new THREE.Vector3(-10, 2, 5),
  new THREE.Vector3(-4, 0, -2),
  new THREE.Vector3(4, 3, -8),
  new THREE.Vector3(12, 1, -15),
  new THREE.Vector3(18, 4, -24),
]);

function sweepStrip({ halfWidth, yOffset = 0, segments = 160 }) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const previousTangent = new THREE.Vector3();
  const transportedNormal = new THREE.Vector3(0, 1, 0);
  const frameNormal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  let distance = 0;
  let previousPoint = curve.getPointAt(0);

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();

    if (i > 0) {
      rotation.setFromUnitVectors(previousTangent, tangent);
      transportedNormal.applyQuaternion(rotation).normalize();
      distance += center.distanceTo(previousPoint);
    }

    binormal.crossVectors(tangent, transportedNormal).normalize();
    transportedNormal.crossVectors(binormal, tangent).normalize();

    const bank = Math.sin(t * Math.PI * 5) * 0.08;
    frameNormal.copy(transportedNormal).applyAxisAngle(tangent, bank);
    binormal.crossVectors(tangent, frameNormal).normalize();

    const left = center.clone().addScaledVector(binormal, -halfWidth).addScaledVector(frameNormal, yOffset);
    const right = center.clone().addScaledVector(binormal, halfWidth).addScaledVector(frameNormal, yOffset);
    positions.push(left.x, left.y, left.z, right.x, right.y, right.z);
    uvs.push(0, distance / 3, 1, distance / 3);

    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
    }

    previousTangent.copy(tangent);
    previousPoint = center;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

const shoulder = new THREE.Mesh(
  sweepStrip({ halfWidth: 3.8, yOffset: -0.08 }),
  new THREE.MeshStandardMaterial({ color: 0x766858, roughness: 0.95 }),
);
const road = new THREE.Mesh(
  sweepStrip({ halfWidth: 2.8 }),
  new THREE.MeshStandardMaterial({ color: 0x20242a, roughness: 0.78, metalness: 0.05 }),
);
scene.add(shoulder, road);

const centerLine = new THREE.Mesh(
  sweepStrip({ halfWidth: 0.055, yOffset: 0.025 }),
  new THREE.MeshBasicMaterial({ color: 0xffd36a }),
);
scene.add(centerLine);

const terrain = new THREE.Mesh(
  new THREE.PlaneGeometry(140, 140, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x252e27, roughness: 1 }),
);
terrain.rotation.x = -Math.PI / 2;
terrain.position.y = -0.2;
scene.add(terrain);

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
