import { createWaterOpticsScene } from
  "./water-optics-scene.js";

export default {
  initialTime: 5.4,
  renderer: {
    options: { antialias: true },
    exposure: 0.62,
  },
  camera: {
    fov: 48,
    near: 0.1,
    far: 1800,
    position: [18, 18, 34],
  },
  controls: {
    target: [0, 0.5, -34],
    minDistance: 16,
    maxDistance: 130,
    maxPolarAngle: Math.PI * 0.49,
    enablePan: true,
  },
  setup({ renderer, scene, camera }) {
    return createWaterOpticsScene({ renderer, scene, camera });
  },
};
