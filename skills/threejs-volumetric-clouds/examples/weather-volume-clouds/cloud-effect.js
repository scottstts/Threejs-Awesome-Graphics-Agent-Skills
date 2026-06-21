import * as THREE from "three";
import {
  createCloudMaterial,
  createCopyMaterial,
  createResolveMaterial,
} from "./cloud-system.js";

export class WeatherVolumeCloudEffect {
  constructor(
    renderer,
    camera,
    textures,
    { resolutionScale = 0.85 } = {},
  ) {
    this.renderer = renderer;
    this.camera = camera;
    this.resolutionScale = resolutionScale;
    this.renderScene = new THREE.Scene();
    this.screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.renderScene.add(this.quad);

    this.cloudMaterial = createCloudMaterial(textures);
    this.resolveMaterial = createResolveMaterial();
    this.copyMaterial = createCopyMaterial();
    this.currentTarget = this.createTarget(1, 1);
    this.historyRead = this.currentTarget.clone();
    this.historyWrite = this.currentTarget.clone();
    this.historyValid = false;
    this.previousCameraMatrix = new THREE.Matrix4();
    this.frame = 0;
    this.debugModes = new Map([
      ["final", 0],
      ["weather", 1],
      ["base-shape", 2],
      ["detail", 3],
      ["density", 4],
      ["transmittance", 5],
      ["lighting", 6],
    ]);
  }

  createTarget(width, height) {
    return new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    });
  }

  disposeTargets() {
    this.currentTarget.dispose();
    this.historyRead.dispose();
    this.historyWrite.dispose();
  }

  resize(bufferWidth, bufferHeight) {
    const width = Math.max(
      1,
      Math.round(bufferWidth * this.resolutionScale),
    );
    const height = Math.max(
      1,
      Math.round(bufferHeight * this.resolutionScale),
    );
    if (
      this.currentTarget.width === width &&
      this.currentTarget.height === height
    ) {
      return;
    }
    this.disposeTargets();
    this.currentTarget = this.createTarget(width, height);
    this.historyRead = this.currentTarget.clone();
    this.historyWrite = this.currentTarget.clone();
    this.resolveMaterial.uniforms.uCurrentTexel.value.set(
      1 / width,
      1 / height,
    );
    this.cloudMaterial.uniforms.uResolution.value.set(width, height);
    this.historyValid = false;
  }

  setDebugMode(mode) {
    this.cloudMaterial.uniforms.uDebugMode.value =
      this.debugModes.get(mode) ?? 0;
    this.copyMaterial.uniforms.uDebugHistory.value =
      mode === "history-rejection" ? 1 : 0;
  }

  setBackground(colorTexture, depthTexture) {
    this.cloudMaterial.uniforms.uBackground.value = colorTexture;
    this.cloudMaterial.uniforms.uSceneDepth.value = depthTexture;
  }

  update(elapsed) {
    this.camera.updateMatrixWorld(true);
    if (
      this.previousCameraMatrix.elements.some(
        (value, index) =>
          Math.abs(value - this.camera.matrixWorld.elements[index]) > 0.001,
      )
    ) {
      this.historyValid = false;
    }
    this.previousCameraMatrix.copy(this.camera.matrixWorld);
    this.cloudMaterial.uniforms.uTime.value = elapsed;
    this.cloudMaterial.uniforms.uFrame.value = this.frame;
    this.cloudMaterial.uniforms.uCameraPosition.value.copy(
      this.camera.position,
    );
    this.cloudMaterial.uniforms.uInverseProjection.value.copy(
      this.camera.projectionMatrixInverse,
    );
    this.cloudMaterial.uniforms.uCameraWorld.value.copy(
      this.camera.matrixWorld,
    );
  }

  render() {
    this.frame += 1;
    this.quad.material = this.cloudMaterial;
    this.renderer.setRenderTarget(this.currentTarget);
    this.renderer.render(this.renderScene, this.screenCamera);

    this.resolveMaterial.uniforms.uCurrent.value =
      this.currentTarget.texture;
    this.resolveMaterial.uniforms.uHistory.value =
      this.historyRead.texture;
    this.resolveMaterial.uniforms.uHistoryValid.value =
      this.historyValid ? 1 : 0;
    this.quad.material = this.resolveMaterial;
    this.renderer.setRenderTarget(this.historyWrite);
    this.renderer.render(this.renderScene, this.screenCamera);

    [this.historyRead, this.historyWrite] = [
      this.historyWrite,
      this.historyRead,
    ];
    this.historyValid = true;
    this.copyMaterial.uniforms.uTexture.value = this.historyRead.texture;
    this.copyMaterial.uniforms.uCurrent.value = this.currentTarget.texture;
    this.quad.material = this.copyMaterial;
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.renderScene, this.screenCamera);
  }

  metrics() {
    return {
      tier:
        `${this.currentTarget.width}×${this.currentTarget.height} / ` +
        "320×5 samples / authored weather and volume fields / history",
    };
  }

  dispose() {
    this.disposeTargets();
    this.quad.geometry.dispose();
    this.cloudMaterial.dispose();
    this.resolveMaterial.dispose();
    this.copyMaterial.dispose();
  }
}
