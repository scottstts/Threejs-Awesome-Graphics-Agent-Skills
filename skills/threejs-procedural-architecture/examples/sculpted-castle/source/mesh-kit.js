// Growable architectural mesh writer, profile sweeps, lathes, arch paths, and ear clipping.
// Pure JavaScript with no Three.js dependency: writers emit typed arrays directly.

export class Writer {
  constructor(cap = 4096) {
    this.p = new Float32Array(cap * 3);
    this.n = new Float32Array(cap * 3);
    this.t = new Float32Array(cap);
    this.i = new Uint32Array(cap * 3);
    this.nv = 0;
    this.ni = 0;
    this.c = new Float32Array(cap * 3);
    this.carve = null; // (x, y, z) => [u, v, kind] relief coordinates emitted while set
  }

  _gv(k) {
    if (this.nv + k <= this.t.length) return;
    let c = this.t.length;
    while (c < this.nv + k) c *= 2;
    const p = new Float32Array(c * 3);
    p.set(this.p.subarray(0, this.nv * 3));
    this.p = p;
    const n = new Float32Array(c * 3);
    n.set(this.n.subarray(0, this.nv * 3));
    this.n = n;
    const t = new Float32Array(c);
    t.set(this.t.subarray(0, this.nv));
    this.t = t;
    const cc = new Float32Array(c * 3);
    cc.set(this.c.subarray(0, this.nv * 3));
    this.c = cc;
  }

  _gi(k) {
    if (this.ni + k <= this.i.length) return;
    let c = this.i.length;
    while (c < this.ni + k) c *= 2;
    const i = new Uint32Array(c);
    i.set(this.i.subarray(0, this.ni));
    this.i = i;
  }

  v(x, y, z, nx, ny, nz, t = 0) {
    this._gv(1);
    const o = this.nv * 3;
    this.p[o] = x;
    this.p[o + 1] = y;
    this.p[o + 2] = z;
    this.n[o] = nx;
    this.n[o + 1] = ny;
    this.n[o + 2] = nz;
    this.t[this.nv] = t;
    if (this.carve) {
      const q = this.carve(x, y, z);
      this.c[o] = q[0];
      this.c[o + 1] = q[1];
      this.c[o + 2] = q[2];
    }
    return this.nv++;
  }

  tri(a, b, c) {
    this._gi(3);
    this.i[this.ni++] = a;
    this.i[this.ni++] = b;
    this.i[this.ni++] = c;
  }

  quad(a, b, c, d) {
    this.tri(a, b, c);
    this.tri(a, c, d);
  }

  get tris() {
    return this.ni / 3;
  }

  arrays() {
    return {
      position: this.p.slice(0, this.nv * 3),
      normal: this.n.slice(0, this.nv * 3),
      tint: this.t.slice(0, this.nv),
      carve: this.c.slice(0, this.nv * 3),
      index: this.i.slice(0, this.ni),
    };
  }
}

export const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const len = (a) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a) => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const mad = (o, u, a, v, b, w, c) => [
  o[0] + u[0] * a + v[0] * b + (w ? w[0] * c : 0),
  o[1] + u[1] * a + v[1] * b + (w ? w[1] * c : 0),
  o[2] + u[2] * a + v[2] * b + (w ? w[2] * c : 0),
];

// Wall frame: o origin, u along the wall (right from outside), v up, w outward.
export const frame = (o, u, v, w) => ({ o, u, v, w });
export const fpt = (F, a, b, c = 0) => mad(F.o, F.u, a, F.v, b, F.w, c);

/**
 * Sweep a 2D profile along section frames { o, a, b, na?, nb? }.
 * Profile entries are [pa, pb, tint?]; a segment outward normal is (db, -da).
 */
