const elements = {
  search: document.querySelector("#search"),
  refresh: document.querySelector("#refresh"),
  toggleView: document.querySelector("#toggle-view"),
  count: document.querySelector("#example-count"),
  runtimeSummary: document.querySelector("#runtime-summary"),
  list: document.querySelector("#example-list"),
  empty: document.querySelector("#empty-state"),
  single: document.querySelector("#single-view"),
  overview: document.querySelector("#overview"),
  kicker: document.querySelector("#example-kicker"),
  title: document.querySelector("#example-title"),
  description: document.querySelector("#example-description"),
  tags: document.querySelector("#technique-tags"),
  viewport: document.querySelector("#viewport"),
  dpr: document.querySelector("#dpr"),
  timeScale: document.querySelector("#time-scale"),
  debugControl: document.querySelector("#debug-control"),
  debugMode: document.querySelector("#debug-mode"),
  pause: document.querySelector("#pause"),
  reload: document.querySelector("#reload"),
  capture: document.querySelector("#capture"),
  standalone: document.querySelector("#standalone"),
  stage: document.querySelector("#stage"),
  frame: document.querySelector("#example-frame"),
  frameStatus: document.querySelector("#frame-status"),
  frameMetrics: document.querySelector("#frame-metrics"),
  frameSize: document.querySelector("#frame-size"),
};

const state = {
  examples: [],
  filtered: [],
  selectedId: null,
  mode: "single",
  paused: false,
  dpr: 1,
  timeScale: 1,
  debugMode: "final",
  viewport: "responsive",
};

function selectedExample() {
  return state.examples.find((example) => example.id === state.selectedId) ?? null;
}

function exampleUrl(example) {
  const url = new URL(example.entry, window.location.origin);
  url.searchParams.set("galleryDpr", state.dpr);
  url.searchParams.set("galleryTimeScale", state.timeScale);
  url.searchParams.set("galleryPaused", state.paused ? "1" : "0");
  url.searchParams.set("galleryDebugMode", state.debugMode);
  return url.href;
}

function sendState() {
  elements.frame.contentWindow?.postMessage(
    {
      source: "threejs-example-gallery",
      type: "set-state",
      state: {
        paused: state.paused,
        dpr: state.dpr,
        timeScale: state.timeScale,
        debugMode: state.debugMode,
      },
    },
    window.location.origin,
  );
}

function setFrameStatus(label, status = "idle") {
  elements.frameStatus.textContent = label;
  elements.frameStatus.dataset.state = status;
}

function applyViewport() {
  const example = selectedExample();
  let dimensions = null;
  if (state.viewport === "default" && example) {
    dimensions = example.defaultViewport;
  } else if (state.viewport !== "responsive") {
    const [width, height] = state.viewport.split("x").map(Number);
    dimensions = { width, height };
  }

  if (!dimensions) {
    elements.frame.style.width = "100%";
    elements.frame.style.height = "100%";
    elements.frameSize.textContent = "responsive";
    return;
  }

  elements.frame.style.width = `${dimensions.width}px`;
  elements.frame.style.height = `${dimensions.height}px`;
  elements.frameSize.textContent = `${dimensions.width} × ${dimensions.height}`;
}

function updateDebugModes(example) {
  elements.debugMode.replaceChildren();
  if (example.debugModes.length === 0) {
    state.debugMode = "final";
    elements.debugControl.hidden = true;
    return;
  }

  elements.debugControl.hidden = false;
  for (const mode of example.debugModes) {
    const option = document.createElement("option");
    option.value = mode.value;
    option.textContent = mode.label;
    elements.debugMode.append(option);
  }
  if (!example.debugModes.some((mode) => mode.value === state.debugMode)) {
    state.debugMode = example.debugModes[0].value;
  }
  elements.debugMode.value = state.debugMode;
}

