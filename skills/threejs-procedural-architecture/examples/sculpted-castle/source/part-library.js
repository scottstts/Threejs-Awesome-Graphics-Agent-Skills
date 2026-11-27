// Instanced architectural part library at unit scale (+Y up, origin at foot).
// Each builder returns { stone?, gold?, roof?, glass? } writers for lod 0 (close) or 1 (distant).
import {
  Writer,
  lathe,
  sweep,
  boxF,
  frame,
  fpt,
  quadN,
  wallWithHole,
  archOutline,
  archPath,
  capPoly,
  polyPath,
  sweepHard,
} from "./mesh-kit.js";

const sq = (W, c, half, y0, y1, tint = 0, caps = "tb") => {
  const F = frame([c[0], c[1], c[2]], [1, 0, 0], [0, 1, 0], [0, 0, 1]);
  boxF(W, F, -half, half, y0, y1, -half, half, tint, (caps.includes("t") ? "" : "v1") + (caps.includes("b") ? "" : "v0"));
};

// Columns split into base (0.82 D), variable-height shaft (unit height), and capital (1.07 D)
// so any slenderness preserves true moulding proportions.
export function colBase(lod) {
  const W = new Writer();
  const s = lod ? 8 : 18;
  const c = [0, 0, 0];
  sq(W, c, 0.70, 0, 0.32, 0, "t");
  if (!lod) {
    lathe(
      W,
      c,
      [
        [0.667, 0.32],
        [0.733, 0.38],
        [0.733, 0.476],
        [0.629, 0.533],
        [0.571, 0.571],
        [0.571, 0.629],
        [0.638, 0.676],
        [0.638, 0.743],
        [0.552, 0.80],
        [0.51, 0.82],
      ],
      s,
    );
  } else {
    lathe(W, c, [[0.70, 0.32], [0.70, 0.50], [0.56, 0.78], [0.51, 0.82]], s);
  }
  return { stone: W };
}

export function colShaft(lod) {
  const W = new Writer();
  const s = lod ? 8 : 18;
  const sh = [];
  const m = lod ? 2 : 6;
  for (let k = 0; k <= m; k++) {
    const t = k / m;
    sh.push([0.5 * (1 - 0.17 * Math.pow(t, 1.9)), t]);
  }
  lathe(W, [0, 0, 0], sh, s);
  return { stone: W };
}

export function colCap(lod) {
  const W = new Writer();
  const c = [0, 0, 0];
  if (!lod) {
    lathe(W, c, [[0.415, 0], [0.467, 0.04], [0.467, 0.11], [0.415, 0.15]], 18);
    lathe(
      W,
      c,
      [
        [0.415, 0.15, 0, 0],
        [0.476, 0.27, 0, 0.10],
        [0.552, 0.44, 0, 0.16],
        [0.476, 0.50, 0, 0.05],
        [0.533, 0.61, 0, 0.14],
        [0.648, 0.78, 0, 0.20],
        [0.571, 0.84, 0, 0.05],
        [0.705, 0.80, 0, 0.0],
      ],
      32,
      { lobes: 8 },
    );
  } else {
    lathe(W, c, [[0.415, 0], [0.476, 0.15], [0.571, 0.50], [0.69, 0.80]], 8);
  }
  sq(W, c, 0.76, 0.80, 1.07, 0, "tb");
  return { stone: W };
}

export function baluster(lod) {
  const W = new Writer();
  const c = [0, 0, 0];
  sq(W, c, 0.13, 0, 0.07, 0, "t");
  if (!lod) {
    lathe(
      W,
      c,
      [
        [0.10, 0.07],
        [0.125, 0.10],
        [0.125, 0.13],
        [0.105, 0.15],
        [0.16, 0.24],
        [0.185, 0.34],
        [0.165, 0.44],
        [0.105, 0.56],
        [0.075, 0.66],
        [0.105, 0.71],
        [0.105, 0.74],
        [0.075, 0.78],
        [0.085, 0.85],
        [0.115, 0.895],
      ],
      10,
    );
  } else {
    lathe(W, c, [[0.12, 0.07], [0.185, 0.33], [0.075, 0.68], [0.115, 0.895]], 4);
  }
  sq(W, c, 0.13, 0.895, 1.0, 0, "b");
  return { stone: W };
}

