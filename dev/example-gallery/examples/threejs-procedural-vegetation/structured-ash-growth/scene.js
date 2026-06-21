import { createVegetationScene } from
  "./vegetation-scene.js";

export default {
  renderer: {
    options: { antialias: true },
    toneMapping: 6,
    exposure: 2,
    clearColor: 0x94b9f8,
  },
  camera: {
    fov: 60,
    near: 0.1,
    far: 2000,
    position: [115, 20, 0],
  },
  controls: {
    target: [0, 25, 0],
    minPolarAngle: Math.PI / 2 - 0.2,
    maxPolarAngle: Math.PI / 2 + 0.13,
    minDistance: 10,
    maxDistance: 150,
    enablePan: true,
  },
  setup({ renderer, scene, camera }) {
    return createVegetationScene({ renderer, scene, camera });
  },
};
