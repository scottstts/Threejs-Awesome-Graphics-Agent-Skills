import * as THREE from "three";
import { createCurvedRayAccretionEffect } from
  "/skills/threejs-raymarched-space-effects/examples/curved-ray-accretion-volume/curved-ray-effect.js";

function createMulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createStarTexture({
  starCount = 5200,
  width = 2048,
  height = 1024,
  seed = 0x11aa62f7,
} = {}) {
  const random = createMulberry32(seed);
  const starCanvas = document.createElement("canvas");
  starCanvas.width = width;
  starCanvas.height = height;
  const context = starCanvas.getContext("2d");
  context.fillStyle = "#02040a";
  context.fillRect(0, 0, width, height);

  for (let index = 0; index < starCount; index += 1) {
    const yDirection = random() * 2 - 1;
    const theta = random() * Math.PI * 2;
    const sinPhi = Math.sqrt(1 - yDirection * yDirection);
    const direction = new THREE.Vector3(
      sinPhi * Math.cos(theta),
      yDirection,
      sinPhi * Math.sin(theta),
    );
    const u = Math.atan2(direction.z, direction.x) /
        (Math.PI * 2) +
      0.5;
    const v = Math.acos(
      THREE.MathUtils.clamp(direction.y, -1, 1),
    ) / Math.PI;
    const brightness = THREE.MathUtils.clamp(
      (0.14 + random() * 0.84) *
        (0.58 + Math.pow(random(), 1.1) * 0.72),
      0.06,
      1,
    );
    const warmth = -0.08 + random() * 0.16;
    const red = THREE.MathUtils.clamp(
      brightness + warmth * 0.5,
      0.04,
      1,
    );
    const green = THREE.MathUtils.clamp(
      brightness + warmth * 0.15,
      0.04,
      1,
    );
    const blue = THREE.MathUtils.clamp(
      brightness - warmth * 0.45,
      0.04,
      1,
    );
    context.fillStyle =
      `rgb(${red * 255} ${green * 255} ${blue * 255})`;
    context.fillRect(
      Math.floor(u * width) % width,
      Math.floor(v * height),
      1,
      1,
    );
  }

  const texture = new THREE.CanvasTexture(starCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.flipY = false;
  return texture;
}

export default {
  renderer: {
    options: { antialias: false },
    exposure: 1.15,
    clearColor: 0x02040a,
  },
  camera: {
    fov: 50,
    near: 0.01,
    far: 20,
    // Start from the side, slightly above the accretion disk.
    position: [0, -1.5, 0.15],
  },
  controls: {
    target: [0, 0, 0],
    minDistance: 0.7,
    maxDistance: 6,
    enablePan: true,
    screenSpacePanning: true,
  },

  async setup({ scene, camera }) {
    const starTexture = createStarTexture();
    const noiseTexture = await new THREE.TextureLoader().loadAsync(
      "/skills/threejs-raymarched-space-effects/assets/curved-ray-accretion-volume/noise_deep.png",
    );
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;
    const effect = createCurvedRayAccretionEffect({
      noiseTexture,
      starTexture,
    });
    scene.add(effect.mesh);

    return {
      resize({ bufferWidth, bufferHeight }) {
        effect.setSize(bufferWidth, bufferHeight);
      },
      setDebugMode(mode) {
        effect.setDebugMode(mode);
      },
      update({ elapsed }) {
        effect.updateCamera(camera);
        effect.update(elapsed);
      },
      metrics() {
        return { tier: "128 steps / preserved double advance" };
      },
      dispose() {
        effect.dispose();
        starTexture.dispose();
        noiseTexture.dispose();
      },
    };
  },
};