export function sweep(
  W,
  path,
  profile,
  { closed = false, smooth = false, tint = 0, flip = false, closedProfile = false } = {},
) {
  const P = profile;
  const np = P.length;
  const ns = closedProfile ? np : np - 1;
  const nf = path.length;
  if (nf < 2 || ns < 1) return;

  const sn = [];
  for (let s = 0; s < ns; s++) {
    const p0 = P[s];
    const p1 = P[(s + 1) % np];
    const da = p1[0] - p0[0];
    const db = p1[1] - p0[1];
    const l = Math.hypot(da, db) || 1;
    sn.push([db / l, -da / l]);
  }

  const vn = (k, s) => {
    const sm = smooth === true || (smooth && smooth[k]);
    if (!sm) return sn[s];
    let prev = k - 1;
    let cur = k;
    if (closedProfile) {
      prev = (k - 1 + np) % np;
      cur = k % np;
    }
    if (prev < 0 || cur >= ns) return sn[s];
    const a = sn[prev];
    const b = sn[cur];
    const x = a[0] + b[0];
    const y = a[1] + b[1];
    const l = Math.hypot(x, y) || 1;
    return [x / l, y / l];
  };

  const base = W.nv;
  for (let j = 0; j < nf; j++) {
    const f = path[j];
    const na = f.na || norm(f.a);
    const nb = f.nb || norm(f.b);
    for (let s = 0; s < ns; s++) {
      for (let e = 0; e < 2; e++) {
        const k = (s + e) % np;
        const pk = P[k];
        const n2 = vn(s + e, s);
        const x = f.o[0] + f.a[0] * pk[0] + f.b[0] * pk[1];
        const y = f.o[1] + f.a[1] * pk[0] + f.b[1] * pk[1];
        const z = f.o[2] + f.a[2] * pk[0] + f.b[2] * pk[1];
        const nx = na[0] * n2[0] + nb[0] * n2[1];
        const ny = na[1] * n2[0] + nb[1] * n2[1];
        const nz = na[2] * n2[0] + nb[2] * n2[1];
        const l = Math.hypot(nx, ny, nz) || 1;
        W.v(x, y, z, nx / l, ny / l, nz / l, pk[2] !== undefined ? pk[2] : tint);
      }
    }
  }

  let fl = flip;
  if (!flip) {
    outer: for (let j = 0; j < nf - 1; j++) {
      for (let s = 0; s < ns; s++) {
        const a = base + (j * ns + s) * 2;
        const b = a + 1;
        const c = base + ((j + 1) * ns + s) * 2;
        const pa = [W.p[a * 3], W.p[a * 3 + 1], W.p[a * 3 + 2]];
        const pb = [W.p[b * 3], W.p[b * 3 + 1], W.p[b * 3 + 2]];
        const pc = [W.p[c * 3], W.p[c * 3 + 1], W.p[c * 3 + 2]];
        const g = cross(sub(pb, pa), sub(pc, pa));
        if (len(g) < 1e-9) continue;
        fl = dot(g, [W.n[a * 3], W.n[a * 3 + 1], W.n[a * 3 + 2]]) < 0;
        break outer;
      }
    }
  }

  const lim = closed ? nf : nf - 1;
  for (let j = 0; j < lim; j++) {
    const j1 = (j + 1) % nf;
    for (let s = 0; s < ns; s++) {
      const a = base + (j * ns + s) * 2;
      const b = a + 1;
      const c = base + (j1 * ns + s) * 2;
      const d = c + 1;
      if (fl) {
        W.tri(a, c, b);
        W.tri(b, c, d);
      } else {
        W.tri(a, b, c);
        W.tri(b, d, c);
      }
    }
  }
}