export function urn(lod) {
  const W = new Writer();
  const s = lod ? 6 : 14;
  lathe(
    W,
    [0, 0, 0],
    lod
      ? [[0.22, 0], [0.12, 0.12], [0.30, 0.38], [0.20, 0.62], [0.10, 0.74], [0.0, 1.0]]
      : [
          [0.24, 0],
          [0.24, 0.05],
          [0.13, 0.10],
          [0.11, 0.16],
          [0.15, 0.20],
          [0.27, 0.30],
          [0.31, 0.40],
          [0.29, 0.50],
          [0.19, 0.60],
          [0.21, 0.64],
          [0.12, 0.68],
          [0.09, 0.76],
          [0.13, 0.82],
          [0.10, 0.90],
          [0.0, 1.0],
        ],
    s,
  );
  return { stone: W };
}

export function spike(lod) {
  const W = new Writer();
  const s = lod ? 5 : 10;
  lathe(
    W,
    [0, 0, 0],
    lod
      ? [[0.10, 0], [0.13, 0.12], [0.04, 0.26], [0.0, 1.0]]
      : [
          [0.09, 0],
          [0.11, 0.03],
          [0.06, 0.07],
          [0.12, 0.12],
          [0.13, 0.17],
          [0.10, 0.22],
          [0.035, 0.27],
          [0.055, 0.31],
          [0.028, 0.36],
          [0.02, 0.6],
          [0.0, 1.0],
        ],
    s,
  );
  return { gold: W };
}

export function spire(lod) {
  const W = new Writer();
  const s = lod ? 6 : 12;
  lathe(
    W,
    [0, 0, 0],
    lod
      ? [[0.075, 0], [0.085, 0.07], [0.04, 0.16], [0.07, 0.22], [0.022, 0.32], [0.014, 0.6], [0.0, 1.0]]
      : [
          [0.07, 0],
          [0.085, 0.02],
          [0.09, 0.06],
          [0.07, 0.10],
          [0.04, 0.13],
          [0.05, 0.15],
          [0.035, 0.17],
          [0.06, 0.20],
          [0.075, 0.235],
          [0.06, 0.27],
          [0.028, 0.30],
          [0.036, 0.32],
          [0.022, 0.345],
          [0.030, 0.40],
          [0.018, 0.43],
          [0.016, 0.62],
          [0.022, 0.64],
          [0.012, 0.67],
          [0.008, 0.85],
          [0.0, 1.0],
        ],
    s,
  );
  return { gold: W };
}

export function boss(lod) {
  const W = new Writer();
  const prof = lod
    ? [[1.0, 0], [0.7, 0.22], [0.0, 0.3]]
    : [
        [1.0, 0, 0, 0.12],
        [0.92, 0.10, 0, 0.16],
        [0.62, 0.16, 0, 0.22],
        [0.42, 0.12, 0, 0.1],
        [0.30, 0.20, 0, 0],
        [0.16, 0.30, 0, 0],
        [0.0, 0.33, 0, 0],
      ];
  const T = new Writer();
  lathe(T, [0, 0, 0], prof, lod ? 8 : 24, lod ? {} : { lobes: 8 });
  for (let k = 0; k < T.nv; k++) {
    const x = T.p[k * 3];
    const y = T.p[k * 3 + 1];
    const z = T.p[k * 3 + 2];
    const nx = T.n[k * 3];
    const ny = T.n[k * 3 + 1];
    const nz = T.n[k * 3 + 2];
    W.v(x, -z, y, nx, -nz, ny, 0);
  }
  for (let k = 0; k < T.ni; k += 3) W.tri(T.i[k], T.i[k + 1], T.i[k + 2]);
  return { gold: W };
}

