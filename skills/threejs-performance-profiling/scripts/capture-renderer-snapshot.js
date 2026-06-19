export function captureRendererSnapshot(renderer, {
  label = "snapshot",
  viewport = null,
  quality = null,
} = {}) {
  const info = renderer.info;
  const memory = info.memory ?? {};
  const render = info.render ?? {};
  const programs = Array.isArray(info.programs) ? info.programs.length : null;

  return {
    label,
    capturedAt: new Date().toISOString(),
    viewport,
    quality,
    renderer: {
      pixelRatio: renderer.getPixelRatio?.() ?? null,
      outputColorSpace: renderer.outputColorSpace ?? null,
      toneMapping: renderer.toneMapping ?? null,
      shadowEnabled: renderer.shadowMap?.enabled ?? null,
    },
    render: {
      calls: render.calls ?? null,
      triangles: render.triangles ?? null,
      points: render.points ?? null,
      lines: render.lines ?? null,
      frame: info.frame ?? null,
    },
    memory: {
      geometries: memory.geometries ?? null,
      textures: memory.textures ?? null,
    },
    programs,
  };
}

export function downloadRendererSnapshot(snapshot, filename = "renderer-snapshot.json") {
  const blob = new Blob([`${JSON.stringify(snapshot, null, 2)}\n`], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