/** Lathe about a vertical axis through c. Profile entries are [r, y, tint?, mod?]. */
export function lathe(
  W,
  c,
  profile,
  segs,
  { smooth = true, tint = 0, a0 = 0, a1 = Math.PI * 2, lobes = 0, phase = 0, sx = 1, sz = 1, facet = false } = {},
) {
  const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const path = [];
  const n = full ? segs : segs + 1;
  for (let k = 0; k < n; k++) {
    const th = a0 + ((a1 - a0) * k) / segs + phase;
    path.push({
      o: c,
      a: [Math.sin(th) * sx, 0, Math.cos(th) * sz],
      b: [0, 1, 0],
      na: norm([Math.sin(th) / sx, 0, Math.cos(th) / sz]),
    });
  }
  if (facet) return sweepHard(W, path, profile, { closed: full, smooth: false, tint, outSign: -1 });
  if (!lobes) return sweep(W, path, profile, { closed: full, smooth, tint });

  const base = profile;
  const np = base.length;
  const sn = [];
  for (let s = 0; s < np - 1; s++) {
    const p0 = base[s];
    const p1 = base[s + 1];
    const da = p1[0] - p0[0];
    const db = p1[1] - p0[1];
    const l = Math.hypot(da, db) || 1;
    sn.push([db / l, -da / l]);
  }
  const start = W.nv;
  for (let k = 0; k < n; k++) {
    const th = a0 + ((a1 - a0) * k) / segs + phase;
    const m = Math.cos(lobes * th);
    for (let s = 0; s < np; s++) {
      const pk = base[s];
      const r = pk[0] * (1 + (pk[3] || 0) * m);
      let n2;
      if (s === 0) n2 = sn[0];
      else if (s === np - 1) n2 = sn[np - 2];
      else {
        const x = sn[s - 1][0] + sn[s][0];
        const y = sn[s - 1][1] + sn[s][1];
        const l = Math.hypot(x, y) || 1;
        n2 = [x / l, y / l];
      }
      W.v(
        c[0] + Math.sin(th) * r,
        c[1] + pk[1],
        c[2] + Math.cos(th) * r,
        Math.sin(th) * n2[0],
        n2[1],
        Math.cos(th) * n2[0],
        pk[2] !== undefined ? pk[2] : tint,
      );
    }
  }
  const lim = full ? n : n - 1;
  for (let k = 0; k < lim; k++) {
    const k1 = (k + 1) % n;
    for (let s = 0; s < np - 1; s++) {
      const a = start + k * np + s;
      const b = a + 1;
      const c2 = start + k1 * np + s;
      const d = c2 + 1;
      W.tri(a, c2, b);
      W.tri(b, c2, d);
    }
  }
}

