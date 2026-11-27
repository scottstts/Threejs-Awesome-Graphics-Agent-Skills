#!/usr/bin/env node
// march-plan.mjs: plan a spherical-shell cloud raymarch before writing the shader.
// Reports path length, first/last step length, steps per feature, and banding risk
// across view elevations (90 deg down to 0.5 deg) to prevent horizon stair-stepping.
//
// Usage:
//   node march-plan.mjs '{"bottom":1500,"top":4000,"eye":2,"steps":64,"growth":1.0,"feature":120,"maxDist":60000}'
//   node march-plan.mjs --self-test
// Fields: bottom/top (m), eye height (m), steps (count), growth (step ratio; 1 = uniform),
// feature (m, smallest cloud detail to resolve), maxDist (m, march cutoff / far-layer handover).
const R = 6371e3;

function shell(eye, elevDeg, rLayer) {
  const e = (elevDeg * Math.PI) / 180;
  const oy = R + eye;
  const dy = Math.sin(e);
  const b = oy * dy;
  const c = oy * oy - rLayer * rLayer;
  const disc = b * b - c;
  if (disc < 0) return null;
  const s = Math.sqrt(disc);
  const t0 = -b - s;
  const t1 = -b + s;
  return t1 > 0 ? [Math.max(0, t0), t1] : null;
}

export function plan({
  bottom = 1500,
  top = 4000,
  eye = 2,
  steps = 64,
  growth = 1.0,
  feature = 120,
  maxDist = 60000,
} = {}) {
  const rows = [];
  for (const elev of [90, 45, 20, 10, 5, 2, 1, 0.5]) {
    const inner = shell(eye, elev, R + bottom);
    const outer = shell(eye, elev, R + top);
    if (!outer) continue;
    const enter = eye < bottom ? inner[1] : 0;
    const exit = Math.min(outer[1], maxDist);
    const path = Math.max(0, exit - enter);
    const first = growth === 1 ? path / steps : (path * (growth - 1)) / (growth ** steps - 1);
    const last = growth === 1 ? first : first * growth ** (steps - 1);
    rows.push({
      elevationDeg: elev,
      pathKm: +(path / 1000).toFixed(2),
      firstStepM: +first.toFixed(1),
      lastStepM: +last.toFixed(1),
      stepsPerFeature: path > 0 ? +(feature / last).toFixed(2) : null,
      banding: path === 0 ? "n/a (layer beyond maxDist)" : last > feature * 1.5 ? "risk" : "ok",
    });
  }
  const worst = rows.reduce((m, r) => Math.max(m, r.lastStepM), 0);
  const needed = rows.map((r) => Math.ceil((r.pathKm * 1000) / (feature / 1.5)));
  return {
    rows,
    worstStepM: worst,
    stepsNeededForWorstPath: Math.max(...needed),
    advice:
      worst > feature * 1.5
        ? "bound step length by feature size (more steps, empty-space skip, or shorter maxDist faded into a baked far layer); pair with a per-pixel start offset denoised/accumulated cleanly"
        : "step length resolves the target feature size at every elevation",
  };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const a = process.argv[2];
  if (a === "--self-test") {
    const bad = plan({ steps: 44, growth: 1.06, feature: 120, maxDist: 40000 });
    const good = plan({ steps: bad.stepsNeededForWorstPath, growth: 1.0, feature: 120, maxDist: 40000 });
    const ok =
      bad.rows.some((r) => r.banding === "risk") &&
      good.rows.every((r) => r.banding !== "risk") &&
      good.rows.filter((r) => r.banding === "ok").length >= 5 &&
      bad.rows[0].pathKm > 2.4 &&
      bad.rows[0].pathKm < 2.6;
    console.log(JSON.stringify({ bad: bad.rows.slice(-3), good: good.rows.slice(-3) }, null, 1));
    if (!ok) {
      console.error("SELF-TEST FAILED");
      process.exit(1);
    }
    console.log("march-plan self-test passed");
  } else {
    console.log(JSON.stringify(plan(a ? JSON.parse(a) : {}), null, 2));
  }
}
