import {
  createAtmosphereAerialPerspectiveMaterial,
  updateAtmosphereCamera,
} from "/skills/threejs-atmosphere-aerial-perspective/examples/lut-aerial-perspective/atmosphere-effect.js";
import { WeatherVolumeCloudEffect } from
  "/skills/threejs-volumetric-clouds/examples/weather-volume-clouds/cloud-effect.js";
import {
  disposeTextures,
  loadAtmosphereTextures,
  loadCloudTextures,
} from "/dev/example-gallery/support/texture-loaders.js";

export default {
  initialTime: 17.2,
  renderer: {
    options: { antialias: false },
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
    const [atmosphereTextures, cloudTextures] = await Promise.all([
      loadAtmosphereTextures(
        "/dev/example-gallery/assets/geospatial/atmosphere",
      ),
      loadCloudTextures(
        "/dev/example-gallery/assets/geospatial/clouds",
      ),
    ]);
    const sunDirection = new THREE.Vector3(-0.58, 0.66, -0.48).normalize();

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 1200),
      new THREE.MeshBasicMaterial({ color: 0x0b1322 }),
    );
    ground.rotation.x = -Math.PI / 2;
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
    scene.add(knot);
    const sun = new THREE.DirectionalLight(0xffe3bd, 0.9);
    sun.position.copy(sunDirection).multiplyScalar(20);
    sun.target.position.copy(knot.position);
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
    const atmosphereTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    });

    const atmosphereMaterial =
      createAtmosphereAerialPerspectiveMaterial({
        ...atmosphereTextures,
        sunDirection,
        planetCenter: new THREE.Vector3(0, -6360, 0),
      });
    atmosphereMaterial.uniforms.uOutputTransform.value = 0;
    const atmosphereScene = new THREE.Scene();
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const atmosphereQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      atmosphereMaterial,
    );
    atmosphereScene.add(atmosphereQuad);

    const clouds = new WeatherVolumeCloudEffect(
      renderer,
      camera,
      cloudTextures,
    );
    clouds.cloudMaterial.uniforms.uSunDirection.value.copy(sunDirection);

    return {
      resize({ bufferWidth, bufferHeight }) {
        sceneTarget.setSize(bufferWidth, bufferHeight);
        atmosphereTarget.setSize(bufferWidth, bufferHeight);
        clouds.resize(bufferWidth, bufferHeight);
      },
      setDebugMode(mode) {
        clouds.setDebugMode(mode);
      },
      update({ elapsed }) {
        clouds.update(elapsed);
      },
      render() {
        renderer.setRenderTarget(sceneTarget);
        renderer.clear();
        renderer.render(scene, camera);

        updateAtmosphereCamera(atmosphereMaterial, camera, {
          sceneColor: sceneTarget.texture,
          sceneDepth: sceneTarget.depthTexture,
        });
        renderer.setRenderTarget(atmosphereTarget);
        renderer.render(atmosphereScene, postCamera);

        clouds.setBackground(
          atmosphereTarget.texture,
          sceneTarget.depthTexture,
        );
        clouds.render();
      },
      metrics() {
        return clouds.metrics();
      },
      dispose() {
        ground.geometry.dispose();
        ground.material.dispose();
        knot.geometry.dispose();
        knot.material.dispose();
        sun.dispose();
        sceneTarget.dispose();
        atmosphereTarget.dispose();
        atmosphereQuad.geometry.dispose();
        atmosphereMaterial.dispose();
        clouds.dispose();
        disposeTextures(atmosphereTextures);
        disposeTextures(cloudTextures);
      },
    };
  },
};
