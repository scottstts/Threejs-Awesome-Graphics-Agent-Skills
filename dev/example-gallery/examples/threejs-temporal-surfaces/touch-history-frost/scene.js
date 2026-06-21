import { FrostSurfaceEffect } from
  "/skills/threejs-temporal-surfaces/examples/touch-history-frost/frost-surface-effect.js";

export default {
  renderer: {
    options: { antialias: false },
    exposure: 1,
    clearColor: 0x10141c,
  },
  camera: { type: "orthographic" },
  controls: { enabled: false },

  async setup({ THREE, renderer, canvas }) {
    const loader = new THREE.TextureLoader();
    const [
      sceneTexture,
      noiseTexture,
      mainNormalTexture,
      detailNormalTexture,
    ] = await Promise.all([
      loader.loadAsync(
        "/dev/example-gallery/assets/frozen/winter_forest.jpeg",
      ),
      loader.loadAsync(
        "/dev/example-gallery/assets/frozen/noise.webp",
      ),
      loader.loadAsync(
        "/dev/example-gallery/assets/frozen/main-normal.webp",
      ),
      loader.loadAsync(
        "/dev/example-gallery/assets/frozen/sub-normal.webp",
      ),
    ]);

    sceneTexture.colorSpace = THREE.SRGBColorSpace;
    for (const texture of [
      sceneTexture,
      noiseTexture,
      mainNormalTexture,
      detailNormalTexture,
    ]) {
      texture.wrapS = THREE.MirroredRepeatWrapping;
      texture.wrapT = THREE.MirroredRepeatWrapping;
      texture.needsUpdate = true;
    }

    const effect = new FrostSurfaceEffect(renderer, {
      sceneTexture,
      noiseTexture,
      mainNormalTexture,
      detailNormalTexture,
    });

    let touching = canvas.matches(":hover");
    const updatePointer = (event) => {
      const bounds = canvas.getBoundingClientRect();
      effect.setPointer(
        ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        -(((event.clientY - bounds.top) / bounds.height) * 2 - 1),
        touching,
      );
    };
    const onPointerDown = (event) => {
      if (event.pointerType === "touch") touching = true;
      canvas.setPointerCapture(event.pointerId);
      updatePointer(event);
    };
    const onPointerMove = (event) => {
      if (event.pointerType !== "touch") touching = true;
      if (touching) updatePointer(event);
    };
    const onPointerUp = (event) => {
      if (event.pointerType === "touch") touching = false;
      effect.setPointer(effect.pointer.x, effect.pointer.y, false);
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
    };
    const onPointerOver = (event) => {
      if (event.pointerType !== "touch") {
        touching = true;
        updatePointer(event);
      }
    };
    const onPointerOut = (event) => {
      if (event.pointerType !== "touch") {
        touching = false;
        effect.setPointer(effect.pointer.x, effect.pointer.y, false);
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerover", onPointerOver);
    canvas.addEventListener("pointerout", onPointerOut);

    return {
      resize({ bufferWidth, bufferHeight }) {
        effect.resize(bufferWidth, bufferHeight);
      },
      setDebugMode(mode) {
        effect.setDebugMode(mode);
      },
      update({ delta }) {
        effect.update(delta);
      },
      render() {
        effect.render();
      },
      metrics() {
        return { tier: "full frost + 0.4× blur + half-float history" };
      },
      dispose() {
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerUp);
        canvas.removeEventListener("pointerover", onPointerOver);
        canvas.removeEventListener("pointerout", onPointerOut);
        effect.dispose();
        sceneTexture.dispose();
        noiseTexture.dispose();
        mainNormalTexture.dispose();
        detailNormalTexture.dispose();
      },
    };
  },
};
