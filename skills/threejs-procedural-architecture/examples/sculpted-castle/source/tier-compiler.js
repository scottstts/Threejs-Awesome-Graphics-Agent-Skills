// Tier, façade, recessed portal, dome, and monumental gate compiler.
// Emits merged material-slot writers plus instanced columns, parapets, brackets, turrets, and finials.
import {
  Writer,
  frame,
  fpt,
  sweep,
  sweepHard,
  lathe,
  polyPath,
  capPoly,
  quadN,
  boxF,
  archPath,
  archOutline,
  archApex,
  wallWithHole,
  fillOutline,
  ringOutlines,
  norm,
  add,
  mul,
  triN,
  triPolyHole,
  planarCarve,
} from "./mesh-kit.js";

export class Chunk {
  constructor(id) {
    this.id = id;
    this.W = {
      stone: new Writer(),
      gold: new Writer(),
      roof: new Writer(),
      glass: new Writer(),
      floor: new Writer(),
    };
    this.inst = {};
    this.diag = [];
  }

  put(part, x, y, z, sx, sy = sx, sz = sx, rot = 0) {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    (this.inst[part] || (this.inst[part] = [])).push(
      c * sx, 0, -s * sx, 0,
      0, sy, 0, 0,
      s * sz, 0, c * sz, 0,
      x, y, z, 1,
    );
  }

  /** Full column assembled from base, shaft, and capital at foot p, total height h, lower diameter D. */
  col(p, h, D) {
    const hb = 0.82 * D;
    const hc = 1.07 * D;
    const hs = Math.max(0.01, h - hb - hc);
    this.put("colBase", p[0], p[1], p[2], D);
    this.put("colShaft", p[0], p[1] + hb, p[2], D, hs, D);
    this.put("colCap", p[0], p[1] + hb + hs, p[2], D);
  }
}

const ENT = [
  [0, 0], [0.06, 0], [0.06, 0.12], [0.09, 0.12], [0.09, 0.27], [0.13, 0.29],
  [0.13, 0.33], [0.05, 0.33], [0.05, 0.58], [0.10, 0.60], [0.10, 0.66],
  [0.18, 0.70], [0.42, 0.72], [0.42, 0.84], [0.46, 0.86], [0.52, 0.94],
  [0.52, 1.0], [0, 1.0],
];
const IMPOST = [
  [0, 0], [0.25, 0], [0.25, 0.30], [0.55, 0.42], [0.55, 0.58], [1, 0.78], [1, 1], [0, 1],
];
const PLINTH = [
  [0, 0], [1, 0], [1, 0.55], [0.6, 0.72], [0.6, 0.86], [0.2, 1.0], [0, 1.0],
];
const scaleP = (P, sa, sb, t) => P.map((p) => [p[0] * sa, p[1] * sb, t]);

function polyInfo(poly) {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    area += a[0] * b[1] - b[0] * a[1];
  }
  if (area > 0) throw new Error("tier polygon must be ordered front -> right -> back -> left");
  const faces = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const u = [(b[0] - a[0]) / L, 0, (b[1] - a[1]) / L];
    const w = [-u[2], 0, u[0]];
    faces.push({ a, b, L, u, w });
  }
  return faces;
}

export function insetPoly(poly, d) {
  const f = polyInfo(poly);
  const n = poly.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const n0 = f[(i - 1 + n) % n].w;
    const n1 = f[i].w;
    const k = 1 + n0[0] * n1[0] + n0[2] * n1[2];
    out.push([poly[i][0] - ((n0[0] + n1[0]) * d) / k, poly[i][1] - ((n0[2] + n1[2]) * d) / k]);
  }
  return out;
}

export const sinkOf = (R0) => Math.min(0.4, Math.max(0.04, 0.06 * R0));

/** Relief coordinates following an arch curve: one band per stepped order (face and soffit). */
export function archCarve(F, c, hs, r, dr, dz) {
  const Lp = Math.max(0.4, 2.2 * dr);
  return (x, y, z) => {
    const px = x - F.o[0];
    const py = y - F.o[1];
    const pz = z - F.o[2];
    const du = px * F.u[0] + py * F.u[1] + pz * F.u[2] - c;
    const dv = px * F.v[0] + py * F.v[1] + pz * F.v[2] - hs;
    const dep = -(px * F.w[0] + py * F.w[1] + pz * F.w[2]);
    let rad;
    let cu;
    if (dv > 0) {
      rad = Math.hypot(du, dv);
      cu = (Math.atan2(dv, du) * r) / Lp;
    } else {
      rad = Math.abs(du);
      cu = du > 0 ? dv / Lp : (Math.PI * r - dv) / Lp;
    }
    return [cu, (r - rad) / dr + dep / dz, 2];
  };
}

/** Carved wall field cut back into tiers of moulded, arch-headed sunk panels separated by string courses. */
export function reliefWall(C, F, u0, u1, v0, v1, o = {}) {
  const S = C.W.stone;
  const w = u1 - u0;
  const h = v1 - v0;
  if (w < 0.02 || h < 0.02) return;
  if (o.plain) {
    quadN(S, fpt(F, u0, v0), fpt(F, u1, v0), fpt(F, u1, v1), fpt(F, u0, v1), F.w, 0);
    return;
  }
  const tgt = Math.max(0.9, Math.min(2.8, o.cell ?? Math.sqrt(w * h) / 2.7));
  const cols = Math.max(1, Math.round(w / tgt));
  const cw = w / cols;
  S.carve = planarCarve(F, Math.min(1.0, Math.max(0.3, cw * 0.5)), 1);
  if (w < 0.3 || h < 0.35) {
    quadN(S, fpt(F, u0, v0), fpt(F, u1, v0), fpt(F, u1, v1), fpt(F, u0, v1), F.w, 0);
    S.carve = null;
    return;
  }
  const rows = Math.max(1, Math.round(h / (cw * (o.aspect ?? 2.2))));
  const rh = h / rows;
  const m = Math.min(cw * 0.11, 0.16);
  const dep0 = Math.min(0.5, cw * 0.2);
  const segs = cw > 1.8 ? 8 : 6;
  const bead = Math.min(0.07, cw * 0.05);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const a = u0 + i * cw;
      const b = a + cw;
      const y0 = v0 + j * rh;
      const y1 = y0 + rh;
      const r0 = (cw - 2 * m) / 2;
      const c = (a + b) / 2;
      const sill = y0 + Math.min(rh * 0.1, 0.25);
      const av = y1 - m - sill;
      const pt = av > r0 * 1.6 ? 0.55 : 0;
      const r = Math.min(r0, av / 1.08);
      const hsN = y1 - m - archApex(r, 0, pt);
      const dep = o.corners && (i === 0 || i === cols - 1) ? Math.min(dep0, m * 0.9) : dep0;
      wallWithHole(S, F, a, b, sill, y1, archOutline(c, r, hsN, sill, segs, pt), 0, 0);
      quadN(S, fpt(F, a, y0), fpt(F, b, y0), fpt(F, b, sill), fpt(F, a, sill), F.w, 0);
      sweep(
        S,
        archPath(F, c, r, hsN, sill, segs, { pointed: pt }),
        [[-bead, 0, 0], [0, -bead, 0], [0, dep * 0.5, 0.25], [bead * 1.4, dep * 0.5, 0.25], [bead * 1.4, dep, 0.45]],
        {},
      );
      fillOutline(S, F, archOutline(c, r - bead * 1.4, hsN, sill, segs, pt), -dep, 0.45);
      quadN(S, fpt(F, c - r, sill, 0), fpt(F, c + r, sill, 0), fpt(F, c + r, sill, -dep), fpt(F, c - r, sill, -dep), F.v, 0.1);
    }
  }
  S.carve = null;
  const sc = Math.min(0.14, cw * 0.09);
  for (let j = 1; j < rows; j++) {
    const y = v0 + j * rh;
    sweep(
      S,
      [
        { o: fpt(F, u0, y - sc, 0), a: F.w, b: F.v },
        { o: fpt(F, u1, y - sc, 0), a: F.w, b: F.v },
      ],
      [[0, 0], [sc * 0.8, sc * 0.3], [sc * 0.8, sc * 1.2], [0, sc * 2]],
      {},
    );
  }
}

