import * as THREE from "three";
import {
  InteractiveWaterHeightfield,
  createInteractiveWaterSurfaceMaterial,
  createInteractiveWaterSurfaceMesh,
  createPoolInteriorMaterial,
  createPoolInteriorMesh,
  createPoolSphereMaterial,
  interactivePoolWaterAssetPaths,
  PoolCausticsPass,
  poolWaterDebugModes,
} from "/skills/threejs-water-optics/examples/interactive-pool-volume/water-volume-system.js";

async function createTileTexture(url) {
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  return texture;
}

async function createSkybox() {
  const cubemap = await new THREE.CubeTextureLoader().loadAsync(
    interactivePoolWaterAssetPaths.skybox,
  );
  cubemap.flipY = true;
  cubemap.colorSpace = THREE.NoColorSpace;
  cubemap.minFilter = THREE.LinearFilter;
  cubemap.magFilter = THREE.LinearFilter;
  cubemap.generateMipmaps = false;
  return cubemap;
}

export default {
  initialTime: 5.8,
  renderer: {
    options: { antialias: true },
    toneMapping: 0,
    exposure: 1.0,
    clearColor: 0x000000,
  },
  camera: {
    fov: 45,
    near: 0.05,
    far: 80,
    position: [1.2696, 1.1905, -3.3957],
  },
  controls: {
    target: [0, -0.5, 0],
    minDistance: 2,
    maxDistance: 10,
    maxPolarAngle: Math.PI,
    enablePan: true,
  },
  async setup({ renderer, scene, camera, canvas, controls, resolveAsset }) {
    const width = 2.0;
    const depth = 2.0;
    const poolDepth = 1.0;
    const sunDirection = new THREE.Vector3(2, 2, -1).normalize();
    scene.background = new THREE.Color(0x000000);

    const [tileTexture, skybox] = await Promise.all([
      createTileTexture(interactivePoolWaterAssetPaths.tiles),
      createSkybox(),
    ]);
    scene.environment = skybox;

    const simulation = new InteractiveWaterHeightfield(renderer, {
      resolution: 256,
      damping: 0.995,
      waveSpeed: 2.0,
    });
    const seedDrops = [
      [0.14, 0.82, -0.01], [0.77, 0.18, 0.01], [0.33, 0.64, -0.01],
      [0.91, 0.58, 0.01], [0.48, 0.28, -0.01], [0.22, 0.43, 0.01],
      [0.69, 0.74, -0.01], [0.38, 0.11, 0.01], [0.57, 0.52, -0.01],
      [0.08, 0.36, 0.01], [0.84, 0.87, -0.01], [0.28, 0.71, 0.01],
      [0.62, 0.23, -0.01], [0.46, 0.94, 0.01], [0.73, 0.39, -0.01],
      [0.17, 0.59, 0.01], [0.53, 0.06, -0.01], [0.95, 0.31, 0.01],
      [0.06, 0.88, -0.01], [0.41, 0.47, 0.01],
    ];
    for (const [x, z, strength] of seedDrops) {
      simulation.addDrop(x * 2 - 1, z * 2 - 1, 0.03, strength);
    }

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 48, 32),
      createPoolSphereMaterial({
        waterTexture: simulation.texture,
        tileTexture,
        causticTexture: null,
        skybox,
        sunDirection,
        sphereCenter: new THREE.Vector3(-0.4, -0.75, 0.2),
        sphereRadius: 0.25,
      }),
    );
    sphere.position.set(-0.4, -0.75, 0.2);

    const causticsPass = new PoolCausticsPass(renderer, {
      waterTexture: simulation.texture,
      sunDirection,
      sphereCenter: sphere.position,
      sphereRadius: 0.25,
    });

    const poolMaterial = createPoolInteriorMaterial({
      waterTexture: simulation.texture,
      tileTexture,
      causticTexture: causticsPass.texture,
      skybox,
      sunDirection,
      sphereCenter: sphere.position,
      sphereRadius: 0.25,
    });
    const pool = createPoolInteriorMesh({ material: poolMaterial });
    scene.add(pool);

    const waterMaterial = createInteractiveWaterSurfaceMaterial({
      waterTexture: simulation.texture,
      tileTexture,
      causticTexture: causticsPass.texture,
      skybox,
      sunDirection,
      sphereCenter: sphere.position,
      sphereRadius: 0.25,
    });
    const water = createInteractiveWaterSurfaceMesh({
      width,
      depth,
      segments: 200,
      material: waterMaterial,
    });
    scene.add(water);
    scene.add(sphere);
    sphere.material.uniforms.causticTex.value = causticsPass.texture;

    const inactiveSphere = sphere.position.clone();
    inactiveSphere.y = 10.0;
    simulation.moveSphere(inactiveSphere, sphere.position, 0.25, {
      width,
      depth,
      displacementScale: 1.0,
    });
    for (let index = 0; index < 96; index += 1) {
      simulation.stepSimulation();
    }
    simulation.updateNormals();

    let previousSphere = sphere.position.clone();
    let debugMode = "final";
    let userControlledSphere = true;
    let draggingSphere = false;
    let addingDrops = false;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const dragHit = new THREE.Vector3();
    const dragOffset = new THREE.Vector3();

    function setPointer(event) {
      const rect = canvas.getBoundingClientRect();
      pointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      raycaster.setFromCamera(pointer, camera);
    }

    function clampSphere() {
      const inset = 0.25;
      sphere.position.x = THREE.MathUtils.clamp(
        sphere.position.x,
        -width * 0.5 + inset,
        width * 0.5 - inset,
      );
      sphere.position.z = THREE.MathUtils.clamp(
        sphere.position.z,
        -depth * 0.5 + inset,
        depth * 0.5 - inset,
      );
      sphere.position.y = THREE.MathUtils.clamp(
        sphere.position.y,
        -poolDepth + 0.25,
        0.25,
      );
    }

    function onPointerDown(event) {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      setPointer(event);
      const hit = raycaster.intersectObject(sphere, false)[0];
      event.preventDefault();
      if (!hit) {
        const planeDistance = -raycaster.ray.origin.y / raycaster.ray.direction.y;
        const point = raycaster.ray.origin.clone().addScaledVector(
          raycaster.ray.direction,
          planeDistance,
        );
        if (
          planeDistance > 0 &&
          Math.abs(point.x) < width * 0.5 &&
          Math.abs(point.z) < depth * 0.5
        ) {
          addingDrops = true;
          canvas.setPointerCapture(event.pointerId);
          if (controls) controls.enabled = false;
          simulation.addDrop(point.x / (width * 0.5), point.z / (depth * 0.5), 0.035, 0.045);
          simulation.updateNormals();
        }
        return;
      }
      userControlledSphere = true;
      draggingSphere = true;
      canvas.setPointerCapture(event.pointerId);
      if (controls) controls.enabled = false;
      const normal = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(camera.quaternion)
        .normalize();
      dragPlane.setFromNormalAndCoplanarPoint(normal, sphere.position);
      dragOffset.copy(sphere.position).sub(hit.point);
    }

    function onPointerMove(event) {
      if (!draggingSphere && !addingDrops) return;
      event.preventDefault();
      setPointer(event);
      if (addingDrops) {
        const planeDistance = -raycaster.ray.origin.y / raycaster.ray.direction.y;
        const point = raycaster.ray.origin.clone().addScaledVector(
          raycaster.ray.direction,
          planeDistance,
        );
        if (
          planeDistance > 0 &&
          Math.abs(point.x) < width * 0.5 &&
          Math.abs(point.z) < depth * 0.5
        ) {
          simulation.addDrop(point.x / (width * 0.5), point.z / (depth * 0.5), 0.03, 0.02);
        }
        return;
      }
      if (raycaster.ray.intersectPlane(dragPlane, dragHit)) {
        sphere.position.copy(dragHit).add(dragOffset);
        clampSphere();
      }
    }

    function stopDrag(event) {
      if (!draggingSphere && !addingDrops) return;
      draggingSphere = false;
      addingDrops = false;
      if (controls) controls.enabled = true;
      if (event?.pointerId != null && canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    }

    canvas.style.touchAction = "none";
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", stopDrag);
    canvas.addEventListener("pointercancel", stopDrag);

    function syncMaterials() {
      causticsPass.setSphere(sphere.position, 0.25, true);
      const materials = [poolMaterial, waterMaterial, sphere.material];
      for (const material of materials) {
        material.uniforms.water.value = simulation.texture;
        material.uniforms.causticTex.value = causticsPass.texture;
        material.uniforms.light.value.copy(sunDirection);
        material.uniforms.sphereCenter.value.copy(sphere.position);
        material.uniforms.sphereRadius.value = 0.25;
        material.uniforms.sphereEnabled.value = true;
        if (material.uniforms.eye) {
          material.uniforms.eye.value.copy(camera.position);
        }
      }
    }

    return {
      resize() {},
      setDebugMode(mode) {
        debugMode = mode;
        const debugValue = poolWaterDebugModes.get(mode) ?? 0;
        waterMaterial.uniforms.uDebugMode.value = debugValue;
        poolMaterial.uniforms.uDebugMode.value = debugValue;
      },
      update({ elapsed, delta }) {
        if (!userControlledSphere) {
          sphere.position.set(
            Math.sin(elapsed * 0.72) * 1.25,
            -0.12 + Math.sin(elapsed * 1.15) * 0.18,
            Math.cos(elapsed * 0.58) * 1.05,
          );
        }
        if (delta > 0) {
          simulation.moveSphere(previousSphere, sphere.position, 0.25, {
            width,
            depth,
            displacementScale: 1.0,
          });
          simulation.stepSimulation(3);
          simulation.updateNormals();
        }
        previousSphere.copy(sphere.position);
        syncMaterials();
        causticsPass.update(simulation.texture);
        const debugValue = poolWaterDebugModes.get(debugMode) ?? 0;
        waterMaterial.uniforms.uDebugMode.value = debugValue;
        poolMaterial.uniforms.uDebugMode.value = debugValue;
      },
      render() {
        syncMaterials();
        renderer.render(scene, camera);
      },
      metrics() {
        return {
          state: "256² RGBA height/velocity/normal",
          simulationSteps: "3/frame",
        };
      },
      dispose() {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", stopDrag);
        canvas.removeEventListener("pointercancel", stopDrag);
        simulation.dispose();
        causticsPass.dispose();
        pool.geometry.dispose();
        poolMaterial.dispose();
        water.geometry.dispose();
        waterMaterial.dispose();
        sphere.geometry.dispose();
        sphere.material.dispose();
        skybox.dispose();
        tileTexture.dispose();
      },
    };
  },
};
