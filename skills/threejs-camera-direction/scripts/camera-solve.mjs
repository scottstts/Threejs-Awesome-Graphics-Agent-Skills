#!/usr/bin/env node
// camera-solve.mjs: solve a level pinhole camera (focal length, pitch, eye height, roll)
// from cues measured in a reference image, then back-project landmarks to world positions.
//
// Usage:
//   node camera-solve.mjs input.json          solve and print a JSON report
//   node camera-solve.mjs --self-test         run synthetic recovery verification
//
// Conventions: pixel (u, v) origin at top-left, v pointing down. World: Y up, ground at y = 0,
// camera at (0, h, 0) looking along -Z. Positive pitch looks up; positive roll raises right horizon.
const D = Math.PI / 180;
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function makeCam(p, W, H, pp) {
  const [f, pitch, h, roll] = p;
  const cx = pp ? pp[0] : W / 2;
  const cy = pp ? pp[1] : H / 2;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cr = Math.cos(roll);
  const sr = Math.sin(roll);
  const fw = [0, sp, -cp];
  const up0 = [0, cp, sp];
  const r0 = [1, 0, 0];
  const right = [r0[0] * cr + up0[0] * sr, r0[1] * cr + up0[1] * sr, r0[2] * cr + up0[2] * sr];
  const up = [up0[0] * cr - r0[0] * sr, up0[1] * cr - r0[1] * sr, up0[2] * cr - r0[2] * sr];
  const eye = [0, h, 0];
  const project = (X) => {
    const d = [X[0] - eye[0], X[1] - eye[1], X[2] - eye[2]];
    const z = d[0] * fw[0] + d[1] * fw[1] + d[2] * fw[2];
    const x = d[0] * right[0] + d[1] * right[1] + d[2] * right[2];
    const y = d[0] * up[0] + d[1] * up[1] + d[2] * up[2];
    return [cx + (f * x) / z, cy - (f * y) / z, z];
  };
  const projectDir = (dv) => {
    const z = dv[0] * fw[0] + dv[1] * fw[1] + dv[2] * fw[2];
    const x = dv[0] * right[0] + dv[1] * right[1] + dv[2] * right[2];
    const y = dv[0] * up[0] + dv[1] * up[1] + dv[2] * up[2];
    return [cx + (f * x) / z, cy - (f * y) / z, z];
  };
  const ray = (u, v) => {
    const x = (u - cx) / f;
    const y = (cy - v) / f;
    return [
      fw[0] + right[0] * x + up[0] * y,
      fw[1] + right[1] * x + up[1] * y,
      fw[2] + right[2] * x + up[2] * y,
    ];
  };
  const ground = (u, v) => {
    const r = ray(u, v);
    if (r[1] >= -1e-9) return null;
    const t = -h / r[1];
    return [r[0] * t, 0, r[2] * t];
  };
  return { f, pitch, h, roll, cx, cy, project, projectDir, ray, ground, fw, right, up };
}

function residuals(p, obs) {
  const { W, H, pp } = obs;
  const cam = makeCam(p, W, H, pp);
  const r = [];
  if (obs.horizon) {
    for (const [u, v] of obs.horizon) {
      const x = (u - cam.cx) / cam.f;
      const y = -(cam.fw[1] + cam.right[1] * x) / cam.up[1];
      r.push(cam.cy - y * cam.f - v);
    }
  }
  for (const o of obs.objects || []) {
    const g = cam.ground(o.base[0], o.base[1]);
    if (!g) {
      r.push(1e3, 1e3);
      continue;
    }
    const t = cam.project([g[0], o.height, g[2]]);
    r.push(t[0] - o.top[0], t[1] - o.top[1]);
  }
  for (const [a, b] of obs.verticals || []) {
    const vp = cam.projectDir([0, 1, 0]);
    const ax = b[0] - a[0];
    const ay = b[1] - a[1];
    let dx;
    let dy;
    if (Math.abs(vp[2]) < 1e-9) {
      dx = -Math.sin(cam.roll);
      dy = -Math.cos(cam.roll);
    } else {
      dx = vp[0] - a[0];
      dy = vp[1] - a[1];
    }
    r.push((ax * dy - ay * dx) / (Math.hypot(dx, dy) || 1));
  }
  for (const [p1, p2] of obs.orthogonalVPs || []) {
    const d1 = cam.ray(p1[0], p1[1]);
    const d2 = cam.ray(p2[0], p2[1]);
    const n1 = Math.hypot(...d1);
    const n2 = Math.hypot(...d2);
    r.push(((d1[0] * d2[0] + d1[1] * d2[1] + d1[2] * d2[2]) / (n1 * n2)) * 500);
  }
  if (obs.fovPrior) r.push(((2 * Math.atan(H / 2 / cam.f)) / D - obs.fovPrior) * 0.5);
  if (obs.eyeHeight && !(obs.objects && obs.objects.length)) r.push((cam.h - obs.eyeHeight) * 100);
  return r;
}