function ringSweep(W, F, cu, cv, profile, n, tint = 0, lobes = 0) {
  const path = [];
  const o = fpt(F, cu, cv, 0);
  for (let k = 0; k < n; k++) {
    const th = (k * 2 * Math.PI) / n;
    const cs = Math.cos(th);
    const sn = Math.sin(th);
    const d = [F.u[0] * cs + F.v[0] * sn, F.u[1] * cs + F.v[1] * sn, F.u[2] * cs + F.v[2] * sn];
    const s = lobes ? 1 + 0.17 * Math.cos(lobes * th) : 1;
    path.push({ o, a: mul(d, s), b: F.w, na: d });
  }
  sweep(W, path, profile.map((p) => [p[0], p[1], p[2] ?? tint]), { closed: true, smooth: true });
}

/** Eight-petalled rose carved into a recessed roundel inside a sunk spandrel panel. */
function rose(C, F, cu, cv, rho, n, sink) {
  const S = C.W.stone;
  const dep = rho * 0.4;
  ringSweep(
    S,
    F,
    cu,
    cv,
    [[rho * 1.3, 0], [rho * 1.27, sink], [rho * 1.14, sink + rho * 0.05], [rho * 1.05, sink * 0.6], [rho, sink * 0.6], [rho, -dep, 0.5]],
    n,
  );
  ringSweep(S, F, cu, cv, [[rho, -dep, 0.7], [0, -dep, 0.7]], n);
  ringSweep(
    S,
    F,
    cu,
    cv,
    [
      [rho * 0.8, -dep, 0.6],
      [rho * 0.66, -dep * 0.25, 0.15],
      [rho * 0.46, -dep * 0.8, 0.6],
      [rho * 0.3, -dep * 0.15, 0.15],
      [rho * 0.13, -dep * 0.6, 0.5],
      [0, -dep * 0.2, 0.15],
    ],
    32,
    0,
    8,
  );
}

/** Sunk spandrel panels around an arch opening with inscribed carved roses. */
export function spandrelWall(C, F0, u0, u1, v0, v1, c, R0, hs, segs, pointed, ext) {
  const S = C.W.stone;
  const sink = sinkOf(R0);
  const F = frame(fpt(F0, 0, 0, -sink), F0.u, F0.v, F0.w);
  const ol = archOutline(c, R0, hs, v0, segs, pointed);
  const m = ol.length;
  let ia = 0;
  for (let k = 0; k < m; k++) if (ol[k][1] > ol[ia][1]) ia = k;
  const Rc = R0 + ext;
  const e = Math.max(0.04, 0.035 * R0);
  const neg = (a) => [-a[0], -a[1], -a[2]];

  quadN(S, fpt(F, u0, v0, 0), fpt(F, u0, v0, sink), fpt(F, u0, v1, sink), fpt(F, u0, v1, 0), F.u, 0.1);
  quadN(S, fpt(F, u1, v0, 0), fpt(F, u1, v0, sink), fpt(F, u1, v1, sink), fpt(F, u1, v1, 0), neg(F.u), 0.1);
  quadN(S, fpt(F, u0, v1, 0), fpt(F, u0, v1, sink), fpt(F, u1, v1, sink), fpt(F, u1, v1, 0), neg(F.v), 0.1);
  if (c - R0 - u0 > 1e-3) {
    quadN(S, fpt(F, u0, v0, 0), fpt(F, u0, v0, sink), fpt(F, c - R0, v0, sink), fpt(F, c - R0, v0, 0), F.v, 0.1);
  }
  if (u1 - c - R0 > 1e-3) {
    quadN(S, fpt(F, c + R0, v0, 0), fpt(F, c + R0, v0, sink), fpt(F, u1, v0, sink), fpt(F, u1, v0, 0), F.v, 0.1);
  }

  S.carve = planarCarve(F, Math.min(1.1, Math.max(0.3, R0 * 0.3)), 1);
  for (const sg of [-1, 1]) {
    const dx = sg < 0 ? c - u0 : u1 - c;
    const top = v1 - hs;
    let lo = 0;
    let hi = Math.min(dx, top) / 2;
    for (let it = 0; it < 24; it++) {
      const r = (lo + hi) / 2;
      if (Math.hypot(dx - e - r, top - e - r) >= Rc + e + r) lo = r;
      else hi = r;
    }
    const rho = lo / 1.32;
    const cu = c + sg * (dx - e - lo);
    const cv = v1 - e - lo;
    const poly =
      sg < 0
        ? [[u0, v0], ...ol.slice(0, ia + 1), [c, v1], [u0, v1]]
        : [[u1, v0], [u1, v1], [c, v1], ...ol.slice(ia)];
    const pp = poly.filter((q, i) => i === 0 || Math.hypot(q[0] - poly[i - 1][0], q[1] - poly[i - 1][1]) > 1e-6);
    if (pointed || rho < 0.13 || dx - e - lo < 0 || !(v1 - ol[ia][1] > 1e-3)) {
      const piv = sg < 0 ? pp.length - 1 : 1;
      const A = fpt(F, pp[piv][0], pp[piv][1], 0);
      for (let k = 0; k < pp.length; k++) {
        const k1 = (k + 1) % pp.length;
        if (k === piv || k1 === piv) continue;
        triN(S, A, fpt(F, pp[k][0], pp[k][1], 0), fpt(F, pp[k1][0], pp[k1][1], 0), F.w, 0);
      }
      continue;
    }
    const nh = rho > 0.6 ? 16 : 12;
    const hole = [];
    for (let k = 0; k < nh; k++) {
      const th = (k * 2 * Math.PI) / nh;
      hole.push([cu + rho * Math.cos(th), cv + rho * Math.sin(th)]);
    }
    for (const [a, b, d] of triPolyHole(pp, hole)) {
      triN(S, fpt(F, a[0], a[1], 0), fpt(F, b[0], b[1], 0), fpt(F, d[0], d[1], 0), F.w, 0);
    }
    S.carve = null;
    rose(C, F, cu, cv, rho, nh, sink);
    S.carve = planarCarve(F, Math.min(1.1, Math.max(0.3, R0 * 0.3)), 1);
  }
  S.carve = null;
}