function renderList() {
  elements.list.replaceChildren();
  const groups = new Map();
  for (const example of state.filtered) {
    const group = example.skill ?? "Gallery fixtures";
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(example);
  }

  for (const [skill, examples] of groups) {
    const section = document.createElement("section");
    section.className = "skill-group";
    const heading = document.createElement("h3");
    heading.textContent = skill;
    section.append(heading);

    for (const example of examples) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "example-link";
      button.dataset.exampleId = example.id;
      button.setAttribute(
        "aria-current",
        String(example.id === state.selectedId),
      );
      const title = document.createElement("strong");
      title.textContent = example.title;
      const detail = document.createElement("span");
      detail.textContent = `${example.backend} · ${
        example.techniques.slice(0, 2).join(" · ") || "unclassified"
      }`;
      button.append(title, detail);
      button.addEventListener("click", () => selectExample(example.id));
      section.append(button);
    }
    elements.list.append(section);
  }
}

function renderOverview() {
  elements.overview.replaceChildren();
  for (const example of state.filtered) {
    const article = document.createElement("article");
    article.className = "overview-card";
    const frame = document.createElement("iframe");
    frame.className = "overview-frame";
    frame.title = example.title;
    frame.loading = "lazy";
    const url = new URL(example.entry, window.location.origin);
    url.searchParams.set("galleryPaused", "1");
    url.searchParams.set("galleryDpr", "0.75");
    url.searchParams.set("galleryDebugMode", "final");
    frame.src = url.href;

    const footer = document.createElement("footer");
    const detail = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = example.title;
    const caption = document.createElement("small");
    caption.textContent = `${example.skill ?? "fixture"} · ${example.backend}`;
    detail.append(title, caption);
    const inspect = document.createElement("button");
    inspect.type = "button";
    inspect.textContent = "Inspect";
    inspect.addEventListener("click", () => {
      state.mode = "single";
      selectExample(example.id);
    });
    footer.append(detail, inspect);
    article.append(frame, footer);
    elements.overview.append(article);
  }
}

function renderMode() {
  const hasExamples = state.examples.length > 0;
  elements.empty.hidden = hasExamples;
  elements.single.hidden = !hasExamples || state.mode !== "single";
  elements.overview.hidden = !hasExamples || state.mode !== "overview";
  elements.toggleView.textContent =
    state.mode === "single" ? "Overview" : "Single view";
  if (state.mode === "overview") renderOverview();
}

function selectExample(id, { reload = true } = {}) {
  state.selectedId = id;
  const example = selectedExample();
  if (!example) return;

  state.mode = "single";
  state.dpr = example.defaultDpr;
  state.viewport = "default";
  state.debugMode = example.debugModes[0]?.value ?? "final";

  elements.kicker.textContent = `${example.skill ?? "Gallery fixture"} · ${example.backend}`;
  elements.title.textContent = example.title;
  elements.description.textContent =
    example.description || "No example description supplied.";
  elements.tags.replaceChildren(
    ...example.techniques.map((technique) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = technique;
      return span;
    }),
  );
  elements.dpr.value = String(state.dpr);
  elements.viewport.value = state.viewport;
  elements.timeScale.value = String(state.timeScale);
  updateDebugModes(example);
  elements.standalone.href = exampleUrl(example);
  elements.pause.textContent = state.paused ? "Resume" : "Pause";
  applyViewport();
  renderList();
  renderMode();

  if (reload) {
    setFrameStatus("loading");
    elements.frameMetrics.textContent = "";
    elements.frame.src = exampleUrl(example);
  }

  const url = new URL(window.location.href);
  url.searchParams.set("example", id);
  history.replaceState(null, "", url);
}

