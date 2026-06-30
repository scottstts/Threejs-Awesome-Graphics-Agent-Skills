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
    // Higher above the cloud layer, still pitched downward by about 15°.
    // pitch = atan((1.35 - 0.12) / 4.6) ≈ 15°
    position: [0, 1.35, 4.6],
  },
  controls: {
    target: [0, 0.12, 0],
    minDistance: 0.7,
    maxDistance: 8,
    maxPolarAngle: Math.PI * 0.58,
    enablePan: true,
  },

  async setup({ THREE, renderer, scene, camera, controls }) {
    const [atmosphereTextures, cloudTextures] = await Promise.all([
      loadAtmosphereTextures(
        "/skills/threejs-atmosphere-aerial-perspective/assets/lut-aerial-perspective",
      ),
      loadCloudTextures(
        "/skills/threejs-volumetric-clouds/assets/weather-volume-clouds",
      ),
    ]);
    const sunDirection = new THREE.Vector3(-0.58, 0.66, -0.48).normalize();
    const groundY = 0;
    const minCameraGroundClearance = 0.04;

    function clampCameraAboveGround() {
      camera.updateMatrixWorld(true);

      if (controls?.target && controls.target.y < groundY) {
        const lift = groundY - controls.target.y;
        controls.target.y += lift;
        camera.position.y += lift;
      }

      if (camera.position.y < groundY + minCameraGroundClearance) {
        const lift = groundY + minCameraGroundClearance - camera.position.y;
        camera.position.y += lift;
        if (controls?.target) {
          controls.target.y += lift;
        }
      }

      camera.updateMatrixWorld(true);
    }

    if (controls) {
      controls.enablePan = true;
      controls.maxPolarAngle = Math.min(
        controls.maxPolarAngle ?? Math.PI,
        Math.PI * 0.58,
      );
      controls.addEventListener?.("change", clampCameraAboveGround);
    }

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(1200, 1200),
      new THREE.MeshBasicMaterial({ color: 0x0b1322 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const sun = new THREE.DirectionalLight(0xffe3bd, 0.9);
    sun.position.copy(sunDirection).multiplyScalar(20);
    sun.target.position.set(0, 0.28, 0);
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
    const skyAtmosphereSourceTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    });
    skyAtmosphereSourceTarget.depthTexture = new THREE.DepthTexture(
      1,
      1,
      THREE.UnsignedIntType,
    );
    const atmosphereTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
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
        skyAtmosphereSourceTarget.setSize(bufferWidth, bufferHeight);
        atmosphereTarget.setSize(bufferWidth, bufferHeight);
        clouds.resize(bufferWidth, bufferHeight);
      },
      setDebugMode(mode) {
        clouds.setDebugMode(mode);
      },
      update({ elapsed }) {
        clampCameraAboveGround();
        clouds.update(elapsed);
      },
      render() {
        clampCameraAboveGround();
        renderer.setRenderTarget(sceneTarget);
        renderer.clear();
        renderer.render(scene, camera);

        // The aerial-perspective LUT pass visibly quantizes the huge,
        // perfectly flat ground plane into curved equal-distance contours.
        // Render the atmosphere against a cleared sky-depth buffer instead,
        // then composite the local ground directly over that result. The
        // original sceneTarget depth is still used below for cloud occlusion.
        renderer.setRenderTarget(skyAtmosphereSourceTarget);
        renderer.clear();

        updateAtmosphereCamera(atmosphereMaterial, camera, {
          sceneColor: skyAtmosphereSourceTarget.texture,
          sceneDepth: skyAtmosphereSourceTarget.depthTexture,
        });
        renderer.setRenderTarget(atmosphereTarget);
        renderer.render(atmosphereScene, postCamera);

        const previousAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        renderer.setRenderTarget(atmosphereTarget);
        renderer.render(scene, camera);
        renderer.autoClear = previousAutoClear;

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
        controls?.removeEventListener?.("change", clampCameraAboveGround);
        ground.geometry.dispose();
        ground.material.dispose();
        sun.dispose();
        sceneTarget.dispose();
        skyAtmosphereSourceTarget.dispose();
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