/** Resolve one face's bay rhythm into absolute metre intervals. */
export function layoutFace(L, Hw, spec) {
  const n = spec.bays ? spec.bays.length : spec.n;
  const pf = spec.pier ?? 0.14;
  let cm = spec.corner ?? null;
  let bays;
  let piers;
  if (spec.bays) {
    const sum = spec.bays.reduce((a, b) => a + b, 0);
    const free = Math.max(0, L - sum);
    if (spec.piers && Array.isArray(spec.piers)) {
      piers = spec.piers.slice();
      cm = cm ?? (free - piers.reduce((a, b) => a + b, 0)) / 2;
    } else {
      const p = spec.pierW ?? (n > 1 ? free / (n + 0.2) : 0);
      piers = Array(Math.max(0, n - 1)).fill(p);
      cm = cm ?? (free - p * (n - 1)) / 2;
    }
    bays = spec.bays.slice();
  } else {
    const b = L / (n + n * pf);
    const p = b * pf;
    cm = cm ?? p / 2;
    const bw = (L - 2 * cm - (n - 1) * p) / n;
    bays = Array(n).fill(bw);
    piers = Array(Math.max(0, n - 1)).fill(p);
  }
  const out = [];
  let u = Math.max(0, cm);
  for (let k = 0; k < n; k++) {
    out.push({ u0: u, u1: u + bays[k], c: u + bays[k] / 2, b: bays[k] });
    u += bays[k] + (piers[k] || 0);
  }
  return { bays: out, p: piers[0] || 0, piers, cm: Math.max(0, cm) };
}

/** Deep arched portal bay with stepped beaded orders, nook colonnettes, ribbed vault, and concentric/pointed back. */
export function emitPortal(C, F, bay, Hw, spec, T) {
  const S = C.W.stone;
  const b = bay.b;
  const c = bay.c;
  const sill = spec.sill ?? T.pl;
  const vB = spec.vBase ?? 0;
  const vT = spec.vTop ?? Hw;
  const r = spec.rAbs ?? (b * (spec.open ?? 0.9)) / 2;
  const pointed = spec.pointed ?? 0;
  const rise = archApex(r, 0, pointed);
  const apex = Math.min(
    vT - Math.max(0.12, 0.012 * (vT - vB)),
    spec.apexV ?? (spec.apex !== undefined ? spec.apex - T.y0 : 1e9),
  );
  let imp = spec.impV ?? (spec.imp !== undefined ? spec.imp - T.y0 : sill + (apex - sill) * (spec.impK ?? 0.62));
  imp = Math.max(sill + 0.2 * r, Math.min(imp, apex - rise));
  const hs = spec.hsAbs ?? (apex - rise);
  if (spec.hsAbs !== undefined) imp = Math.max(sill + 0.2 * r, Math.min(spec.impV ?? hs, hs));
  const rho = Math.min(0.3, Math.max(0.03, 0.04 * r));
  const lim =
    spec.maxD === undefined
      ? undefined
      : Math.max(0.05, spec.maxD * (!spec.inner && !spec.through && r > 2.2 && spec.maxD > 1.2 * r ? 0.6 : 1));
  const dz0 = (spec.dz ?? 0.24) * r;
  const k = Math.max(
    1,
    Math.min(spec.orders ?? (r > 4 ? 4 : r > 2 ? 3 : r > 0.8 ? 2 : 1), lim === undefined ? 9 : Math.floor((0.7 * lim) / dz0)),
  );
  const dr = (spec.dr ?? (k >= 4 ? 0.135 : k === 3 ? 0.14 : 0.16)) * r;
  const dz = Math.min(dz0, lim === undefined ? 1e9 : (0.8 * lim) / k);
  let deep = (spec.deep ?? 1.5) * r;
  if (lim !== undefined) deep = Math.max(0.02 * r, Math.min(deep, lim - k * dz));
  const D = k * dz + deep;
  const rin = r - k * dr;
  const segs = r > 4 ? 24 : r > 1.5 ? 14 : r > 0.6 ? 8 : 6;
  const nb = r > 2.5 ? 4 : r > 1 ? 3 : 2;
  const nc = r > 2.5 ? 6 : 5;
  const tb = spec.tintBase ?? (spec.free ? 0.42 : 0);
  const tintAt = (bb) => tb + (1 - tb) * Math.min(1, Math.pow(Math.max(0, bb) / D, 0.55));
  const wb = Math.min(0.11 * r, Math.max(0.02, (b / 2 - r - rho) * 0.92));
  const hp = Math.max(0.03, 0.055 * r);

  if (!spec.noWall) {
    spandrelWall(C, F, bay.u0, bay.u1, sill, vT, c, r + rho, hs, segs, pointed, wb);
    if (sill > vB) reliefWall(C, F, bay.u0, bay.u1, vB, sill, { aspect: 1.4 });
  }

  const prof = [];
  const smooth = [];
  for (let j = 0; j < k; j++) {
    const a = j * dr;
    const bb = j * dz;
    for (let q = 0; q <= nb; q++) {
      const ph = Math.PI + (1.5 * Math.PI * q) / nb;
      prof.push([a + rho * Math.cos(ph), bb + rho * Math.sin(ph), tintAt(bb)]);
      smooth.push(q > 0 && q < nb);
    }
    prof.push([a, bb + dz, tintAt(bb + dz)]);
    smooth.push(false);
    if (j === k - 1) {
      prof.push([a + dr, bb + dz, tintAt(bb + dz)]);
      smooth.push(false);
    }
  }
  prof.push([k * dr, D, 1]);
  smooth.push(false);

  const path = archPath(F, c, r, hs, sill, segs, { pointed });
  S.carve = archCarve(F, c, hs, r, dr, dz);
  sweep(S, path, prof, { smooth });
  S.carve = null;

  const cr = Math.min(dr, dz) * 0.44;
  const hcol = imp - sill;
  const rollPath = path.map((f, i) =>
    i === 0 || i === path.length - 1 ? { ...f, o: add(f.o, mul(F.v, imp - sill)) } : f,
  );
  const circ = [];
  for (let q = 0; q < nc; q++) {
    const ph = (q * 2 * Math.PI) / nc;
    circ.push([Math.cos(ph) * cr * 0.8, Math.sin(ph) * cr * 0.8]);
  }
  for (let j = 0; j < k; j++) {
    const a = j * dr + cr;
    const bb = (j + 1) * dz - cr;
    const t = tintAt(bb);
    sweep(S, rollPath, circ.map((p) => [a + p[0], bb + p[1], t]), { closedProfile: true, smooth: true });
    const Dc = Math.min(cr * 2.0, hcol / 7);
    if (hcol > 0.5) {
      for (const sgn of [-1, 1]) C.col(fpt(F, c + sgn * (r - a), sill, -bb), hcol, Dc);
    }
  }

  if (!spec.noWall && wb > 0.03) {
    sweep(
      S,
      rollPath,
      [
        [-rho - wb, sinkOf(r + rho)],
        [-rho - wb, -hp * 0.7],
        [-rho - wb * 0.75, -hp],
        [-rho - wb * 0.3, -hp],
        [-rho, -hp * 0.35],
        [-rho, 0],
      ],
      {},
    );
    if (!pointed && r > 0.5) {
      const kw = Math.max(0.05, 0.075 * r);
      const va = hs + rise;
      boxF(S, F, c - kw, c + kw, va - 0.02, va + rho + wb, 0, hp * 1.9, 0, "w0");
      boxF(S, F, c - kw * 1.25, c + kw * 1.25, va + rho + wb, va + rho + wb + kw * 0.35, 0, hp * 2.3, 0, "w0");
    }
  }

  const d0 = k * dz;
  if (r > 1.8 && deep > 0.8 * r) {
    const nrib = Math.max(2, Math.min(spec.ribs ?? 7, Math.round(deep / ((spec.free ? 0.36 : 0.42) * r))));
    const rr = Math.max(0.06, 0.045 * rin);
    const rc = [[0, -rr], [rr * 0.9, -rr * 0.55], [rr * 0.9, rr * 0.55], [0, rr]];
    for (let q = 1; q <= nrib; q++) {
      const dd = d0 + (deep * q) / (nrib + 0.6);
      const Fd = frame(fpt(F, 0, 0, -dd), F.u, F.v, F.w);
      sweep(
        S,
        archPath(Fd, c, rin, hs, sill, segs, { pointed }).map((f, i, A) =>
          i === 0 || i === A.length - 1 ? { ...f, o: add(f.o, mul(F.v, imp - sill)) } : f,
        ),
        rc.map((p) => [p[0], p[1], tintAt(dd)]),
        { smooth: [false, true, true, false] },
      );
      const Dv = Math.min(rin * 0.13, (imp - sill) / 8) * (spec.free ? 1.8 : 1);
      for (const sg of [-1, 1]) C.col(fpt(F, c + sg * (rin - Dv * 0.55), sill, -dd), imp - sill, Dv);
    }
  }

  {
    const nf = D > 4 * r ? 5 : 1;
    for (let q = 0; q < nf; q++) {
      const z0 = (-D * q) / nf;
      const z1 = (-D * (q + 1)) / nf;
      quadN(
        S,
        fpt(F, c - r - rho, sill, z0),
        fpt(F, c + r + rho, sill, z0),
        fpt(F, c + r + rho, sill, z1),
        fpt(F, c - r - rho, sill, z1),
        F.v,
        nf > 1 ? tintAt(-z1) : 0.2,
      );
    }
  }

  S.carve = planarCarve(frame(fpt(F, 0, 0, -D), F.u, F.v, F.w), Math.min(1.0, Math.max(0.3, rin * 0.35)), 1);
  const olIn = archOutline(c, rin, hs, sill, segs, pointed);
  const rw = rin * (spec.win ?? 0.30);
  const hw = sill + (hs - sill) * 0.66;
  if (spec.through) {
    // Open bay: closed by caller.
  } else if (!spec.inner && rin > 1.5 && (spec.maxD === undefined || spec.maxD - D > 0.9 * rin)) {
    const r2 = rin * 0.6;
    const rho2 = Math.min(0.3, Math.max(0.03, 0.04 * r2));
    const hs2 = hs - rin * 0.12;
    ringOutlines(S, F, olIn, archOutline(c, r2 + rho2, hs2, sill, segs, pointed), -D, tintAt(D));
    const Fd = frame(fpt(F, 0, 0, -D), F.u, F.v, F.w);
    emitPortal(
      C,
      Fd,
      { u0: c - rin, u1: c + rin, c, b: 2 * rin },
      Hw,
      {
        rAbs: r2,
        hsAbs: hs2,
        impV: imp,
        sill,
        noWall: true,
        inner: true,
        orders: 3,
        deep: 0.8,
        tintBase: 0.55,
        pointed,
        maxD: spec.maxD === undefined ? undefined : spec.maxD - D - 0.6,
      },
      T,
    );
  } else if (rw > 0.12 && hw > sill + 0.3) {
    const olW = archOutline(c, rw, hw, sill, segs, 0.5);
    ringOutlines(S, F, olIn, olW, -D, 1);
    const Fw = frame(fpt(F, 0, 0, -D), F.u, F.v, F.w);
    const rev = Math.min(0.5, rw * 0.5);
    sweep(
      S,
      archPath(Fw, c, rw, hw, sill, segs, { pointed: 0.5 }),
      [[-rw * 0.16, 0, 1], [-rw * 0.16, -rw * 0.12, 0.9], [0, -rw * 0.12, 0.9], [0, rev, 0.7]],
      {},
    );
    quadN(S, fpt(Fw, c - rw, sill, 0), fpt(Fw, c + rw, sill, 0), fpt(Fw, c + rw, sill, -rev), fpt(Fw, c - rw, sill, -rev), F.v, 0.5);
    fillOutline(C.W.glass, F, olW, -D - rev, 0);
  } else {
    fillOutline(S, F, olIn, -D, 1);
  }
  S.carve = null;
  return { hs, imp, r, D, rin, sill };
}