function applyFilter() {
  const query = elements.search.value.trim().toLowerCase();
  state.filtered = state.examples.filter((example) => {
    if (!query) return true;
    const haystack = [
      example.title,
      example.description,
      example.skill,
      example.backend,
      ...example.techniques,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
  renderList();
  if (state.mode === "overview") renderOverview();
}

async function loadExamples({ preserveSelection = true } = {}) {
  elements.runtimeSummary.textContent = "discovering";
  const response = await fetch("/api/examples", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Discovery failed with ${response.status}`);
  }
  const payload = await response.json();
  state.examples = payload.examples;
  state.filtered = payload.examples;
  elements.count.textContent = `${payload.count} ${
    payload.count === 1 ? "example" : "examples"
  }`;
  elements.runtimeSummary.textContent = "runtime ready";

  const requested = new URL(window.location.href).searchParams.get("example");
  const previous = preserveSelection ? state.selectedId : null;
  const nextId = [requested, previous].find((id) =>
    state.examples.some((example) => example.id === id)
  ) ?? state.examples[0]?.id ?? null;

  renderMode();
  if (nextId) selectExample(nextId);
  else renderList();
}

function adjacentExample(offset) {
  if (state.filtered.length === 0) return;
  const index = state.filtered.findIndex(
    (example) => example.id === state.selectedId,
  );
  const next =
    (Math.max(index, 0) + offset + state.filtered.length) %
    state.filtered.length;
  selectExample(state.filtered[next].id);
}

elements.search.addEventListener("input", applyFilter);
elements.refresh.addEventListener("click", () => loadExamples());
elements.toggleView.addEventListener("click", () => {
  state.mode = state.mode === "single" ? "overview" : "single";
  renderMode();
});
elements.viewport.addEventListener("change", () => {
  state.viewport = elements.viewport.value;
  applyViewport();
});
elements.dpr.addEventListener("change", () => {
  state.dpr = Number(elements.dpr.value);
  sendState();
});
elements.timeScale.addEventListener("change", () => {
  state.timeScale = Number(elements.timeScale.value);
  sendState();
});
elements.debugMode.addEventListener("change", () => {
  state.debugMode = elements.debugMode.value;
  sendState();
});
elements.pause.addEventListener("click", () => {
  state.paused = !state.paused;
  elements.pause.textContent = state.paused ? "Resume" : "Pause";
  sendState();
});
elements.reload.addEventListener("click", () => {
  const example = selectedExample();
  if (example) {
    setFrameStatus("loading");
    elements.frame.src = exampleUrl(example);
  }
});
elements.capture.addEventListener("click", () => {
  const example = selectedExample();
  if (!example) return;
  elements.frame.contentWindow?.postMessage(
    {
      source: "threejs-example-gallery",
      type: "capture",
      filename: `${example.slug}-${state.debugMode}.png`,
    },
    window.location.origin,
  );
});

elements.frame.addEventListener("load", () => {
  setFrameStatus("loaded");
  sendState();
  elements.frame.contentWindow?.postMessage(
    { source: "threejs-example-gallery", type: "ping" },
    window.location.origin,
  );
});

window.addEventListener("message", (event) => {
  if (event.origin !== window.location.origin) return;
  if (event.data?.source !== "threejs-example") return;

  if (event.data.type === "ready") {
    setFrameStatus("ready", "ready");
  } else if (event.data.type === "runtime-error") {
    setFrameStatus(event.data.message || "runtime error", "error");
  } else if (event.data.type === "metrics") {
    elements.frameMetrics.textContent = Object.entries(event.data.metrics ?? {})
      .map(([key, value]) => `${key} ${value}`)
      .join(" · ");
  } else if (event.data.type === "capture") {
    const url = URL.createObjectURL(event.data.blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = event.data.filename ?? "example.png";
    anchor.click();
    URL.revokeObjectURL(url);
  } else if (event.data.type === "capture-error") {
    setFrameStatus(event.data.message, "error");
  }
});

window.addEventListener("keydown", (event) => {
  const typing =
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLSelectElement;
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    elements.search.focus();
    return;
  }
  if (typing) return;

  if (event.key === "j" || event.key === "ArrowDown") {
    event.preventDefault();
    adjacentExample(1);
  } else if (event.key === "k" || event.key === "ArrowUp") {
    event.preventDefault();
    adjacentExample(-1);
  } else if (event.key.toLowerCase() === "r") {
    elements.reload.click();
  } else if (event.key.toLowerCase() === "g") {
    elements.toggleView.click();
  } else if (event.code === "Space") {
    event.preventDefault();
    elements.pause.click();
  }
});

loadExamples({ preserveSelection: false }).catch((error) => {
  elements.runtimeSummary.textContent = "discovery failed";
  elements.empty.hidden = false;
  elements.empty.querySelector("h2").textContent = error.message;
});