export const arc2 = (cx, cy, r, t0, t1, n) => {
  const p = [];
  for (let k = 0; k <= n; k++) {
    const t = t0 + ((t1 - t0) * k) / n;
    p.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return p;
};

/** Ear clipping for a simple 2D polygon [[x, z]...]; returns index triples. */
export function earclip(poly) {
  const n = poly.length;
  if (n < 3) return [];
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const idx = [];
  for (let i = 0; i < n; i++) idx.push(i);
  if (area < 0) idx.reverse();
  const out = [];
  const cr = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let guard = 0;
  while (idx.length > 3 && guard++ < 20000) {
    let cut = false;
    for (let i = 0; i < idx.length; i++) {
      const i0 = idx[(i + idx.length - 1) % idx.length];
      const i1 = idx[i];
      const i2 = idx[(i + 1) % idx.length];
      const a = poly[i0];
      const b = poly[i1];
      const c = poly[i2];
      if (cr(a, b, c) <= 1e-12) continue;
      let ok = true;
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue;
        const p = poly[j];
        if (
          (p[0] === a[0] && p[1] === a[1]) ||
          (p[0] === b[0] && p[1] === b[1]) ||
          (p[0] === c[0] && p[1] === c[1])
        ) {
          continue;
        }
        if (cr(a, b, p) >= -1e-12 && cr(b, c, p) >= -1e-12 && cr(c, a, p) >= -1e-12) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      out.push(i0, i1, i2);
      idx.splice(i, 1);
      cut = true;
      break;
    }
    if (!cut) idx.splice(0, 1);
  }
  if (idx.length === 3) out.push(idx[0], idx[1], idx[2]);
  return out;
}

/** Flat polygon cap at height y; poly is [[x, z]...]; up=true faces +Y. */
export function capPoly(W, poly, y, up = true, tint = 0) {
  const tr = earclip(poly);
  const b = W.nv;
  for (const p of poly) W.v(p[0], y, p[1], 0, up ? 1 : -1, 0, tint);
  for (let k = 0; k < tr.length; k += 3) {
    const a = poly[tr[k]];
    const bb = poly[tr[k + 1]];
    const c = poly[tr[k + 2]];
    const ny = (bb[1] - a[1]) * (c[0] - a[0]) - (bb[0] - a[0]) * (c[1] - a[1]);
    if ((ny > 0) === up) W.tri(b + tr[k], b + tr[k + 1], b + tr[k + 2]);
    else W.tri(b + tr[k], b + tr[k + 2], b + tr[k + 1]);
  }
}

export function quadN(W, a, b, c, d, n, tint = 0) {
  const g = cross(sub(b, a), sub(c, a));
  const fl = dot(g, n) < 0;
  const i0 = W.v(a[0], a[1], a[2], n[0], n[1], n[2], tint);
  const i1 = W.v(b[0], b[1], b[2], n[0], n[1], n[2], tint);
  const i2 = W.v(c[0], c[1], c[2], n[0], n[1], n[2], tint);
  const i3 = W.v(d[0], d[1], d[2], n[0], n[1], n[2], tint);
  if (fl) {
    W.tri(i0, i2, i1);
    W.tri(i0, i3, i2);
  } else {
    W.tri(i0, i1, i2);
    W.tri(i0, i2, i3);
  }
}

export function triN(W, a, b, c, n, tint = 0) {
  const g = cross(sub(b, a), sub(c, a));
  const fl = dot(g, n) < 0;
  const i0 = W.v(a[0], a[1], a[2], n[0], n[1], n[2], tint);
  const i1 = W.v(b[0], b[1], b[2], n[0], n[1], n[2], tint);
  const i2 = W.v(c[0], c[1], c[2], n[0], n[1], n[2], tint);
  if (fl) W.tri(i0, i2, i1);
  else W.tri(i0, i1, i2);
}

/** Frame-aligned box u∈[u0,u1], v∈[v0,v1], w∈[w0,w1]; faces in `skip` are omitted. */
export function boxF(W, F, u0, u1, v0, v1, w0, w1, tint = 0, skip = "") {
  const P = (a, b, c) => fpt(F, a, b, c);
  const nu = F.u;
  const nv = F.v;
  const nw = F.w;
  const neg = (a) => [-a[0], -a[1], -a[2]];
  if (!skip.includes("w1")) quadN(W, P(u0, v0, w1), P(u1, v0, w1), P(u1, v1, w1), P(u0, v1, w1), nw, tint);
  if (!skip.includes("w0")) quadN(W, P(u0, v0, w0), P(u1, v0, w0), P(u1, v1, w0), P(u0, v1, w0), neg(nw), tint);
  if (!skip.includes("u0")) quadN(W, P(u0, v0, w0), P(u0, v0, w1), P(u0, v1, w1), P(u0, v1, w0), neg(nu), tint);
  if (!skip.includes("u1")) quadN(W, P(u1, v0, w0), P(u1, v0, w1), P(u1, v1, w1), P(u1, v1, w0), nu, tint);
  if (!skip.includes("v1")) quadN(W, P(u0, v1, w0), P(u1, v1, w0), P(u1, v1, w1), P(u0, v1, w1), nv, tint);
  if (!skip.includes("v0")) quadN(W, P(u0, v0, w0), P(u1, v0, w0), P(u1, v0, w1), P(u0, v0, w1), neg(nv), tint);
}

/** Mitred section frames along a horizontal polyline of [x, y, z] points. */
export function polyPath(pts, closed, outSign = 1) {
  const n = pts.length;
  const path = [];
  const dirOf = (a, b) => norm([b[0] - a[0], 0, b[2] - a[2]]);
  const outOf = (d) => [d[2] * outSign, 0, -d[0] * outSign];
  for (let j = 0; j < n; j++) {
    const hasIn = closed || j > 0;
    const hasOut = closed || j < n - 1;
    const dIn = hasIn ? dirOf(pts[(j - 1 + n) % n], pts[j]) : null;
    const dOut = hasOut ? dirOf(pts[j], pts[(j + 1) % n]) : null;
    const nIn = dIn ? outOf(dIn) : outOf(dOut);
    const nOut = dOut ? outOf(dOut) : outOf(dIn);
    const k = 1 + dot(nIn, nOut);
    const m = k > 1e-4 ? [(nIn[0] + nOut[0]) / k, 0, (nIn[2] + nOut[2]) / k] : nIn;
    path.push({ o: pts[j], a: m, b: [0, 1, 0], na: norm(m) });
  }
  return path;
}

/** Sweep with unsmoothed mitred joints along the path. */
export function sweepHard(W, path, profile, opts = {}) {
  const n = path.length;
  const lim = opts.closed ? n : n - 1;
  for (let j = 0; j < lim; j++) {
    const f0 = path[j];
    const f1 = path[(j + 1) % n];
    const d = norm(sub(add(f1.o, f1.a), add(f0.o, f0.a)));
    const s = opts.outSign || 1;
    const na = [d[2] * s, 0, -d[0] * s];
    if (opts.band) {
      const o0 = f0.o;
      const bh = opts.band;
      W.carve = (x, y, z) => [
        ((x - o0[0]) * d[0] + (z - o0[2]) * d[2]) / (bh * 2.2),
        (y - o0[1]) / bh,
        2,
      ];
    }
    sweep(
      W,
      [
        { o: f0.o, a: f0.a, b: f0.b, na },
        { o: f1.o, a: f1.a, b: f1.b, na },
      ],
      profile,
      { ...opts, closed: false },
    );
    if (opts.band) W.carve = null;
  }
}

/** Arch sweep path in wall frame F: center u=c, half-width r, springing hs, base v0. */
export function archPath(F, c, r, hs, v0, segs, { pointed = 0 } = {}) {
  const path = [];
  const dn = [-F.w[0], -F.w[1], -F.w[2]];
  const nu = [-F.u[0], -F.u[1], -F.u[2]];
  path.push({ o: fpt(F, c - r, v0), a: F.u, b: dn });
  if (!pointed) {
    for (let k = 0; k <= segs; k++) {
      const th = Math.PI - (Math.PI * k) / segs;
      const cs = Math.cos(th);
      const sn = Math.sin(th);
      path.push({
        o: fpt(F, c + r * cs, hs + r * sn),
        a: [-(F.u[0] * cs + F.v[0] * sn), -(F.u[1] * cs + F.v[1] * sn), -(F.u[2] * cs + F.v[2] * sn)],
        b: dn,
      });
    }
  } else {
    const e = pointed * r;
    const R = r + e;
    const ang = Math.acos(e / R);
    const h = Math.floor(segs / 2);
    for (let k = 0; k < h; k++) {
      const th = Math.PI - (ang * k) / h;
      const cs = Math.cos(th);
      const sn = Math.sin(th);
      path.push({
        o: fpt(F, c + e + R * cs, hs + R * sn),
        a: [-(F.u[0] * cs + F.v[0] * sn), -(F.u[1] * cs + F.v[1] * sn), -(F.u[2] * cs + F.v[2] * sn)],
        b: dn,
      });
    }
    const s = 1 / Math.sin(ang);
    const nv = [-F.v[0], -F.v[1], -F.v[2]];
    path.push({ o: fpt(F, c, hs + R * Math.sin(ang)), a: [nv[0] * s, nv[1] * s, nv[2] * s], b: dn, na: nv });
    for (let k = 1; k <= h; k++) {
      const th = ang - (ang * k) / h;
      const cs = Math.cos(th);
      const sn = Math.sin(th);
      path.push({
        o: fpt(F, c - e + R * cs, hs + R * sn),
        a: [-(F.u[0] * cs + F.v[0] * sn), -(F.u[1] * cs + F.v[1] * sn), -(F.u[2] * cs + F.v[2] * sn)],
        b: dn,
      });
    }
  }
  path.push({ o: fpt(F, c + r, v0), a: nu, b: dn });
  return path;
}

/** 2D outline of an arch opening matching archPath vertex order. */
export function archOutline(c, r, hs, v0, segs, pointed = 0) {
  const p = [[c - r, v0]];
  if (!pointed) {
    for (let k = 0; k <= segs; k++) {
      const th = Math.PI - (Math.PI * k) / segs;
      p.push([c + r * Math.cos(th), hs + r * Math.sin(th)]);
    }
  } else {
    const e = pointed * r;
    const R = r + e;
    const ang = Math.acos(e / R);
    const h = Math.floor(segs / 2);
    for (let k = 0; k <= h; k++) {
      const th = Math.PI - (ang * k) / h;
      p.push([c + e + R * Math.cos(th), hs + R * Math.sin(th)]);
    }
    for (let k = 1; k <= h; k++) {
      const th = ang - (ang * k) / h;
      p.push([c - e + R * Math.cos(th), hs + R * Math.sin(th)]);
    }
  }
  p.push([c + r, v0]);
  return p;
}

export const archApex = (r, hs, pointed = 0) =>
  pointed ? hs + Math.sqrt((r + pointed * r) ** 2 - (pointed * r) ** 2) : hs + r;

/** Wall panel u∈[u0,u1], v∈[v0,v1] at depth wd with an arch notch cutout reaching v0. */
export function wallWithHole(W, F, u0, u1, v0, v1, outline, wd = 0, tint = 0, n = null) {
  const N = n || F.w;
  const m = outline.length;
  const P = (a, b) => fpt(F, a, b, wd);
  const base = W.nv;
  for (const q of outline) {
    const p = P(q[0], q[1]);
    W.v(p[0], p[1], p[2], N[0], N[1], N[2], tint);
  }
  const c = [
    [u0, v0],
    [u0, v1],
    [u1, v1],
    [u1, v0],
  ].map((q) => {
    const p = P(q[0], q[1]);
    return W.v(p[0], p[1], p[2], N[0], N[1], N[2], tint);
  });
  let ia = 0;
  for (let k = 0; k < m; k++) if (outline[k][1] > outline[ia][1]) ia = k;
  const flipTest = (() => {
    const a = P(u0, v0);
    const b = P(outline[0][0], outline[0][1]);
    const cc = P(u0, v1);
    return dot(cross(sub(b, a), sub(cc, a)), N) < 0;
  })();
  const T = (a, b, cc) => (flipTest ? W.tri(a, cc, b) : W.tri(a, b, cc));
  T(c[0], base, c[1]);
  for (let k = 0; k < ia; k++) T(c[1], base + k, base + k + 1);
  T(c[1], base + ia, c[2]);
  for (let k = ia; k < m - 1; k++) T(c[2], base + k, base + k + 1);
  T(c[2], base + m - 1, c[3]);
}

/** Fan fill of an arch outline at depth wd. */
export function fillOutline(W, F, outline, wd, tint = 0, n = null) {
  const N = n || F.w;
  const m = outline.length;
  const P = (a, b) => fpt(F, a, b, wd);
  const cu = (outline[0][0] + outline[m - 1][0]) / 2;
  const cv = outline[0][1];
  const pc = P(cu, cv);
  const ic = W.v(pc[0], pc[1], pc[2], N[0], N[1], N[2], tint);
  const base = W.nv;
  for (const q of outline) {
    const p = P(q[0], q[1]);
    W.v(p[0], p[1], p[2], N[0], N[1], N[2], tint);
  }
  const a = P(outline[0][0], outline[0][1]);
  const b = P(outline[1][0], outline[1][1]);
  const fl = dot(cross(sub(a, pc), sub(b, pc)), N) < 0;
  for (let k = 0; k < m - 1; k++) {
    if (fl) W.tri(ic, base + k + 1, base + k);
    else W.tri(ic, base + k, base + k + 1);
  }
}

/** Ring strip between two matching arch outlines at depth wd. */
export function ringOutlines(W, F, outer, inner, wd, tint = 0, n = null) {
  const N = n || F.w;
  const m = outer.length;
  const P = (a, b) => fpt(F, a, b, wd);
  const base = W.nv;
  for (let k = 0; k < m; k++) {
    const p = P(outer[k][0], outer[k][1]);
    const q = P(inner[k][0], inner[k][1]);
    W.v(p[0], p[1], p[2], N[0], N[1], N[2], tint);
    W.v(q[0], q[1], q[2], N[0], N[1], N[2], tint);
  }
  const a = P(outer[0][0], outer[0][1]);
  const b = P(inner[0][0], inner[0][1]);
  const c = P(outer[1][0], outer[1][1]);
  const fl = dot(cross(sub(b, a), sub(c, a)), N) < 0;
  for (let k = 0; k < m - 1; k++) {
    const i0 = base + k * 2;
    const i1 = i0 + 1;
    const i2 = i0 + 2;
    const i3 = i0 + 3;
    if (fl) {
      W.tri(i0, i2, i1);
      W.tri(i1, i2, i3);
    } else {
      W.tri(i0, i1, i2);
      W.tri(i1, i3, i2);
    }
  }
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Triangulate a simple 2D polygon with one interior hole via bridge insertion. */
export function triPolyHole(outer, hole) {
  const area = (p) => {
    let s = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      s += a[0] * b[1] - b[0] * a[1];
    }
    return s;
  };
  const O = area(outer) > 0 ? outer : outer.slice().reverse();
  const H = area(hole) < 0 ? hole : hole.slice().reverse();
  const X = (p, q, r, s) => {
    const d = (q[0] - p[0]) * (s[1] - r[1]) - (q[1] - p[1]) * (s[0] - r[0]);
    if (Math.abs(d) < 1e-12) return false;
    const t = ((r[0] - p[0]) * (s[1] - r[1]) - (r[1] - p[1]) * (s[0] - r[0])) / d;
    const w = ((r[0] - p[0]) * (q[1] - p[1]) - (r[1] - p[1]) * (q[0] - p[0])) / d;
    return t > 1e-9 && t < 1 - 1e-9 && w > 1e-9 && w < 1 - 1e-9;
  };
  const pairs = [];
  for (let i = 0; i < H.length; i++) {
    for (let j = 0; j < O.length; j++) {
      pairs.push([(H[i][0] - O[j][0]) ** 2 + (H[i][1] - O[j][1]) ** 2, i, j]);
    }
  }
  pairs.sort((a, b) => a[0] - b[0]);
  let bi = 0;
  let bj = 0;
  for (const [, i, j] of pairs) {
    let ok = true;
    for (let e = 0; e < O.length && ok; e++) if (X(H[i], O[j], O[e], O[(e + 1) % O.length])) ok = false;
    for (let e = 0; e < H.length && ok; e++) if (X(H[i], O[j], H[e], H[(e + 1) % H.length])) ok = false;
    if (ok) {
      bi = i;
      bj = j;
      break;
    }
  }
  const M = [];
  for (let j = 0; j <= bj; j++) M.push(O[j]);
  for (let i = 0; i <= H.length; i++) M.push(H[(bi + i) % H.length]);
  for (let j = bj; j < O.length; j++) M.push(O[j]);
  const tr = earclip(M);
  const out = [];
  for (let t = 0; t < tr.length; t += 3) out.push([M[tr[t]], M[tr[t + 1]], M[tr[t + 2]]]);
  return out;
}

/** Relief coordinates from a planar frame: one unit per `cell` metres. kind 1 = diaper, 2 = scroll band. */
export const planarCarve = (F, cell, kind = 1) => (x, y, z) => {
  const a = x - F.o[0];
  const b = y - F.o[1];
  const c = z - F.o[2];
  return [
    (a * F.u[0] + b * F.u[1] + c * F.u[2]) / cell,
    (a * F.v[0] + b * F.v[1] + c * F.v[2]) / cell,
    kind,
  ];
};