/** Projecting pier-buttress with carved body, clustered pedestal columns, stepped impost, and upper colonnettes. */
export function emitPier(C, F0, uc, width, impAbs, HwAbs, T, o = {}) {
  const vb = o.vBase ?? 0;
  const e = o.e ?? 0;
  const ua = o.ua ?? uc - width / 2;
  const ub = o.ub ?? uc + width / 2;
  const S = C.W.stone;
  const F = vb || e ? frame(fpt(F0, 0, vb, e), F0.u, F0.v, F0.w) : F0;
  const hs = impAbs - vb;
  const Hw = (o.vTop ?? HwAbs) - vb;
  if (o.body && e > 0) {
    for (const [uu, sg, on] of [[ua, -1, o.sideA !== false], [ub, 1, o.sideB !== false]]) {
      if (!on) continue;
      const Fs = frame(fpt(F, uu, 0, -e), F.w, F.v, [F.u[0] * sg, F.u[1] * sg, F.u[2] * sg]);
      S.carve = planarCarve(Fs, Math.min(0.6, Math.max(0.25, e)), 1);
      quadN(S, fpt(Fs, 0, 0), fpt(Fs, e, 0), fpt(Fs, e, Hw), fpt(Fs, 0, Hw), Fs.w, 0.15);
      S.carve = null;
    }
  }
  const ped = Math.min(Math.max(T.pl * 1.6, 0.2 * hs), 3.2);
  const hcol = hs - ped;
  if (hcol < 0.6 || width < 0.16) {
    if (o.body) reliefWall(C, F, ua, ub, 0, Hw, { cell: Math.max(0.75, ub - ua) });
    return;
  }
  let D = hcol / (o.slender ?? 10.5);
  const nc = width >= 2.7 * D ? 2 : 1;
  if (width < 1.5 * D) D = width / 1.5;
  const fit = (d) => (nc === 2 ? Math.min(width / 2 - 0.72 * d, 0.95 * d) : 0) + 1.08 * d;
  for (let it = 0; it < 3; it++) {
    const f = fit(D);
    if (f > width / 2) D *= width / 2 / f;
  }
  const sp = nc === 2 ? Math.max(0, Math.min(width / 2 - 0.72 * D, 0.95 * D)) : 0;
  const half = sp + 0.76 * D;
  const ei = 1.15 * D;
  const ep = 1.36 * D;
  boxF(S, F, uc - half, uc + half, 0, ped - 0.12 * D, 0, ep, 0, "w0v0");
  boxF(S, F, uc - half - 0.07 * D, uc + half + 0.07 * D, ped - 0.12 * D, ped, 0, ep + 0.07 * D, 0, "w0");
  boxF(S, F, uc - half - 0.07 * D, uc + half + 0.07 * D, 0, 0.14 * D, 0, ep + 0.07 * D, 0, "w0v0");
  for (let k = 0; k < nc; k++) {
    const du = nc === 2 ? (k ? sp : -sp) : 0;
    C.col(fpt(F, uc + du, ped, 0.62 * D), hcol, D);
  }
  if (nc === 2 && sp > 0.8 * D) C.col(fpt(F, uc, ped, 1.0 * D), hcol, D * 0.86);
  const hi = 0.55 * D;
  const q = 0.3 * D;
  const pts = [
    fpt(F, uc - half, hs, 0),
    fpt(F, uc - half, hs, ei),
    fpt(F, uc + half, hs, ei),
    fpt(F, uc + half, hs, 0),
  ];
  sweepHard(S, polyPath(pts, false, -1), scaleP(IMPOST, q, hi, 0), { outSign: -1, band: hi });
  quadN(S, pts[0], pts[1], pts[2], pts[3], [0, -1, 0], 0);
  quadN(
    S,
    fpt(F, uc - half, hs + hi, 0),
    fpt(F, uc - half, hs + hi, ei),
    fpt(F, uc + half, hs + hi, ei),
    fpt(F, uc + half, hs + hi, 0),
    [0, 1, 0],
    0,
  );
  if (!o.body) return;
  const room = Hw - (hs + hi);
  reliefWall(C, F, ua, ub, 0, hs, { cell: ub - ua, aspect: 4 });
  S.carve = planarCarve(frame(fpt(F, 0, hs, 0), F.u, F.v, F.w), hi, 2);
  quadN(S, fpt(F, ua, hs), fpt(F, ub, hs), fpt(F, ub, hs + hi), fpt(F, ua, hs + hi), F.w, 0);
  S.carve = null;
  if (room > 0.02) reliefWall(C, F, ua, ub, hs + hi, Hw, { cell: ub - ua, aspect: 2.6 });
  if (room > 1.5 && !o.noUpper) {
    const D2 = Math.min(D * 0.62, room / 9, width * 0.16);
    const du = Math.min(half - 0.55 * D2, width / 2 - 0.55 * D2);
    if (du > 0.6 * D2) {
      for (const sg of [-1, 1]) C.col(fpt(F, uc + sg * du, hs + hi, 0.58 * D2), room, D2);
    } else {
      C.col(fpt(F, uc, hs + hi, 0.58 * D2), room, D2);
    }
  }
}