// Two-stage aedicule turret: footprint ±0.5, height 4.6 to spike tip.
export function turret(lod, bare = false) {
  const S = new Writer();
  const R = new Writer();
  const G = new Writer();
  const c = [0, 0, 0];
  sq(S, c, 0.52, 0, 0.12, 0, "t");
  sq(S, c, 0.46, 0.12, 0.34, 0, "t");
  const stage = (half, h0, h1, ra, hsA, core) => {
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      const u = [Math.cos(a), 0, -Math.sin(a)];
      const w = [Math.sin(a), 0, Math.cos(a)];
      const F = frame([w[0] * half - u[0] * half, 0, w[2] * half - u[2] * half], u, [0, 1, 0], w);
      const sg = lod ? 6 : 10;
      wallWithHole(S, F, 0, half * 2, h0, h1, archOutline(half, ra, hsA, h0, sg), 0, 0);
      sweep(S, archPath(F, half, ra, hsA, h0, sg), [[0, 0, 0.2], [0, half - core, 0.9]], {});
      if (!lod) {
        lathe(
          S,
          [F.o[0], 0, F.o[2]],
          [
            [half * 0.17, h0],
            [half * 0.2, h0 + 0.04],
            [half * 0.13, h0 + 0.09],
            [half * 0.12, hsA - 0.06],
            [half * 0.19, hsA],
            [half * 0.19, hsA + 0.05],
          ],
          8,
        );
      }
    }
    sq(S, c, core, h0, h1, 1.0, "");
    const cp = polyPath([[-half, h1, half], [half, h1, half], [half, h1, -half], [-half, h1, -half]], true, 1);
    sweepHard(
      S,
      cp,
      lod
        ? [[0, 0], [0.09, 0.09], [0.12, 0.19], [0, 0.19]]
        : [
            [0, 0],
            [0.03, 0],
            [0.03, 0.04],
            [0.07, 0.07],
            [0.09, 0.09],
            [0.09, 0.13],
            [0.12, 0.15],
            [0.12, 0.19],
            [0, 0.19],
          ],
      { closed: true, outSign: 1 },
    );
    capPoly(S, [[-half, half], [half, half], [half, -half], [-half, -half]], h1 + 0.19, true);
  };
  stage(0.42, 0.34, 1.95, 0.27, 1.50, 0.22);
  stage(0.30, 2.14, 2.92, 0.17, 2.62, 0.16);
  if (bare) return { stone: S };
  lathe(
    R,
    c,
    [[0.36, 3.11], [0.33, 3.16], [0.26, 3.26], [0.19, 3.42], [0.13, 3.62], [0.085, 3.84], [0.05, 4.02]],
    lod ? 6 : 12,
  );
  lathe(S, c, [[0.37, 3.11], [0.40, 3.09], [0.40, 3.13], [0.36, 3.14]], 12, { smooth: false });
  lathe(
    G,
    c,
    lod
      ? [[0.045, 4.0], [0.075, 4.13], [0.02, 4.23], [0.0, 4.6]]
      : [
          [0.045, 4.0],
          [0.07, 4.04],
          [0.04, 4.08],
          [0.075, 4.13],
          [0.06, 4.19],
          [0.02, 4.23],
          [0.012, 4.4],
          [0.0, 4.6],
        ],
    lod ? 4 : 8,
  );
  return { stone: S, roof: R, gold: G };
}

