import { createProceduralPlanetSurface } from
  "/skills/threejs-procedural-planets/examples/procedural-planet-surface/planet-system.js";

export default {
  renderer: {
    options: { antialias: true },
    exposure: 1.15,
  },
  camera: {
    fov: 42,
    near: 0.01,
    far: 100,
    position: [2.65, 1.25, 2.85],
  },
  controls: {
    target: [0, 0, 0],
    minDistance: 1.45,
    maxDistance: 6,
    enablePan: true,
  },
  setup({ THREE, scene, camera }) {
    scene.background = new THREE.Color(0x020713);
    const surface = createProceduralPlanetSurface({ camera });
    scene.add(surface.object);

    const stars = new THREE.BufferGeometry();
    const starPositions = [];
    let randomState = 0x7f31a9;
    const random = () => {
      randomState = (1664525 * randomState + 1013904223) >>> 0;
      return randomState / 4294967296;
    };
    for (let index = 0; index < 1800; index += 1) {
      const y = random() * 2 - 1;
      const angle = random() * Math.PI * 2;
      const radius = 28;
      const horizontal = Math.sqrt(1 - y * y);
      starPositions.push(
        Math.cos(angle) * horizontal * radius,
        y * radius,
        Math.sin(angle) * horizontal * radius,
      );
    }
    stars.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3),
    );
    const starMaterial = new THREE.PointsMaterial({
      color: 0xdceeff,
      size: 0.025,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(stars, starMaterial));

    return {
      ...surface,
      dispose() {
        surface.dispose();
        stars.dispose();
        starMaterial.dispose();
      },
    };
  },
};
