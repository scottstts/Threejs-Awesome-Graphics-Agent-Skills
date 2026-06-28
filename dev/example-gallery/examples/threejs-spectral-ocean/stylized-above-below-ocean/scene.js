import * as THREE from "three";
import { SpectralOceanSystem } from
  "/skills/threejs-spectral-ocean/examples/spectral-cascade-ocean/ocean-system.js";
import { validateFragmentIFFT } from
  "/skills/threejs-spectral-ocean/examples/spectral-cascade-ocean/fft-pipeline.js";
import {
  createStylizedOceanSkyMaterial,
  createStylizedOceanSurfaceMaterial,
  createStylizedSeaFloorMaterial,
  createStylizedUnderwaterCompositeMaterial,
  stylizedAboveBelowOceanAssetPaths,
  stylizedOceanDebugModes,
  updateStylizedOceanMaterials,
} from "/skills/threejs-spectral-ocean/examples/stylized-above-below-ocean/stylized-ocean-material.js";

const ABOVE_CAMERA = new THREE.Vector3(0, 40, 200);
const ABOVE_TARGET = new THREE.Vector3(0, 0, 0);
const UNDERWATER_CAMERA = new THREE.Vector3(0, -18, 76);
const UNDERWATER_TARGET = new THREE.Vector3(0, -30, -8);

function applyCameraView(camera, controls, mode) {
  if (mode === "above-surface") {
    camera.position.copy(ABOVE_CAMERA);
    controls?.target?.copy(ABOVE_TARGET);
  } else {
    camera.position.copy(UNDERWATER_CAMERA);
    controls?.target?.copy(UNDERWATER_TARGET);
  }
  controls?.update?.();
}

async function loadEffectTexture(url, colorSpace = THREE.SRGBColorSpace) {
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  return texture;
}

