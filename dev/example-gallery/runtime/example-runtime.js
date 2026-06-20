const SOURCE_GALLERY = "threejs-example-gallery";
const SOURCE_EXAMPLE = "threejs-example";

const params = new URLSearchParams(window.location.search);
let state = {
  paused: params.get("galleryPaused") === "1",
  dpr: Number.parseFloat(params.get("galleryDpr") ?? "") || 1,
  timeScale: Number.parseFloat(params.get("galleryTimeScale") ?? "") || 1,
  debugMode: params.get("galleryDebugMode") ?? "final",
};

const subscribers = new Set();
const renderers = new Set();
let captureCanvas = null;
let ready = false;

function send(type, detail = {}) {
  if (window.parent === window) return;
  window.parent.postMessage(
    { source: SOURCE_EXAMPLE, type, ...detail },
    window.location.origin,
  );
}

function applyRendererState(renderer) {
  renderer.setPixelRatio?.(state.dpr);
}

function notify() {
  for (const renderer of renderers) applyRendererState(renderer);
  for (const subscriber of subscribers) subscriber({ ...state });
  send("state", { state });
}

async function capture(filename) {
  const canvas = captureCanvas ?? document.querySelector("canvas");
  if (!canvas) {
    send("capture-error", { message: "The example has no canvas to capture." });
    return;
  }

  await new Promise((resolve) => requestAnimationFrame(resolve));
  canvas.toBlob((blob) => {
    if (!blob) {
      send("capture-error", {
        message:
          "Canvas capture failed. Check preserveDrawingBuffer or cross-origin assets.",
      });
      return;
    }
    send("capture", { blob, filename });
  }, "image/png");
}

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data?.source !== SOURCE_GALLERY) return;

  if (event.data.type === "set-state") {
    state = { ...state, ...event.data.state };
    notify();
  } else if (event.data.type === "capture") {
    capture(event.data.filename);
  } else if (event.data.type === "ping") {
    send("ready", { state });
  }
});

window.addEventListener("error", (event) => {
  send("runtime-error", {
    message: event.message,
    stack: event.error?.stack ?? "",
  });
});

window.addEventListener("unhandledrejection", (event) => {
  send("runtime-error", {
    message: event.reason?.message ?? String(event.reason),
    stack: event.reason?.stack ?? "",
  });
});

function markReady() {
  if (ready) return;
  ready = true;
  document.documentElement.dataset.exampleReady = "true";
  send("ready", { state });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", markReady, { once: true });
} else {
  markReady();
}

export const exampleRuntime = {
  get state() {
    return { ...state };
  },

  bindRenderer(renderer) {
    renderers.add(renderer);
    applyRendererState(renderer);
    return () => renderers.delete(renderer);
  },

  setCaptureCanvas(canvas) {
    captureCanvas = canvas;
  },

  onStateChange(callback) {
    subscribers.add(callback);
    callback({ ...state });
    return () => subscribers.delete(callback);
  },

  frameDelta(deltaSeconds) {
    return state.paused ? 0 : deltaSeconds * state.timeScale;
  },

  reportMetrics(metrics) {
    send("metrics", { metrics });
  },

  reportStatus(status, detail = {}) {
    send("status", { status, ...detail });
  },

  ready: markReady,
};
