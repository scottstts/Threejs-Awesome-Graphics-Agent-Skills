import { createGalleryFrameScene } from
  "./gallery-frame-scene.js";

export default {
  renderer: {
    options: { antialias: true },
    exposure: 4,
  },
  camera: {
    fov: 40,
    near: 0.1,
    far: 120,
    position: [0, 0.55, 10.8],
  },
  controls: {
    target: [0, 0.38, 0],
    minDistance: 6.8,
    maxDistance: 14,
    minPolarAngle: Math.PI * 0.38,
    maxPolarAngle: Math.PI * 0.62,
    minAzimuthAngle: -0.42,
    maxAzimuthAngle: 0.42,
    enablePan: true,
  },
  setup({ renderer, scene, camera }) {
    return createGalleryFrameScene({ renderer, scene, camera });
  },
};