function emitBalustrade(C, T, poly, y, o = {}) {
  const S = C.W.stone;
  const s = o.scale ?? 1;
  const inset = 0.28 * s + (o.inset ?? 0);
  const P = insetPoly(poly, inset);
  const faces = polyInfo(P);
  const n = P.length;
  const ph = 1.22 * s;
  const pw = 0.2 * s + 0.08;
  const railH = 1.0 * s;
  const post = (x, z, rot, kind, big = 1) => {
    const Fp = frame([x, y, z], [Math.cos(rot), 0, -Math.sin(rot)], [0, 1, 0], [Math.sin(rot), 0, Math.cos(rot)]);
    const w = pw * big;
    boxF(S, Fp, -w, w, 0, ph, -w, w, 0, "v0v1");
    boxF(S, Fp, -w * 1.18, w * 1.18, ph, ph + 0.12 * s, -w * 1.18, w * 1.18, 0, "");
    const ty = y + ph + 0.12 * s;
    if (kind === "turret") {
      const st = (o.turretScale ?? 0.9) * s * big;
      C.put("turret", x, ty, z, st, st, st, rot);
    } else if (kind === "kiosk") {
      const st = (o.kioskScale ?? 1.5) * s * big;
      C.put("kiosk", x, y + 0.02, z, st, st, st, rot);
    } else if (kind === "spike") {
      const hh = 1.5 * s * big;
      C.put("spike", x, ty, z, hh);
    } else if (kind === "pinnacle") {
      const hh = 2.6 * s * big;
      C.put("pinnacle", x, ty, z, hh, hh, hh, rot + Math.PI / 4);
    } else {
      const hh = 0.62 * s * big;
      C.put("urn", x, ty, z, hh);
    }
  };
  for (let i = 0; i < n; i++) {
    const f = faces[i];
    const rot = Math.atan2(f.w[0], f.w[2]);
    if (T.noBal && T.noBal.includes(i)) continue;
    const st = [0];
    const lay = T._lay && T._lay[i];
    if (lay) {
      const sc = f.L / T._L[i];
      for (let k = 0; k < lay.bays.length - 1; k++) st.push((lay.bays[k].u1 + lay.piers[k] / 2) * sc);
    } else {
      const m = Math.max(1, Math.round(f.L / (3.2 * s)));
      for (let k = 1; k < m; k++) st.push((f.L * k) / m);
    }
    st.push(f.L);
    const ck = o.cornerKind ?? "turret";
    const mk = o.midKind ?? "urn";
    const every = o.turretEvery ?? 0;
    post(f.a[0], f.a[1], rot, ck, 1.25);
    for (let k = 1; k < st.length - 1; k++) {
      const x = f.a[0] + f.u[0] * st[k];
      const z = f.a[1] + f.u[2] * st[k];
      const hsh = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
      post(
        x,
        z,
        rot,
        every && k % every === 0 ? (hsh < 0.55 ? "kiosk" : "turret") : k % 2 ? mk : o.altKind ?? "spike",
        0.82 + hsh * 0.4,
      );
    }
    const F = frame([f.a[0], y, f.a[1]], f.u, [0, 1, 0], f.w);
    for (let k = 0; k < st.length - 1; k++) {
      const u0 = st[k] + pw * (k === 0 ? 1.25 : 1) * 0.9;
      const u1 = st[k + 1] - pw * (k === st.length - 2 ? 1.25 : 1) * 0.9;
      if (u1 - u0 < 0.2 * s) continue;
      boxF(S, F, u0, u1, 0, 0.14 * s, -0.17 * s, 0.17 * s, 0, "u0u1v0");
      boxF(S, F, u0, u1, railH, railH + 0.15 * s, -0.19 * s, 0.19 * s, 0, "u0u1");
      const hb = railH - 0.14 * s;
      const m = Math.max(1, Math.round((u1 - u0) / (0.34 * s)));
      for (let q = 0; q < m; q++) {
        const p = fpt(F, u0 + ((u1 - u0) * (q + 0.5)) / m, 0.14 * s, 0);
        C.put("balArc", p[0], p[1], p[2], (u1 - u0) / m / 0.4, hb, hb, rot);
      }
    }
  }
}