function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    if (Math.abs(M[c][c]) < 1e-14) return null;
    for (let r = c + 1; r < n; r++) {
      const k = M[r][c] / M[c][c];
      for (let j = c; j <= n; j++) M[r][j] -= k * M[c][j];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let j = r + 1; j < n; j++) s -= M[r][j] * x[j];
    x[r] = s / M[r][r];
  }
  return x;
}

function lm(p0, obs, iters = 200) {
  let p = [...p0];
  let lambda = 1e-3;
  const cost = (q) => residuals(q, obs).reduce((s, v) => s + v * v, 0);
  let c = cost(p);
  const steps = [1e-3 * p0[0], 1e-5, 1e-4, 1e-6];
  for (let it = 0; it < iters; it++) {
    const r = residuals(p, obs);
    const J = [];
    for (let k = 0; k < p.length; k++) {
      const q = [...p];
      q[k] += steps[k];
      const rk = residuals(q, obs);
      J.push(rk.map((v, i) => (v - r[i]) / steps[k]));
    }
    const n = p.length;
    const A = [...Array(n)].map(() => new Array(n).fill(0));
    const g = new Array(n).fill(0);
    for (let i = 0; i < r.length; i++) {
      for (let a = 0; a < n; a++) {
        g[a] -= J[a][i] * r[i];
        for (let b = 0; b < n; b++) A[a][b] += J[a][i] * J[b][i];
      }
    }
    let improved = false;
    for (let tries = 0; tries < 12; tries++) {
      const Ad = A.map((row, i) => row.map((v, j) => (i === j ? v * (1 + lambda) + 1e-12 : v)));
      const dp = solveLinear(Ad, g);
      if (!dp) {
        lambda *= 10;
        continue;
      }
      const q = p.map((v, i) => v + dp[i]);
      q[0] = Math.max(q[0], 1);
      q[2] = Math.max(q[2], 1e-3);
      q[1] = wrapAngle(q[1]);
      q[3] = wrapAngle(q[3]);
      const cq = cost(q);
      if (cq < c) {
        p = q;
        c = cq;
        lambda = Math.max(lambda / 3, 1e-9);
        improved = true;
        break;
      }
      lambda *= 10;
    }
    if (!improved || c < 1e-12) break;
  }
  return { p, cost: c };
}

