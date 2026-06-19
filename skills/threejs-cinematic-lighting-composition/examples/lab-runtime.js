export function createLabRuntime({ renderer, scene, camera = null, controls = null, onResize = null, resources = [] }) {
  const host = renderer.domElement.parentElement ?? document.body;
  const listeners = [];
  const timers = new Set();
  let disposed = false;
  function resize() {
    const bounds = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(bounds.width));
    const height = Math.max(1, Math.round(bounds.height));
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    if (camera?.isPerspectiveCamera) {
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    onResize?.({ width, height });
  }
  function listen(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    listeners.push(() => target.removeEventListener(type, handler, options));
  }
  function scheduleInterval(handler, delay) {
    const timer = window.setInterval(handler, delay);
    timers.add(timer);
    return timer;
  }
  function pointerNdc(event, target = renderer.domElement) {
    const bounds = target.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      y: -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    };
  }
  function dispose() {
    if (disposed) return;
    disposed = true;
    renderer.setAnimationLoop(null);
    observer?.disconnect();
    for (const remove of listeners.splice(0)) remove();
    for (const timer of timers) window.clearInterval(timer);
    controls?.dispose?.();
    for (const resource of resources) resource?.dispose?.();
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      const objectMaterials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
      for (const material of objectMaterials) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) texture.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  observer?.observe(host);
  listen(window, "resize", resize);
  listen(window, "pagehide", dispose, { once: true });
  resize();
  return { dispose, listen, pointerNdc, resize, scheduleInterval };
}
