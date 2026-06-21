import { createFinancialTowerScene } from
  "./financial-tower-scene.js";

export default {
  renderer: {
    options: { antialias: true },
    exposure: 0.72,
  },
  camera: {
    fov: 46,
    near: 0.1,
    far: 520,
    position: [70, 48, 128],
  },
  controls: {
    target: [0, 29, 0],
    minDistance: 70,
    maxDistance: 190,
    maxPolarAngle: Math.PI * 0.48,
    enablePan: true,
  },
  setup({ renderer, scene, camera, controls }) {
    return createFinancialTowerScene({
      renderer,
      scene,
      camera,
      controls,
    });
  },
};