/** Monumental recessed gate façade: multi-order stepped portal, gilded arch band, ribbed barrel tunnel, two-storey flanks. */
export function gateFace(C, F, L, Hw, T, spec) {
  const S = C.W.stone;
  const c = L / 2;
  const k = spec.k ?? 6;
  const rin = spec.halfOpen ?? 6.35;
  const Ro = spec.Ro ?? 14.4;
  const dr = (Ro - rin) / k;
  const dz = spec.dz ?? 1.15;
  const hs = spec.hs ?? (Hw - 1.0 - Ro);
  const D = spec.depth;
  const segs = 40;
  const rho = 0.3;
  const half = spec.half ?? L / 2;
  const Rb = Ro + rho + 1.6;
  const topB = Math.min(Hw, hs + Rb);

  spandrelWall(C, F, c - Rb, c + Rb, 0, topB, c, Ro + rho, hs, segs, 0, 0.9);
  reliefWall(C, F, c - half, c - Rb, 0, Hw, { cell: half - Rb });
  reliefWall(C, F, c + Rb, c + half, 0, Hw, { cell: half - Rb });
  if (Hw - topB > 0.05) reliefWall(C, F, c - Rb, c + Rb, topB, Hw, { aspect: 1.3 });

  sweep(
    S,
    archPath(F, c, Ro, hs, 0, segs).slice(1, -1),
    [[-rho - 0.9, 0.4], [-rho - 0.9, -0.5], [-rho - 0.65, -0.7], [-rho - 0.25, -0.7], [-rho, -0.25], [-rho, 0]],
    {},
  );

  const tintAt = (b) => Math.min(1, Math.pow(Math.max(0, b) / 14, 0.6));
  const prof = [];
  const smooth = [];
  for (let j = 0; j < k; j++) {
    const a = j * dr;
    const bb = j * dz;
    for (let q = 0; q <= 6; q++) {
      const ph = Math.PI + (1.5 * Math.PI * q) / 6;
      prof.push([a + rho * Math.cos(ph), bb + rho * Math.sin(ph), tintAt(bb)]);
      smooth.push(q > 0 && q < 6);
    }
    prof.push([a, bb + dz, tintAt(bb + dz)]);
    smooth.push(false);
    if (j === k - 1) {
      prof.push([a + dr, bb + dz, tintAt(bb + dz)]);
      smooth.push(false);
    }
  }
  prof.push([k * dr, D, 0.85]);
  smooth.push(false);

  const path = archPath(F, c, Ro, hs, 0, segs);
  S.carve = archCarve(F, c, hs, Ro, dr, dz);
  sweep(S, path, prof, { smooth });
  S.carve = null;

  {
    const a0 = dr * 1.0 + rho * 1.2;
    const a1 = dr * 2.0 - rho * 1.6;
    const bb = 2 * dz - 0.02;
    sweep(
      C.W.gold,
      path.slice(1, -1),
      [[a0, bb], [a0 + 0.06, bb - 0.09], [(a0 + a1) / 2, bb - 0.16], [a1 - 0.06, bb - 0.09], [a1, bb]],
      { smooth: true },
    );
  }

  const cr = Math.min(dr, dz) * 0.36;
  const arcOnly = path.slice(1, path.length - 1);
  const circ = [];
  for (let q = 0; q < 10; q++) {
    const ph = (q * Math.PI) / 5;
    circ.push([Math.cos(ph) * cr, Math.sin(ph) * cr]);
  }
  for (let j = 0; j < k; j++) {
    const a = j * dr + cr;
    const bb = (j + 1) * dz - cr;
    const t = tintAt(bb);
    sweep(S, arcOnly, circ.map((p) => [a + p[0], bb + p[1], t]), { closedProfile: true, smooth: true });
    for (const sg of [-1, 1]) C.col(fpt(F, c + sg * (Ro - a), 0, -bb), hs, cr * 2.1);
  }

  const d0 = k * dz;
  for (let d = d0 + 4; d < D - 2; d += 5.2) {
    const Fd = frame(fpt(F, 0, 0, -d), F.u, F.v, F.w);
    const pr = archPath(Fd, c, rin, hs, 0, segs).slice(1, -1);
    const rr = 0.34;
    const cc = [];
    for (let q = 0; q < 8; q++) {
      const ph = (q * Math.PI) / 4;
      cc.push([Math.cos(ph) * rr * 0.7 + rr * 0.3, Math.sin(ph) * rr, 0.85]);
    }
    sweep(S, pr, cc, { closedProfile: true, smooth: true });
    for (const sg of [-1, 1]) C.col(fpt(F, c + sg * (rin - 0.42), 0, -d), hs, 0.95);
  }

  quadN(
    C.W.floor,
    fpt(F, c - Ro - rho, 0, 0),
    fpt(F, c + Ro + rho, 0, 0),
    fpt(F, c + Ro + rho, 0, -D),
    fpt(F, c - Ro - rho, 0, -D),
    F.v,
    0,
  );

  if (spec.flanks !== false) {
    const split = Hw * 0.68;
    const nb0 = spec.flankBays ?? 3;
    for (const [u0, u1] of [[0, c - half], [c + half, L]]) {
      for (let lv = 0; lv < 2; lv++) {
        const nb = lv ? nb0 * 3 : nb0;
        const pf = lv ? 0.35 : 0.22;
        const bw = (u1 - u0) / (nb + (nb + 1) * pf);
        const pw = bw * pf;
        const vb = lv ? split : 0;
        const vt = lv ? Hw : split;
        const sp = { vBase: vb, vTop: vt, sill: vb + (lv ? 1.2 : T.pl), apexV: vt - 1.6, open: 0.86 };
        let info = null;
        for (let q = 0; q <= nb; q++) {
          const a = u0 + q * (bw + pw);
          reliefWall(C, F, a, a + pw, vb, vt, { cell: Math.max(0.75, pw) });
        }
        for (let q = 0; q < nb; q++) {
          const a = u0 + pw + q * (bw + pw);
          info = emitPortal(
            C,
            F,
            { u0: a, u1: a + bw, c: a + bw / 2, b: bw },
            Hw,
            { ...sp, maxD: Math.max(0.2, Math.min(9, a + 0.07 * bw - 0.3, L - a - bw * 0.93 - 0.3)) },
            T,
          );
        }
        for (let q = 0; q <= nb; q++) {
          emitPier(C, F, u0 + q * (bw + pw) + pw / 2, pw * 0.92, info.imp, Hw, T, { vBase: vb, vTop: vt });
        }
      }
      sweep(
        S,
        [
          { o: fpt(F, u0, split - 0.5, 0), a: F.w, b: F.v },
          { o: fpt(F, u1, split - 0.5, 0), a: F.w, b: F.v },
        ],
        [[0, 0], [0.35, 0.12], [0.35, 0.3], [0.55, 0.42], [0.55, 0.62], [0, 0.62]],
        {},
      );
    }
  }

  boxF(S, F, c - 0.9, c + 0.9, hs + Ro, hs + Ro + rho + 1.5, 0, 1.3, 0, "w0");
  boxF(S, F, c - 1.15, c + 1.15, hs + Ro + rho + 1.5, hs + Ro + rho + 1.95, 0, 1.55, 0, "w0");
  return { hs, Ro, rin };
}

