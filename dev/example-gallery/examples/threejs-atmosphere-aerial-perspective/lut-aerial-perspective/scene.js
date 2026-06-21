import {
  createAtmosphereAerialPerspectiveMaterial,
  setAtmosphereDebugMode,
  updateAtmosphereCamera,
} from "/skills/threejs-atmosphere-aerial-perspective/examples/lut-aerial-perspective/atmosphere-effect.js";
import {
  disposeTextures,
  loadAtmosphereTextures,
} from "/dev/example-gallery/support/texture-loaders.js";

export default {
  renderer: {
    options: { antialias: true },
    toneMapping: 0,
    exposure: 1,
    clearColor: 0x000000,
  },
  camera: {
    fov: 75,
    near: 0.01,
    far: 1000,
    position: [0, 0.55, 1.75],
  },
  controls: {
    target: [0, 0.3, 0],
    minDistance: 0.7,
    maxDistance: 8,
    maxPolarAngle: Math.PI * 0.58,
    enablePan: true,
  },

  async setup({ THREE, renderer, scene, camera }) {
    const atmosphereTextures = await loadAtmosphereTextures(
      "/dev/example-gallery/assets/geospatial/atmosphere",
    );
    const sunDirection = new THREE.Vector3(-0.58, 0.66, -0.48).normalize();

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 1200),
      new THREE.MeshStandardMaterial({
        color: 0x202734,
        roughness: 0.88,
        metalness: 0,
      }),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const knot = new THREE.Mesh(
      new THREE.TorusKnotGeometry(0.28, 0.085, 256, 64),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        roughness: 0.5,
        ior: 1.45,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      }),
    );
    knot.position.y = 0.28;
    knot.castShadow = true;
    knot.receiveShadow = true;
    scene.add(knot);

    const sun = new THREE.DirectionalLight(0xffe3bd, 0.9);
    sun.position.copy(sunDirection).multiplyScalar(20);
    sun.target.position.copy(knot.position);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -2;
    sun.shadow.camera.right = 2;
    sun.shadow.camera.top = 2;
    sun.shadow.camera.bottom = -2;
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 50;
    sun.shadow.normalBias = 0.002;
    scene.add(sun, sun.target);
    scene.add(new THREE.HemisphereLight(0xcadfff, 0x172030, 0.32));

    const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    });
    sceneTarget.depthTexture = new THREE.DepthTexture(
      1,
      1,
      THREE.UnsignedIntType,
    );

    const atmosphereMaterial =
      createAtmosphereAerialPerspectiveMaterial({
        ...atmosphereTextures,
        sunDirection,
        planetCenter: new THREE.Vector3(0, -6360, 0),
      });
    const postScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      atmosphereMaterial,
    );
    postScene.add(quad);

    return {
      resize({ bufferWidth, bufferHeight }) {
        sceneTarget.setSize(bufferWidth, bufferHeight);
      },
      setDebugMode(mode) {
        setAtmosphereDebugMode(atmosphereMaterial, mode);
      },
      update({ elapsed }) {
        const angle = Math.sin(elapsed * 0.02) * 0.03;
        sunDirection.set(-0.58, 0.66 + angle, -0.48).normalize();
        atmosphereMaterial.uniforms.uSunDirection.value.copy(sunDirection);
        sun.position.copy(sunDirection).multiplyScalar(20);
      },
      render() {
        renderer.setRenderTarget(sceneTarget);
        renderer.clear();
        renderer.render(scene, camera);
        updateAtmosphereCamera(atmosphereMaterial, camera, {
          sceneColor: sceneTarget.texture,
          sceneDepth: sceneTarget.depthTexture,
        });
        renderer.setRenderTarget(null);
        renderer.render(postScene, postCamera);
      },
      metrics() {
        return { tier: "256×128×32 scattering LUT / full-resolution aerial" };
      },
      dispose() {
        ground.geometry.dispose();
        ground.material.dispose();
        knot.geometry.dispose();
        knot.material.dispose();
        sun.dispose();
        sceneTarget.dispose();
        quad.geometry.dispose();
        atmosphereMaterial.dispose();
        disposeTextures(atmosphereTextures);
      },
    };
  },
};