// Octagonal domed kiosk: footprint radius 1, height ~4.1.
export function kiosk(lod) {
  const S = new Writer();
  const R = new Writer();
  const G = new Writer();
  const c = [0, 0, 0];
  const n = 8;
  const Rk = 1.0;
  const sg = lod ? 6 : 10;
  lathe(S, c, [[1.16, 0], [1.16, 0.14], [1.06, 0.14], [1.06, 0.42]], n, { facet: true, phase: Math.PI / 8 });
  const ap = Rk * Math.cos(Math.PI / 8);
  const side = 2 * Rk * Math.sin(Math.PI / 8);
  for (let k = 0; k < n; k++) {
    const a = (k * 2 * Math.PI) / n;
    const w = [Math.sin(a), 0, Math.cos(a)];
    const u = [Math.cos(a), 0, -Math.sin(a)];
    const F = frame([w[0] * ap - (u[0] * side) / 2, 0, w[2] * ap - (u[2] * side) / 2], u, [0, 1, 0], w);
    wallWithHole(S, F, 0, side, 0.42, 2.05, archOutline(side / 2, side * 0.36, 1.5, 0.42, sg), 0, 0);
    sweep(S, archPath(F, side / 2, side * 0.36, 1.5, 0.42, sg), [[0, 0, 0.2], [0, 0.3, 0.95]], {});
    if (!lod) {
      lathe(
        S,
        [F.o[0], 0, F.o[2]],
        [[0.085, 0.42], [0.1, 0.46], [0.065, 0.52], [0.06, 1.44], [0.095, 1.52], [0.095, 1.58]],
        8,
      );
    }
  }
  lathe(S, c, [[ap - 0.3, 0.42], [ap - 0.3, 2.05]], n, { facet: true, phase: Math.PI / 8, tint: 1 });
  lathe(
    S,
    c,
    [
      [1.0, 2.05],
      [1.05, 2.05],
      [1.05, 2.11],
      [1.12, 2.16],
      [1.16, 2.20],
      [1.16, 2.28],
      [1.2, 2.31],
      [1.2, 2.37],
      [0.96, 2.37],
    ],
    n,
    { facet: true, phase: Math.PI / 8 },
  );
  lathe(S, c, [[0.96, 2.37], [0.96, 2.52], [0.99, 2.54], [0.99, 2.58], [0.93, 2.59]], lod ? 12 : 24, {
    smooth: false,
  });
  lathe(
    R,
    c,
    [
      [0.93, 2.59],
      [0.95, 2.72],
      [0.90, 2.92],
      [0.78, 3.12],
      [0.60, 3.29],
      [0.38, 3.41],
      [0.16, 3.47],
      [0.07, 3.48],
    ],
    lod ? 12 : 24,
  );
  if (!lod) {
    for (let k = 0; k < 8; k++) {
      const a = ((k + 0.5) * Math.PI) / 4;
      const tn = [Math.cos(a), 0, -Math.sin(a)];
      const rd = [Math.sin(a), 0, Math.cos(a)];
      const pr = [
        [0.94, 2.60],
        [0.955, 2.72],
        [0.905, 2.92],
        [0.785, 3.12],
        [0.605, 3.29],
        [0.385, 3.41],
        [0.16, 3.475],
      ];
      sweep(
        G,
        pr.map((q) => ({ o: [rd[0] * q[0], q[1], rd[2] * q[0]], a: tn, b: rd })),
        [[0.035, -0.01], [0.02, 0.025], [-0.02, 0.025], [-0.035, -0.01]],
        { smooth: [false, true, true, false] },
      );
    }
  }
  lathe(
    G,
    c,
    lod
      ? [[0.1, 3.46], [0.13, 3.58], [0.03, 3.7], [0, 4.1]]
      : [
          [0.09, 3.46],
          [0.13, 3.50],
          [0.07, 3.55],
          [0.12, 3.60],
          [0.13, 3.65],
          [0.08, 3.70],
          [0.03, 3.74],
          [0.045, 3.78],
          [0.02, 3.82],
          [0.012, 3.95],
          [0, 4.1],
        ],
    lod ? 5 : 8,
  );
  return { stone: S, roof: R, gold: G };
}

export function tabern(lod) {
  const o = turret(lod, true);
  return { stone: o.stone };
}

export function medal(lod) {
  const T = new Writer();
  const TG = new Writer();
  const S = new Writer();
  const G = new Writer();
  const sg = lod ? 16 : 28;
  lathe(
    T,
    [0, 0, 0],
    lod
      ? [[1.0, 0], [0.9, 0.14], [0.76, 0.12], [0.70, -0.08], [0, -0.08]]
      : [
          [1.0, 0],
          [0.97, 0.08],
          [0.9, 0.14],
          [0.82, 0.16],
          [0.76, 0.12],
          [0.72, 0.02],
          [0.70, -0.08],
          [0.0, -0.08],
        ],
    sg,
  );
  lathe(
    TG,
    [0, 0, 0],
    lod
      ? [[0.5, -0.08], [0.42, 0.03], [0.2, 0.13], [0, 0.16]]
      : [
          [0.52, -0.08, 0, 0.14],
          [0.46, 0.02, 0, 0.2],
          [0.3, 0.07, 0, 0.1],
          [0.18, 0.14, 0, 0],
          [0, 0.17, 0, 0],
        ],
    lod ? 10 : 16,
    lod ? {} : { lobes: 8 },
  );
  const turn = (A, B) => {
    for (let k = 0; k < A.nv; k++) {
      B.v(A.p[k * 3], -A.p[k * 3 + 2], A.p[k * 3 + 1], A.n[k * 3], -A.n[k * 3 + 2], A.n[k * 3 + 1], 0.1);
    }
    for (let k = 0; k < A.ni; k += 3) B.tri(A.i[k], A.i[k + 1], A.i[k + 2]);
  };
  turn(T, S);
  turn(TG, G);
  return { stone: S, gold: G };
}