/** Compile one complete architectural storey from its footprint polygon and face bay specs. */
export function emitTier(C, T) {
  const S = C.W.stone;
  const poly = T.poly;
  const faces = polyInfo(poly);
  const n = poly.length;
  const H = T.y1 - T.y0;
  T.he = T.he ?? Math.min(1.25, Math.max(0.28, H * (T.entK ?? 0.055)));
  T.pl = T.pl ?? Math.min(0.9, Math.max(0.12, H * 0.035));
  const Hw = H - T.he;
  T._lay = [];
  T._L = [];
  const dressed = (i) => {
    const s = T.faces[i];
    return !!(T._lay[i] && s.piers !== false);
  };
  for (let i = 0; i < n; i++) {
    T._L[i] = faces[i].L;
    const s = T.faces[i];
    if (s && !s.blank && !s.custom) T._lay[i] = layoutFace(faces[i].L, Hw, s, T);
  }

  let minP = 1e9;
  for (let i = 0; i < n; i++) {
    if (dressed(i)) {
      const l = T._lay[i];
      for (const pw of l.piers) if (pw > 0.3) minP = Math.min(minP, pw);
      if (l.cm > 0.3) minP = Math.min(minP, l.cm * 2);
    }
  }
  let e = minP < 1e8 ? Math.min(1.2, 0.028 * Hw + 0.1, 0.45 * minP) : 0;
  if (e < 0.6 * T.he * (T.entP ?? 1)) e = 0;
  const corner = faces.map((f, i) => {
    const j = (i - 1 + n) % n;
    return e > 0 && dressed(i) && dressed(j) && T._lay[i].cm > 0.3 && T._lay[j].cm > 0.3;
  });
  const ext = (i) => {
    const w0 = faces[(i - 1 + n) % n].w;
    const w1 = faces[i].w;
    const c = w0[0] * w1[0] + w0[2] * w1[2];
    return e * Math.sqrt(Math.max(0, (1 - c) / (1 + c)));
  };

  for (let i = 0; i < n; i++) {
    const f = faces[i];
    const spec = T.faces[i];
    const F = frame([f.a[0], T.y0, f.a[1]], f.u, [0, 1, 0], f.w);
    const lay = T._lay[i];
    if (!spec || spec.blank) {
      reliefWall(C, F, 0, f.L, 0, Hw, { plain: spec && spec.plain, corners: true, cell: Math.min(2.6, Math.max(1.2, Hw / 4)) });
      continue;
    }
    if (spec.custom) {
      spec.custom(C, F, f.L, Hw, T, spec);
      continue;
    }
    const at = spec.attic ?? T.attic ?? (Hw > 8 && !spec.vBase ? 0.14 : 0);
    const split = Hw * (1 - at);
    const sill = spec.sill ?? T.pl;
    const rmax = (Math.max(...lay.bays.map((b) => b.b)) * (spec.open ?? 0.9)) / 2;
    const apexV = Math.min(
      split - Math.max(0.12, 0.21 * rmax + 0.05),
      spec.apexV ?? (spec.apex !== undefined ? spec.apex - T.y0 : 1e9),
    );
    const impV =
      spec.impV ?? (spec.imp !== undefined ? spec.imp - T.y0 : Math.max(sill + 0.25 * rmax, apexV - rmax * (spec.stilt ?? 1.0)));
    const mainSpec = { ...spec, vTop: split, apexV, impV };
    const cotH = (k) => {
      const w0 = faces[(k - 1 + n) % n].w;
      const w1 = faces[k].w;
      const c = w0[0] * w1[0] + w0[2] * w1[2];
      return Math.sqrt((1 + c) / Math.max(1e-6, 1 - c));
    };
    const tS = cotH(i);
    const tE = cotH((i + 1) % n);
    let info = null;
    for (const bay of lay.bays) {
      const rb = ((bay.b * (spec.open ?? 0.9)) / 2) * 1.06;
      const wedge = Math.max(0.15, Math.min((bay.c - rb) * tS, (f.L - bay.c - rb) * tE) - 0.3);
      let md = Math.min(spec.maxD ?? 1e9, spec.free ? 1e9 : wedge);
      if (spec.guard && (bay.c < spec.guard[0] || f.L - bay.c < spec.guard[1])) md = Math.min(md, 0.4);
      info = emitPortal(C, F, bay, Hw, { ...mainSpec, maxD: md }, T);
      if (at) {
        const ah = Hw - split;
        const m = Math.max(1, Math.round(bay.b / (ah * 0.72)));
        const sb = bay.b / m;
        const g = sb * 0.2;
        const asp = {
          vBase: split,
          vTop: Hw,
          sill: split + ah * 0.2,
          apexV: Hw - ah * 0.16,
          open: 0.9,
          orders: sb > 1.6 ? 2 : 1,
          deep: 0.5,
          win: 0.5,
        };
        for (let j = 0; j <= m; j++) {
          const a = Math.max(bay.u0, bay.u0 + j * sb - g / 2);
          const b = Math.min(bay.u1, bay.u0 + j * sb + g / 2);
          reliefWall(C, F, a, b, split, Hw, { cell: 0.9 });
        }
        for (let j = 0; j < m; j++) {
          const a = bay.u0 + j * sb + g / 2;
          emitPortal(C, F, { u0: a, u1: a + sb - g, c: a + (sb - g) / 2, b: sb - g }, Hw, asp, T);
        }
      }
    }
    if (at) T._split = split;
    const dress = spec.piers !== false;
    const po = { ...spec, body: true };
    for (let k = 0; k < lay.bays.length - 1; k++) {
      const ua = lay.bays[k].u1;
      const pw = lay.piers[k];
      const ub = ua + pw;
      if (pw < 1e-4) continue;
      if (dress) emitPier(C, F, ua + pw / 2, pw * 0.94, info.imp, Hw, T, { ...po, e: pw > 0.3 ? e : 0, ua, ub });
      else reliefWall(C, F, ua, ub, 0, Hw, { cell: Math.max(0.75, pw) });
    }
    if (lay.cm > 1e-4) {
      const j = (i + 1) % n;
      const cs = corner[i];
      const ce = corner[j];
      if (dress && lay.cm > 0.3) {
        emitPier(C, F, lay.cm / 2, lay.cm * 0.9, info.imp, Hw, T, {
          ...po,
          e: cs ? e : 0,
          ua: cs ? -ext(i) : 0,
          ub: lay.cm,
          sideA: false,
        });
        emitPier(C, F, f.L - lay.cm / 2, lay.cm * 0.9, info.imp, Hw, T, {
          ...po,
          e: ce ? e : 0,
          ua: f.L - lay.cm,
          ub: ce ? f.L + ext(j) : f.L,
          sideB: false,
        });
      } else {
        reliefWall(C, F, 0, lay.cm, 0, Hw, { cell: Math.max(0.75, lay.cm) });
        reliefWall(C, F, f.L - lay.cm, f.L, 0, Hw, { cell: Math.max(0.75, lay.cm) });
      }
    }
  }

  const ring = (y) => poly.map((p) => [p[0], y, p[1]]);
  const mitre = (i, y) => {
    const f = faces[i];
    const w0 = faces[(i - 1 + n) % n].w;
    const k = 1 + w0[0] * f.w[0] + w0[2] * f.w[2];
    return [f.a[0] + ((w0[0] + f.w[0]) * e) / k, y, f.a[1] + ((w0[2] + f.w[2]) * e) / k];
  };
  const jogs = (y, fn, from = 0, count = n) => {
    const pts = [];
    for (let q = 0; q < count; q++) {
      const i = (from + q) % n;
      const f = faces[i];
      const lay = T._lay[i];
      const P = (u, d) => [f.a[0] + f.u[0] * u + f.w[0] * d, y, f.a[1] + f.u[2] * u + f.w[2] * d];
      if (corner[i]) {
        pts.push(mitre(i, y), P(lay.cm, e), P(lay.cm, 0));
        if (fn) fn(P(0, 0), mitre(i, y), P(lay.cm, e), P(lay.cm, 0));
      } else {
        pts.push(P(0, 0));
      }
      if (dressed(i) && e > 0) {
        for (let k = 0; k < lay.bays.length - 1; k++) {
          const ua = lay.bays[k].u1;
          const pw = lay.piers[k];
          if (pw > 0.3) {
            pts.push(P(ua, 0), P(ua, e), P(ua + pw, e), P(ua + pw, 0));
            if (fn) fn(P(ua, 0), P(ua, e), P(ua + pw, e), P(ua + pw, 0));
          }
        }
      }
      if (corner[(i + 1) % n]) {
        pts.push(P(f.L - lay.cm, 0), P(f.L - lay.cm, e));
        if (fn) fn(P(f.L - lay.cm, 0), P(f.L - lay.cm, e), mitre((i + 1) % n, y), P(f.L, 0));
      }
    }
    if (count < n) {
      const j = (from + count) % n;
      pts.push(corner[j] ? mitre(j, y) : [faces[j].a[0], y, faces[j].a[1]]);
    }
    return pts;
  };

  sweepHard(S, polyPath(ring(T.y0), true, -1), scaleP(PLINTH, T.pl * 0.22, T.pl, 0), { closed: true, outSign: -1 });
  sweepHard(
    S,
    polyPath(
      jogs(T.y1 - T.he, (a, b, c, d) =>
        quadN(S, [a[0], T.y1, a[2]], [b[0], T.y1, b[2]], [c[0], T.y1, c[2]], [d[0], T.y1, d[2]], [0, 1, 0], 0),
      ),
      true,
      -1,
    ),
    scaleP(ENT, T.he * (T.entP ?? 1), T.he, 0),
    { closed: true, outSign: -1, band: T.he },
  );

  if (T._split) {
    const hc = Math.min(0.5, Math.max(0.16, Hw * 0.022));
    const prof = [[0, 0], [hc * 0.5, 0], [hc * 0.5, hc * 0.35], [hc * 0.9, hc * 0.55], [hc * 0.9, hc], [0, hc]];
    const y = T.y0 + T._split - hc;
    const has = (i) => !!T._lay[i];
    if (faces.every((f, i) => has(i))) {
      sweepHard(S, polyPath(jogs(y), true, -1), prof, { closed: true, outSign: -1, band: hc });
    } else {
      for (let i = 0; i < n; i++) {
        if (has(i) && !has((i - 1 + n) % n)) {
          let c = 1;
          while (has((i + c) % n)) c++;
          sweepHard(S, polyPath(jogs(y, null, i, c), false, -1), prof, { outSign: -1, band: hc });
        }
      }
    }
  }

  if (T.he > 0.5) {
    for (const f of faces) {
      const sm = 0.30 * T.he;
      const m = Math.max(2, Math.round(f.L / (0.5 * T.he)));
      const rot = Math.atan2(f.w[0], f.w[2]);
      for (let q = 0; q < m; q++) {
        const uu = (f.L * (q + 0.5)) / m;
        C.put(
          "modillion",
          f.a[0] + f.u[0] * uu + f.w[0] * 0.10 * T.he,
          T.y1 - T.he + 0.72 * T.he - 0.4 * sm,
          f.a[1] + f.u[2] * uu + f.w[2] * 0.10 * T.he,
          sm,
          sm,
          sm,
          rot,
        );
      }
    }
  }
  if (T.cap !== false) capPoly(S, poly, T.y1, true, 0.12);
  if (T.bal !== false) emitBalustrade(C, T, poly, T.y1, T.bal || {});
}

