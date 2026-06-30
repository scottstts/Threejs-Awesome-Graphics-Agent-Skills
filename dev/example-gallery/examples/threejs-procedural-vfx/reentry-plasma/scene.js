import { createReentryPlasma } from
  "/skills/threejs-procedural-vfx/examples/reentry-plasma/reentry-plasma.js";

export default {
  backend: "webgl",
  initialTime: 0,
  renderer: {
    options: {
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    },
    clearColor: 0x000000,
  },
  camera: {
    fov: 42,
    near: 0.01,
    far: 100,
    position: [5.4, 0.55, 2.2],
  },
  controls: {
    target: [0, 0, -2.55],
    enablePan: false,
    enableZoom: false,
  },

  async setup({ THREE, renderer, scene, camera }) {
    scene.background = new THREE.Color(0x000000);

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.setClearColor(0x000000, 1);

    camera.position.set(5.4, 0.55, 2.2);
    camera.lookAt(0, 0, -2.55);

    const plasma = createReentryPlasma();
    plasma.object.rotation.set(-0.08, 0, -0.05);
    scene.add(plasma.object);

    let targetRotationX = -0.02;
    let targetRotationY = 0;
    let isDragging = false;
    let lastPointerX = 0;
    let lastPointerY = 0;

    const canvas = renderer.domElement;

    const handlePointerDown = (event) => {
      isDragging = true;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
      if (!isDragging) return;

      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;

      targetRotationY += dx * 0.006;
      targetRotationX += dy * 0.006;
      targetRotationX = THREE.MathUtils.clamp(targetRotationX, -0.9, 0.9);
    };

    const handlePointerUp = (event) => {
      isDragging = false;
      canvas.releasePointerCapture?.(event.pointerId);
    };

    const handlePointerCancel = () => {
      isDragging = false;
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerup", handlePointerUp);
    canvas.addEventListener("pointercancel", handlePointerCancel);

    return {
      setDebugMode(mode) {
        plasma.setDebugMode(mode);
      },
      update({ elapsed }) {
        plasma.update(elapsed);

        if (!isDragging) {
          targetRotationY += 0.0012;
        }

        plasma.object.rotation.x += (targetRotationX - plasma.object.rotation.x) * 0.08;
        plasma.object.rotation.y += (targetRotationY - plasma.object.rotation.y) * 0.08;

        const breath = 1 + Math.sin(elapsed * 1.1) * 0.012;
        plasma.object.scale.set(1, 1, breath);
      },
      render() {
        renderer.render(scene, camera);
      },
      dispose() {
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", handlePointerUp);
        canvas.removeEventListener("pointercancel", handlePointerCancel);
        plasma.dispose();
      },
    };
  },
};