export function pinnacle(lod) {
  const S = new Writer();
  const G = new Writer();
  const c = [0, 0, 0];
  sq(S, c, 0.16, 0, 0.12, 0, "t");
  lathe(S, c, [[0.13, 0.12], [0.15, 0.16], [0.11, 0.20], [0.10, 0.24], [0.045, 0.80], [0.07, 0.83], [0.04, 0.86]], 4, {
    facet: true,
    phase: Math.PI / 4,
  });
  lathe(
    G,
    c,
    lod
      ? [[0.04, 0.86], [0.07, 0.91], [0.0, 1.0]]
      : [[0.035, 0.86], [0.065, 0.885], [0.075, 0.91], [0.06, 0.94], [0.02, 0.955], [0.0, 1.0]],
    lod ? 5 : 10,
  );
  return { stone: S, gold: G };
}

// Cornice bracket: depth 1 along +Z, height 0.4, width 0.5.
export function modillion() {
  const W = new Writer();
  const prof = [[0, 0.12], [0.3, 0.14], [0.62, 0.0], [0.92, 0.02], [1.0, 0.16], [1.0, 0.4], [0, 0.4]];
  sweep(
    W,
    [
      { o: [-0.25, 0, 0], a: [0, 0, 1], b: [0, 1, 0] },
      { o: [0.25, 0, 0], a: [0, 0, 1], b: [0, 1, 0] },
    ],
    prof,
    { closedProfile: true },
  );
  for (const sx of [-0.25, 0.25]) {
    const b = W.nv;
    for (const q of prof) W.v(sx, q[1], q[0], Math.sign(sx), 0, 0, 0);
    for (let k = 1; k < prof.length - 1; k++) {
      if (sx > 0) W.tri(b, b + k + 1, b + k);
      else W.tri(b, b + k, b + k + 1);
    }
  }
  return { stone: W };
}

// Pierced arcaded parapet bay: 0.4 wide, 1.0 high, 0.14 thick.
export function balArc(lod) {
  const W = new Writer();
  const sg = lod ? 4 : 8;
  const ol = archOutline(0.2, 0.135, 0.62, 0.07, sg);
  for (const s of [1, -1]) {
    const F = frame([-0.2 * s, 0, 0.07 * s], [s, 0, 0], [0, 1, 0], [0, 0, s]);
    wallWithHole(W, F, 0, 0.4, 0.07, 1, ol, 0, 0);
    quadN(W, fpt(F, 0, 0), fpt(F, 0.4, 0), fpt(F, 0.4, 0.07), fpt(F, 0, 0.07), F.w, 0);
    sweep(
      W,
      archPath(F, 0.2, 0.135, 0.62, 0.07, sg),
      lod ? [[0, 0, 0.1], [0, 0.07, 0.3]] : [[-0.02, 0, 0], [0, -0.012, 0], [0, 0.07, 0.3]],
      {},
    );
  }
  quadN(
    W,
    [-0.135, 0.07, -0.07],
    [0.135, 0.07, -0.07],
    [0.135, 0.07, 0.07],
    [-0.135, 0.07, 0.07],
    [0, 1, 0],
    0.2,
  );
  return { stone: W };
}

export const PARTS = {
  balArc,
  modillion,
  kiosk,
  tabern,
  medal,
  colBase,
  colShaft,
  colCap,
  baluster,
  urn,
  spike,
  spire,
  boss,
  turret,
  pinnacle,
};