export function solveCamera(input) {
  const W = input.width;
  const H = input.height;
  if (!W || !H) throw new Error("width and height are required");
  const obs = {
    W,
    H,
    pp: input.principal || null,
    horizon: input.horizon || null,
    objects: input.objects || [],
    verticals: input.verticals || [],
    orthogonalVPs: input.orthogonalVPs || [],
    fovPrior: input.fovPrior || null,
    eyeHeight: input.eyeHeight || null,
  };
  const hasScale = obs.objects.length > 0 || obs.eyeHeight;
  if (!hasScale) throw new Error("need at least one object of known height or an eyeHeight prior to fix scale");
  let best = null;
  for (const fov of [20, 30, 40, 50, 60, 75]) {
    for (const pitch of [-20, -8, 0, 8, 20]) {
      for (const h of [1.6, 5, 25]) {
        const f = H / 2 / Math.tan((fov * D) / 2);
        const res = lm([f, pitch * D, h, 0], obs);
        if (!best || res.cost < best.cost) best = res;
      }
    }
  }
  const [f, pitch, h, roll] = best.p;
  const cam = makeCam(best.p, W, H, obs.pp);
  const r = residuals(best.p, obs);
  const vfov = (2 * Math.atan(H / 2 / f)) / D;
  const hfov = (2 * Math.atan(W / 2 / f)) / D;
  return {
    verticalFovDeg: +vfov.toFixed(2),
    horizontalFovDeg: +hfov.toFixed(2),
    focal35mmEquivalent: +((f * Math.hypot(36, 24)) / Math.hypot(W, H)).toFixed(1),
    pitchDeg: +(pitch / D).toFixed(2),
    rollDeg: +(roll / D).toFixed(2),
    eyeHeight: +h.toFixed(3),
    rmsResidualPx: +Math.sqrt(r.reduce((s, v) => s + v * v, 0) / Math.max(1, r.length)).toFixed(2),
    objects: (input.objects || []).map((o) => {
      const g = cam.ground(o.base[0], o.base[1]);
      return { name: o.name, x: g && +g[0].toFixed(2), z: g && +g[2].toFixed(2), distance: g && +Math.hypot(g[0], g[2]).toFixed(2) };
    }),
    groundPoints: Object.fromEntries(
      Object.entries(input.groundPoints || {}).map(([k, [u, v]]) => {
        const g = cam.ground(u, v);
        return [k, g ? { x: +g[0].toFixed(2), z: +g[2].toFixed(2), distance: +Math.hypot(g[0], g[2]).toFixed(2) } : "above horizon"];
      }),
    ),
    lensClass: hfov > 75 ? "wide" : hfov > 50 ? "normal" : hfov > 30 ? "slightly long" : "long",
  };
}

function selfTest() {
  const W = 2000;
  const H = 1125;
  const truth = [H / 2 / Math.tan((38 * D) / 2), 12 * D, 1.62, 0.6 * D];
  const cam = makeCam(truth, W, H, null);
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) - 0.5;
  const noisy = ([u, v]) => [u + rnd() * 1.0, v + rnd() * 1.0];
  const objects = [];
  for (const [x, z, hgt, name] of [
    [-6, -18, 2.4, "door"],
    [5, -40, 7.5, "tree"],
    [-2, -75, 12, "house"],
    [9, -28, 3.1, "lamp"],
  ]) {
    const b = cam.project([x, 0, z]);
    const t = cam.project([x, hgt, z]);
    objects.push({ name, base: noisy(b), top: noisy(t), height: hgt });
  }
  const hz = [cam.projectDir([-1, 0, -3]), cam.projectDir([1, 0, -3])].map((p) => noisy(p));
  const vert = [[noisy(cam.project([12, 0, -30])), noisy(cam.project([12, 9, -30]))]];
  const out = solveCamera({ width: W, height: H, horizon: hz, objects, verticals: vert });
  const ok =
    Math.abs(out.verticalFovDeg - 38) < 1.0 &&
    Math.abs(out.pitchDeg - 12) < 0.5 &&
    Math.abs(out.eyeHeight - 1.62) < 0.08 &&
    Math.abs(out.rollDeg - 0.6) < 0.3 &&
    out.rmsResidualPx < 2;
  const door = out.objects.find((o) => o.name === "door");
  const okPos = door && Math.abs(door.x + 6) < 0.4 && Math.abs(door.z + 18) < 0.8;
  console.log(JSON.stringify(out, null, 2));
  if (!ok || !okPos) {
    console.error("SELF-TEST FAILED");
    process.exit(1);
  }
  console.log("camera-solve self-test passed");
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  const arg = process.argv[2];
  if (!arg || arg === "--help") {
    console.log("usage: node camera-solve.mjs input.json | --self-test");
    process.exit(0);
  }
  if (arg === "--self-test") selfTest();
  else {
    const fs = await import("node:fs");
    console.log(JSON.stringify(solveCamera(JSON.parse(fs.readFileSync(arg, "utf8"))), null, 2));
  }
}