/** Ribbed fish-scale dome with ring cornice, gilded springing band, finials, optional columned lantern, and spire. */
export function emitDome(C, d) {
  const S = C.W.stone;
  const R = C.W.roof;
  const G = C.W.gold;
  const c = [d.x, d.y, d.z];
  const Rd = d.R;
  const H = d.top - d.y;
  const segs = Rd > 6 ? 64 : Rd > 2.5 ? 40 : 24;

  lathe(
    S,
    [d.x, d.y, d.z],
    [
      [Rd * 1.00, -0.10 * Rd],
      [Rd * 1.07, -0.10 * Rd],
      [Rd * 1.07, -0.05 * Rd],
      [Rd * 1.11, -0.03 * Rd],
      [Rd * 1.11, 0.0],
      [Rd * 1.02, 0.02 * Rd],
      [Rd * 1.02, 0.045 * Rd],
      [Rd * 0.99, 0.05 * Rd],
    ],
    segs,
    { smooth: false },
  );

  const st = H * 0.14;
  const rl = d.lantern ? Rd * 0.17 : Rd * 0.035;
  const m = 14;
  const prof = [[Rd * 0.985, 0.045 * Rd]];
  const tEnd = Math.acos(rl / (Rd * 0.985));
  const shell = (t) => [Rd * 0.985 * Math.cos(t), st + ((H - st) * Math.sin(t)) / Math.sin(tEnd)];
  for (let k = 0; k <= m; k++) prof.push(shell((tEnd * k) / m));

  const nr = d.ribs ?? (Rd > 6 ? 16 : Rd > 2.5 ? 12 : 8);
  const rwid = Rd * 0.011 + 0.02;
  const rh = Rd * 0.010 + 0.012;

  {
    const per = Rd > 6 ? 5 : Rd > 2.5 ? 4 : 3;
    const nsc = nr * per;
    const rows = Rd > 6 ? 22 : Rd > 2.5 ? 15 : 9;
    const sT = Math.sin(tEnd);
    R.carve = (x, y, z) => {
      const th = Math.atan2(x - d.x, z - d.z);
      const tt = Math.asin(Math.max(-1, Math.min(1, ((y - d.y - st) / (H - st)) * sT)));
      return [(th / (2 * Math.PI) + 0.5) * nsc, (Math.max(0, tt) / tEnd) * rows, 3];
    };
    lathe(R, c, prof, Math.max(segs, nsc * 2));
    R.carve = null;
  }

  for (let q = 0; q < nr; q++) {
    const th = ((q + 0.5) * 2 * Math.PI) / nr;
    const rad = [Math.sin(th), 0, Math.cos(th)];
    const tan = [Math.cos(th), 0, -Math.sin(th)];
    const path = [];
    for (let k = 0; k <= m; k++) {
      const t = (tEnd * k) / m;
      const p = shell(t);
      const dp = [-Rd * 0.985 * Math.sin(t), ((H - st) * Math.cos(t)) / Math.sin(tEnd)];
      const l = Math.hypot(dp[0], dp[1]);
      const nrm = norm([(rad[0] * dp[1]) / l, -dp[0] / l, (rad[2] * dp[1]) / l]);
      path.push({ o: [d.x + rad[0] * p[0], d.y + p[1], d.z + rad[2] * p[0]], a: tan, b: nrm });
    }
    path.unshift({ o: [d.x + rad[0] * Rd * 0.985, d.y + 0.045 * Rd, d.z + rad[2] * Rd * 0.985], a: tan, b: rad });
    sweep(S, path, [[rwid, -0.01], [rwid * 0.55, rh], [-rwid * 0.55, rh], [-rwid, -0.01]], {
      smooth: [false, true, true, false],
    });
    const hf = Rd * 0.17 + 0.1;
    C.put("spike", d.x + rad[0] * Rd * 1.06, d.y, d.z + rad[2] * Rd * 1.06, hf);
  }

  lathe(
    G,
    c,
    [[Rd * 0.99, 0.046 * Rd], [Rd * 1.012, 0.05 * Rd], [Rd * 1.012, 0.10 * Rd], [Rd * 0.992, 0.115 * Rd]],
    segs,
    { smooth: false },
  );

  const topY = d.y + st + (H - st);
  if (d.lantern) {
    const lh = d.lantern - d.top;
    const lr = rl * 1.05;
    const base = [d.x, d.top, d.z];
    lathe(G, base, [[rl * 1.5, -0.04 * Rd], [rl * 1.5, 0.0], [rl * 1.25, 0.02 * Rd]], 24, { smooth: false });
    lathe(S, base, [[lr * 0.72, 0.0], [lr * 0.72, lh * 0.62]], 12, { tint: 0.8 });
    for (let q = 0; q < 8; q++) {
      const th = (q * Math.PI) / 4;
      C.col([d.x + Math.sin(th) * lr, d.top + 0.02 * Rd, d.z + Math.cos(th) * lr], lh * 0.6, lh * 0.075);
    }
    lathe(S, base, [[lr * 1.12, lh * 0.60], [lr * 1.25, lh * 0.62], [lr * 1.25, lh * 0.67], [lr * 1.05, lh * 0.69]], 24, {
      smooth: false,
    });
    lathe(
      R,
      base,
      [[lr * 1.05, lh * 0.69], [lr * 1.02, lh * 0.78], [lr * 0.8, lh * 0.9], [lr * 0.45, lh * 0.98], [lr * 0.16, lh * 1.0]],
      24,
    );
    const hsp = d.tip - d.lantern + lh * 0.02;
    C.put("spire", d.x, d.lantern - lh * 0.02, d.z, hsp);
  } else {
    lathe(G, [d.x, topY, d.z], [[rl * 2.6, -0.035 * Rd], [rl * 2.9, -0.01 * Rd], [rl * 1.6, 0.02 * Rd]], 16);
    const hsp = d.tip - topY;
    C.put("spire", d.x, topY, d.z, hsp);
  }
}