export default {
  initialTime: 22,
  renderer: {
    options: { antialias: true },
    toneMapping: 0,
    exposure: 1,
    clearColor: 0x064289,
  },
  camera: {
    fov: 50,
    near: 0.1,
    far: 10000,
    position: UNDERWATER_CAMERA.toArray(),
  },
  controls: {
    target: UNDERWATER_TARGET.toArray(),
    minDistance: 10,
    maxDistance: 200,
    enablePan: true,
  },
  async setup({ renderer, scene, camera, controls }) {
    const fftValidation = validateFragmentIFFT(renderer);
    if (!fftValidation.pass) {
      throw new Error(
        `IFFT validation failed: impulse=${fftValidation.impulseError}, ` +
        `frequency=${fftValidation.frequencyError}`,
      );
    }

    const sunDirection = new THREE.Vector3(-0.14, 0.13, -0.98).normalize();
    const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: true,
    });
    sceneTarget.depthTexture = new THREE.DepthTexture(1, 1);
    sceneTarget.depthTexture.type = THREE.UnsignedIntType;

    const options = {
      resolution: 256,
      patchLengths: [250, 64, 18],
      boundaryFactor: 6,
      gravity: 9.81,
      depth: 500,
      choppiness: 1.5,
      foamRecovery: 0.5,
      amplitude: 0.74,
      seed: 78243,
      local: {
        scale: 1,
        windSpeed: 15,
        directionDegrees: 63.435,
        fetchMeters: 90000,
        directionality: 1,
        swell: 0.24,
        peakEnhancement: 3.3,
        shortWaveFade: 0.018,
      },
      swell: {
        scale: 0.62,
        windSpeed: 4,
        directionDegrees: 63.435,
        fetchMeters: 280000,
        directionality: 1,
        swell: 1,
        peakEnhancement: 3.3,
        shortWaveFade: 0.012,
      },
    };
    const ocean = new SpectralOceanSystem(renderer, options);
    const [foamTexture, sandTexture] = await Promise.all([
      loadEffectTexture(stylizedAboveBelowOceanAssetPaths.foam, THREE.NoColorSpace),
      loadEffectTexture(stylizedAboveBelowOceanAssetPaths.sand),
    ]);

    const skyMaterial = createStylizedOceanSkyMaterial({ sunDirection });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), skyMaterial);
    scene.add(sky);

    const seafloorMaterial = createStylizedSeaFloorMaterial({
      sandTexture,
      causticIntensity: 0.9,
    });
    const seafloor = new THREE.Mesh(
      new THREE.PlaneGeometry(4000, 4000, 1, 1),
      seafloorMaterial,
    );
    seafloor.rotation.x = -Math.PI / 2;
    seafloor.position.y = -50;
    scene.add(seafloor);

    const oceanMaterial = createStylizedOceanSurfaceMaterial(ocean.cascades, {
      patchLengths: options.patchLengths,
      sunDirection,
      foamTexture,
    });
    const waterGeometry = new THREE.PlaneGeometry(2000, 2000, 256, 256);
    waterGeometry.rotateX(-Math.PI / 2);
    const water = new THREE.Mesh(waterGeometry, oceanMaterial);
    water.frustumCulled = false;
    scene.add(water);

    const compositeMaterial = createStylizedUnderwaterCompositeMaterial({
      sceneColor: sceneTarget.texture,
      sceneDepth: sceneTarget.depthTexture,
      displacement: ocean.cascades[0].displacement,
      patchLength: options.patchLengths[0],
      scale: 1,
      waterClarity: 57,
    });
    const compositeScene = new THREE.Scene();
    const compositeCamera = new THREE.Camera();
    const composite = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      compositeMaterial,
    );
    compositeScene.add(composite);

    let debugMode = "final";
    applyCameraView(camera, controls, "underwater");

    return {
      resize({ bufferWidth, bufferHeight }) {
        sceneTarget.setSize(bufferWidth, bufferHeight);
      },
      setDebugMode(mode) {
        debugMode = mode;
        if (mode === "above-surface" || mode === "underwater" || mode === "final") {
          applyCameraView(
            camera,
            controls,
            mode === "above-surface" ? "above-surface" : "underwater",
          );
        }
      },
      update({ elapsed, delta }) {
        const snappedX = Math.round(camera.position.x / 16) * 16;
        const snappedZ = Math.round(camera.position.z / 16) * 16;
        water.position.x = snappedX;
        water.position.z = snappedZ;
        seafloor.position.x = camera.position.x;
        seafloor.position.z = camera.position.z;
        sky.position.x = camera.position.x;
        sky.position.z = camera.position.z;

        if (camera.position.y < -49) camera.position.y = -49;
        if (camera.position.y > 200) camera.position.y = 200;
        if (controls?.target) {
          if (controls.target.y < -49) controls.target.y = -49;
          if (controls.target.y > 150) controls.target.y = 150;
        }

        ocean.update(elapsed, Math.max(delta, 1 / 120));
        updateStylizedOceanMaterials({
          oceanMaterial,
          seafloorMaterial,
          compositeMaterial,
          cascades: ocean.cascades,
          elapsed,
          camera,
          debugMode,
        });
      },
      render({ renderer, camera }) {
        if (debugMode === "cascade-bands" || debugMode === "normals" ||
          debugMode === "foam") {
          renderer.render(scene, camera);
          return;
        }
        renderer.setRenderTarget(sceneTarget);
        renderer.clear();
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        renderer.render(compositeScene, compositeCamera);
      },
      metrics() {
        return {
          resolution: `${options.resolution}² x ${ocean.cascades.length}`,
          view: debugMode === "above-surface" ? "above surface" : "underwater",
          fftTest: `pass ${Math.max(
            fftValidation.impulseError,
            fftValidation.frequencyError,
          ).toExponential(1)}`,
        };
      },
      dispose() {
        sceneTarget.depthTexture.dispose();
        sceneTarget.dispose();
        sky.geometry.dispose();
        skyMaterial.dispose();
        seafloor.geometry.dispose();
        seafloorMaterial.dispose();
        waterGeometry.dispose();
        oceanMaterial.dispose();
        composite.geometry.dispose();
        compositeMaterial.dispose();
        foamTexture.dispose();
        sandTexture.dispose();
      },
    };
  },
};
