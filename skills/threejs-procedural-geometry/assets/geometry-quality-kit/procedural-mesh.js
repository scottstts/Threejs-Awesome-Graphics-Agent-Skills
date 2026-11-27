/**
 * Copyable polygon-first modeling kernel for Three.js.
 *
 * Keep quads and n-gons in MeshData while designing a part. Triangulate only
 * in toTriangles()/toGeometry(), after solidify, subdivision, bevel, cleanup,
 * winding repair, and smooth-angle selection. Author in Z-up coordinates;
 * emission converts once to Three.js Y-up coordinates and reverses winding to
 * preserve outward normals.
 *
 * All dimensions share the caller's unit. The craft constants below are in
 * metres and should be scaled together when a project uses another unit.
 */
import { BufferAttribute, BufferGeometry, Group, Mesh, ShapeUtils, Vector2 } from "three";
const TAU = Math.PI * 2;
const BEVEL = {
  /** hinges, hardware, casings, door leaves */
  hardware: 2e-3,
  /** shelves, slats, panel edges, drawer fronts */
  panel: 4e-3,
  /** plinths, carcasses, cornices, cast stone */
  carcass: 7e-3,
  /** frames, aprons, machine bodies, tops */
  frame: 0.013,
  /** upholstered arms and backs */
  soft: 0.045
};
const SMOOTH = {
  /** lathes, tubes, turned parts (the default) */
  turned: 40,
  /** moulded slabs, slats, extruded sections */
  moulded: 34,
  /** upholstery and shells */
  shell: 45,
  /** cast iron, cast mineral */
  cast: 38,
  /** buttons, tight rolls */
  tight: 50,
  /** table and counter tops */
  top: 32
};
const PROUD_MIN = 8e-4;
const REVEAL_MIN = 15e-4;
const REVEAL_MAX = 6e-3;
const GAP_MIN = 4e-3;
class MeshData {
  /** polygon vertices in world space (see the axis note in the file header) */
  verts = [];
  /** polygons — quads and n-gons, NOT triangles */
  faces = [];
  /** per-face-corner uvs, parallel to `faces` (or null for a face without) */
  uvs = null;
  /** per-vertex colour attribute (baked surface parameters / masks) */
  colors = null;
  colorName = "";
  shading = { mode: "flat" };
  /** per-face material slot index, resolved against a slot-name list at emit */
  faceMat = null;
  /** which authoring frame the vertices are in; emit converts 'z-up' -> Y-up */
  frame = "z-up";
  /** lets `bevel()` regenerate the part rounded instead of chamfering it */
  provenance = null;
  static from(verts, faces) {
    const m = new MeshData();
    m.verts = verts;
    m.faces = faces;
    return m;
  }
  clone() {
    const m = new MeshData();
    m.verts = this.verts.map((v) => [...v]);
    m.faces = this.faces.map((f) => [...f]);
    m.uvs = this.uvs ? this.uvs.map((u) => u ? u.map((p) => [...p]) : null) : null;
    m.colors = this.colors ? this.colors.map((c) => [...c]) : null;
    m.colorName = this.colorName;
    m.shading = { ...this.shading };
    m.faceMat = this.faceMat ? [...this.faceMat] : null;
    m.frame = this.frame;
    m.provenance = null;
    return m;
  }
}
function sub(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}
function cross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}
function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
function len(a) {
  return Math.hypot(a[0], a[1], a[2]);
}
function norm(a) {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}
function faceNormal(verts, face) {
  let nx = 0;
  let ny = 0;
  let nz = 0;
  for (let i = 0; i < face.length; i++) {
    const a = verts[face[i]];
    const b = verts[face[(i + 1) % face.length]];
    nx += (a[1] - b[1]) * (a[2] + b[2]);
    ny += (a[2] - b[2]) * (a[0] + b[0]);
    nz += (a[0] - b[0]) * (a[1] + b[1]);
  }
  return [nx, ny, nz];
}
function triangulateFace(verts, face) {
  const n = face.length;
  if (n === 3) return [[0, 1, 2]];
  if (n === 4) {
    const d02 = len(sub(verts[face[0]], verts[face[2]]));
    const d13 = len(sub(verts[face[1]], verts[face[3]]));
    return d02 <= d13 ? [
      [0, 1, 2],
      [0, 2, 3]
    ] : [
      [1, 2, 3],
      [1, 3, 0]
    ];
  }
  const nrm = norm(faceNormal(verts, face));
  let u = Math.abs(nrm[0]) > 0.9 ? [0, 1, 0] : [1, 0, 0];
  const w = norm(cross(nrm, u));
  u = norm(cross(w, nrm));
  const pts2 = face.map((vi) => {
    const p = verts[vi];
    return new Vector2(dot(p, u), dot(p, w));
  });
  const tris = ShapeUtils.triangulateShape(pts2, []);
  if (tris.length === 0) {
    const out = [];
    for (let i = 1; i < n - 1; i++) out.push([0, i, i + 1]);
    return out;
  }
  return tris;
}
function translate(m, d) {
  for (const v of m.verts) {
    v[0] += d[0];
    v[1] += d[1];
    v[2] += d[2];
  }
  m.provenance = null;
  return m;
}
function rotateZ(m, ang, pivot = [0, 0]) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  for (const v of m.verts) {
    const x = v[0] - pivot[0];
    const y = v[1] - pivot[1];
    v[0] = pivot[0] + x * c - y * s;
    v[1] = pivot[1] + x * s + y * c;
  }
  m.provenance = null;
  return m;
}
function rotX(m, ang, pivot = [0, 0, 0]) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  for (const v of m.verts) {
    const y = v[1] - pivot[1];
    const z = v[2] - pivot[2];
    v[1] = pivot[1] + y * c - z * s;
    v[2] = pivot[2] + y * s + z * c;
  }
  m.provenance = null;
  return m;
}
function rotY(m, ang, pivot = [0, 0, 0]) {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  for (const v of m.verts) {
    const x = v[0] - pivot[0];
    const z = v[2] - pivot[2];
    v[0] = pivot[0] + x * c + z * s;
    v[2] = pivot[2] - x * s + z * c;
  }
  m.provenance = null;
  return m;
}
function scaleMesh(m, s, pivot = [0, 0, 0]) {
  const sv = typeof s === "number" ? [s, s, s] : s;
  for (const v of m.verts) {
    v[0] = pivot[0] + (v[0] - pivot[0]) * sv[0];
    v[1] = pivot[1] + (v[1] - pivot[1]) * sv[1];
    v[2] = pivot[2] + (v[2] - pivot[2]) * sv[2];
  }
  if (sv[0] * sv[1] * sv[2] < 0) {
    for (let i = 0; i < m.faces.length; i++) {
      m.faces[i].reverse();
      if (m.uvs?.[i]) m.uvs[i].reverse();
    }
  }
  m.provenance = null;
  return m;
}
function transform4(m, M) {
  const det =
    M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1]) -
    M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0]) +
    M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  for (const v of m.verts) {
    const x = v[0];
    const y = v[1];
    const z = v[2];
    v[0] = M[0][0] * x + M[0][1] * y + M[0][2] * z + M[0][3];
    v[1] = M[1][0] * x + M[1][1] * y + M[1][2] * z + M[1][3];
    v[2] = M[2][0] * x + M[2][1] * y + M[2][2] * z + M[2][3];
  }
  if (det < 0) {
    for (let i = 0; i < m.faces.length; i++) {
      m.faces[i].reverse();
      if (m.uvs?.[i]) m.uvs[i].reverse();
    }
  }
  m.provenance = null;
  return m;
}
function smoothAngleForSegments(segments, floorDeg = 40) {
  const safeSegments = Math.max(3, Math.floor(segments));
  return Math.min(89, Math.max(floorDeg, 360 / safeSegments + 5));
}
function placeYaw(m, center, yaw) {
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  for (const v of m.verts) {
    const x = v[0];
    const z = v[2];
    v[0] = center[0] + x * c + z * s;
    v[1] = center[1] + v[1];
    v[2] = center[2] - x * s + z * c;
  }
  m.provenance = null;
  return m;
}
function join(parts) {
  const list = parts.filter((p) => !!p);
  const out = new MeshData();
  if (list.length === 0) return out;
  const anyUv = list.some((p) => p.uvs);
  const anyCol = list.some((p) => p.colors);
  const anyMat = list.some((p) => p.faceMat);
  if (anyUv) out.uvs = [];
  if (anyCol) out.colors = [];
  if (anyMat) out.faceMat = [];
  out.frame = list[0].frame;
  const colorNames = new Set(list.filter((p) => p.colors).map((p) => p.colorName || "color"));
  if (colorNames.size > 1) throw new Error(`join: colored parts use conflicting attribute names: ${[...colorNames].join(", ")}`);
  if (colorNames.size === 1) out.colorName = [...colorNames][0];
  let shading = { mode: "flat" };
  for (const p of list) {
    if (p.frame !== out.frame) throw new Error("join: parts must share an authoring frame");
    const base = out.verts.length;
    for (const v of p.verts) out.verts.push([...v]);
    for (let fi = 0; fi < p.faces.length; fi++) {
      out.faces.push(p.faces[fi].map((i) => i + base));
      if (anyUv) out.uvs.push(p.uvs ? p.uvs[fi] ?? null : null);
      if (anyMat) out.faceMat.push(p.faceMat ? p.faceMat[fi] : 0);
    }
    if (anyCol) {
      const cols = p.colors ?? p.verts.map(() => [1, 1, 1]);
      for (const c of cols) out.colors.push([...c]);
    }
    if (p.shading.mode === "smooth") shading = p.shading;
  }
  out.shading = shading;
  return out;
}
function recalcNormals(m, flip = false) {
  const edgeMap = /* @__PURE__ */ new Map();
  const key = (a, b) => a < b ? a + "_" + b : b + "_" + a;
  m.faces.forEach((f, fi) => {
    for (let i = 0; i < f.length; i++) {
      const a = f[i];
      const b = f[(i + 1) % f.length];
      if (a === b) continue;
      const k = key(a, b);
      let list = edgeMap.get(k);
      if (!list) {
        list = [];
        edgeMap.set(k, list);
      }
      list.push({ face: fi, fwd: a < b });
    }
  });
  const flipped = new Array(m.faces.length).fill(false);
  const visited = new Array(m.faces.length).fill(false);
  const comps = [];
  for (let start = 0; start < m.faces.length; start++) {
    if (visited[start]) continue;
    const comp = [];
    const stack = [start];
    visited[start] = true;
    while (stack.length) {
      const fi = stack.pop();
      comp.push(fi);
      const f = m.faces[fi];
      for (let i = 0; i < f.length; i++) {
        const a = f[i];
        const b = f[(i + 1) % f.length];
        if (a === b) continue;
        const pair = edgeMap.get(key(a, b));
        if (pair.length !== 2) continue;
        for (const o of pair) {
          if (o.face === fi || visited[o.face]) continue;
          const self = pair.find((p) => p.face === fi);
          const selfFwd = self.fwd !== flipped[fi];
          const otherFwd = o.fwd !== flipped[o.face];
          if (selfFwd === otherFwd) flipped[o.face] = !flipped[o.face];
          visited[o.face] = true;
          stack.push(o.face);
        }
      }
    }
    comps.push(comp);
  }
  for (const comp of comps) {
    let closed = true;
    for (const fi of comp) {
      const f = m.faces[fi];
      for (let i = 0; i < f.length; i++) {
        const a = f[i];
        const b = f[(i + 1) % f.length];
        if (a === b) continue;
        if (edgeMap.get(key(a, b)).length !== 2) {
          closed = false;
          break;
        }
      }
      if (!closed) break;
    }
    let volume = 0;
    let keepScore = 0;
    for (const fi of comp) {
      const f = flipped[fi] ? [...m.faces[fi]].reverse() : m.faces[fi];
      const tris = triangulateFace(m.verts, f);
      for (const [i, j, k] of tris) {
        volume += dot(m.verts[f[i]], cross(m.verts[f[j]], m.verts[f[k]]));
      }
      keepScore += flipped[fi] ? -1 : 1;
    }
    const flipComp = closed ? volume < 0 : keepScore < 0;
    for (const fi of comp) {
      let doFlip = flipped[fi];
      if (flipComp) doFlip = !doFlip;
      if (flip) doFlip = !doFlip;
      if (doFlip) {
        m.faces[fi].reverse();
        if (m.uvs && m.uvs[fi]) m.uvs[fi].reverse();
      }
    }
  }
  return m;
}
function solidify(m, thickness) {
  const half = thickness / 2;
  const vnormals = m.verts.map(() => [0, 0, 0]);
  m.faces.forEach((f) => {
    const n = faceNormal(m.verts, f);
    for (const vi of f) {
      vnormals[vi][0] += n[0];
      vnormals[vi][1] += n[1];
      vnormals[vi][2] += n[2];
    }
  });
  const nrm = vnormals.map((v) => norm(v));
  const nv = m.verts.length;
  const outer = m.verts.map((v, i) => [
    v[0] + nrm[i][0] * half,
    v[1] + nrm[i][1] * half,
    v[2] + nrm[i][2] * half
  ]);
  const inner = m.verts.map((v, i) => [
    v[0] - nrm[i][0] * half,
    v[1] - nrm[i][1] * half,
    v[2] - nrm[i][2] * half
  ]);
  const counts = /* @__PURE__ */ new Map();
  const key = (a, b) => a < b ? a + "_" + b : b + "_" + a;
  m.faces.forEach((f) => {
    for (let i = 0; i < f.length; i++) {
      const a = f[i];
      const b = f[(i + 1) % f.length];
      const k = key(a, b);
      const e = counts.get(k);
      if (e) e[2]++;
      else counts.set(k, [a, b, 1]);
    }
  });
  const faces = [];
  for (const f of m.faces) faces.push([...f]);
  for (const f of m.faces) faces.push([...f].reverse().map((i) => i + nv));
  for (const [a, b, c] of counts.values()) {
    if (c === 1) faces.push([b, a, a + nv, b + nv]);
  }
  m.verts = outer.concat(inner);
  m.faces = faces;
  m.uvs = null;
  m.faceMat = null;
  m.provenance = null;
  recalcNormals(m);
  return m;
}
function subsurf(m, levels = 1) {
  for (let l = 0; l < levels; l++) ccOnce(m);
  m.provenance = null;
  return m;
}
function ccOnce(m) {
  const nv = m.verts.length;
  const facePts = [];
  for (const f of m.faces) {
    const p = [0, 0, 0];
    for (const vi of f) {
      p[0] += m.verts[vi][0];
      p[1] += m.verts[vi][1];
      p[2] += m.verts[vi][2];
    }
    facePts.push([p[0] / f.length, p[1] / f.length, p[2] / f.length]);
  }
  const edges = /* @__PURE__ */ new Map();
  const key = (a, b) => a < b ? a + "_" + b : b + "_" + a;
  m.faces.forEach((f, fi) => {
    for (let i = 0; i < f.length; i++) {
      const a = f[i];
      const b = f[(i + 1) % f.length];
      const k = key(a, b);
      let e = edges.get(k);
      if (!e) {
        e = { a, b, faces: [], idx: -1 };
        edges.set(k, e);
      }
      e.faces.push(fi);
    }
  });
  const edgePts = [];
  let ei = 0;
  for (const e of edges.values()) {
    e.idx = ei++;
    const va = m.verts[e.a];
    const vb = m.verts[e.b];
    if (e.faces.length === 2) {
      const fa = facePts[e.faces[0]];
      const fb = facePts[e.faces[1]];
      edgePts.push([
        (va[0] + vb[0] + fa[0] + fb[0]) / 4,
        (va[1] + vb[1] + fa[1] + fb[1]) / 4,
        (va[2] + vb[2] + fa[2] + fb[2]) / 4
      ]);
    } else {
      edgePts.push([(va[0] + vb[0]) / 2, (va[1] + vb[1]) / 2, (va[2] + vb[2]) / 2]);
    }
  }
  const vFaces = Array.from({ length: nv }, () => []);
  m.faces.forEach((f, fi) => {
    for (const vi of f) vFaces[vi].push(fi);
  });
  const vEdges = Array.from({ length: nv }, () => []);
  for (const e of edges.values()) {
    vEdges[e.a].push(e);
    vEdges[e.b].push(e);
  }
  const newVerts = m.verts.map((v, vi) => {
    const boundary = vEdges[vi].filter((e) => e.faces.length === 1);
    if (boundary.length > 0) {
      let sx = v[0] * 6;
      let sy = v[1] * 6;
      let sz = v[2] * 6;
      let cnt = 6;
      for (const e of boundary) {
        const o = e.a === vi ? m.verts[e.b] : m.verts[e.a];
        sx += o[0];
        sy += o[1];
        sz += o[2];
        cnt += 1;
      }
      return [sx / cnt, sy / cnt, sz / cnt];
    }
    const nf = vFaces[vi].length;
    if (nf === 0) return [...v];
    const F = [0, 0, 0];
    for (const fi of vFaces[vi]) {
      F[0] += facePts[fi][0];
      F[1] += facePts[fi][1];
      F[2] += facePts[fi][2];
    }
    F[0] /= nf;
    F[1] /= nf;
    F[2] /= nf;
    const R = [0, 0, 0];
    const ne = vEdges[vi].length;
    for (const e of vEdges[vi]) {
      R[0] += (m.verts[e.a][0] + m.verts[e.b][0]) / 2;
      R[1] += (m.verts[e.a][1] + m.verts[e.b][1]) / 2;
      R[2] += (m.verts[e.a][2] + m.verts[e.b][2]) / 2;
    }
    R[0] /= ne;
    R[1] /= ne;
    R[2] /= ne;
    const n = ne;
    return [
      (F[0] + 2 * R[0] + (n - 3) * v[0]) / n,
      (F[1] + 2 * R[1] + (n - 3) * v[1]) / n,
      (F[2] + 2 * R[2] + (n - 3) * v[2]) / n
    ];
  });
  const verts = [...newVerts, ...facePts, ...edgePts];
  const faceBase = nv;
  const edgeBase = nv + facePts.length;
  const faces = [];
  m.faces.forEach((f, fi) => {
    const n = f.length;
    for (let i = 0; i < n; i++) {
      const v0 = f[i];
      const ePrev = edges.get(key(f[(i - 1 + n) % n], v0));
      const eNext = edges.get(key(v0, f[(i + 1) % n]));
      faces.push([v0, edgeBase + eNext.idx, faceBase + fi, edgeBase + ePrev.idx]);
    }
  });
  m.verts = verts;
  m.faces = faces;
  m.uvs = null;
  m.colors = null;
  m.faceMat = null;
}
function roundedRect(w, h, r, seg = 6) {
  const rr = Math.min(r, Math.min(w, h) * 0.5 - 1e-6);
  const hw = w * 0.5 - rr;
  const hh = h * 0.5 - rr;
  const pts = [];
  const corners = [
    [hw, hh, 0],
    [-hw, hh, Math.PI * 0.5],
    [-hw, -hh, Math.PI],
    [hw, -hh, Math.PI * 1.5]
  ];
  for (const [cx, cy, a0] of corners) {
    for (let k = 0; k <= seg; k++) {
      const a = a0 + Math.PI * 0.5 * (k / seg);
      pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
    }
  }
  return pts;
}
function chamferRect(w, h, c) {
  const cc = Math.min(c, Math.min(w, h) * 0.5 - 1e-6);
  const hw = w * 0.5;
  const hh = h * 0.5;
  return [
    [hw, hh - cc],
    [hw - cc, hh],
    [-hw + cc, hh],
    [-hw, hh - cc],
    [-hw, -hh + cc],
    [-hw + cc, -hh],
    [hw - cc, -hh],
    [hw, -hh + cc]
  ];
}
function circle(r, seg = 32, cx = 0, cy = 0, phase = 0) {
  return Array.from(
    { length: seg },
    (_, i) => [cx + r * Math.cos(phase + TAU * i / seg), cy + r * Math.sin(phase + TAU * i / seg)]
  );
}
function arcPts(cx, cy, r, a0, a1, n = 8, skipFirst = false) {
  const out = [];
  for (let i = skipFirst ? 1 : 0; i <= n; i++) {
    const a = a0 + (a1 - a0) * i / n;
    out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return out;
}
function bez(p0, p1, p2, p3, n = 8, skipFirst = false) {
  const out = [];
  for (let i = skipFirst ? 1 : 0; i <= n; i++) {
    const t = i / n;
    const mt = 1 - t;
    out.push([
      mt ** 3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0],
      mt ** 3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1]
    ]);
  }
  return out;
}
function polyArea(poly) {
  let s = 0;
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const [x0, y0] = poly[i];
    const [x1, y1] = poly[(i + 1) % n];
    s += x0 * y1 - x1 * y0;
  }
  return s * 0.5;
}
function ccw(poly) {
  return polyArea(poly) > 0 ? [...poly] : [...poly].reverse();
}
function polyOffset(poly, d) {
  const n = poly.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = poly[(i - 1 + n) % n];
    const b = poly[i];
    const c = poly[(i + 1) % n];
    let e0x = b[0] - a[0];
    let e0y = b[1] - a[1];
    let e1x = c[0] - b[0];
    let e1y = c[1] - b[1];
    const l0 = Math.hypot(e0x, e0y) || 1;
    const l1 = Math.hypot(e1x, e1y) || 1;
    e0x /= l0;
    e0y /= l0;
    e1x /= l1;
    e1y /= l1;
    const n0 = [e0y, -e0x];
    const n1 = [e1y, -e1x];
    let mx = n0[0] + n1[0];
    let my = n0[1] + n1[1];
    const ml = Math.hypot(mx, my);
    if (ml < 1e-9) {
      mx = n0[0];
      my = n0[1];
    } else {
      mx /= ml;
      my /= ml;
    }
    const scale = 1 / Math.max(0.25, mx * n0[0] + my * n0[1]);
    out.push([b[0] + mx * d * scale, b[1] + my * d * scale]);
  }
  return out;
}
function insetPoly(poly, d) {
  return polyOffset(poly, -d);
}
function offsetPolyline(pts, d, closed = false) {
  const isect = (a0, u0, b0, u1) => {
    const den = u0[0] * -u1[1] - u0[1] * -u1[0];
    if (Math.abs(den) < 1e-9) return b0;
    const wx = b0[0] - a0[0];
    const wy = b0[1] - a0[1];
    const tt = (wx * -u1[1] - wy * -u1[0]) / den;
    return [a0[0] + u0[0] * tt, a0[1] + u0[1] * tt];
  };
  const P = pts;
  const n = P.length;
  const segs = [];
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = P[i];
    const b = P[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const u = [dx / l, dy / l];
    const nn = [u[1], -u[0]];
    segs.push([
      [a[0] + nn[0] * d, a[1] + nn[1] * d],
      [b[0] + nn[0] * d, b[1] + nn[1] * d],
      u
    ]);
  }
  const out = [];
  if (closed) {
    for (let i = 0; i < n; i++) {
      const sp = segs[(i - 1 + m) % m];
      const sc = segs[i % m];
      out.push(isect(sp[0], sp[2], sc[0], sc[2]));
    }
  } else {
    out.push(segs[0][0]);
    for (let i = 0; i < segs.length - 1; i++) out.push(isect(segs[i][0], segs[i][2], segs[i + 1][0], segs[i + 1][2]));
    out.push(segs[segs.length - 1][1]);
  }
  return out;
}
function densify(pts, d = 0.05) {
  const out = [[...pts[0]]];
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const c = pts[i + 1];
    const din = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const dout = [c[0] - b[0], c[1] - b[1], c[2] - b[2]];
    const li = len(din);
    const lo = len(dout);
    if (li > 2.5 * d) out.push([b[0] - din[0] / li * d, b[1] - din[1] / li * d, b[2] - din[2] / li * d]);
    out.push([...b]);
    if (lo > 2.5 * d) out.push([b[0] + dout[0] / lo * d, b[1] + dout[1] / lo * d, b[2] + dout[2] / lo * d]);
  }
  out.push([...pts[pts.length - 1]]);
  return out;
}
function meshObj(verts, faces) {
  return MeshData.from(
    verts.map((v) => [...v]),
    faces.map((f) => [...f])
  );
}
function box(x0, y0, z0, x1, y1, z1) {
  const v = [
    [x0, y0, z0],
    [x1, y0, z0],
    [x1, y1, z0],
    [x0, y1, z0],
    [x0, y0, z1],
    [x1, y0, z1],
    [x1, y1, z1],
    [x0, y1, z1]
  ];
  const f = [
    [3, 2, 1, 0],
    [4, 5, 6, 7],
    [0, 1, 5, 4],
    [1, 2, 6, 5],
    [2, 3, 7, 6],
    [3, 0, 4, 7]
  ];
  const m = MeshData.from(v, f);
  markBox(m, [x0, y0, z0, x1, y1, z1]);
  return m;
}
function prism(poly, z0, z1, flip = false) {
  const n = poly.length;
  const verts = [];
  for (const p of poly) verts.push([p[0], p[1], z0]);
  for (const p of poly) verts.push([p[0], p[1], z1]);
  const faces = [
    Array.from({ length: n }, (_, i) => n - 1 - i),
    Array.from({ length: n }, (_, i) => n + i)
  ];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faces.push([i, j, j + n, i + n]);
  }
  const m = MeshData.from(verts, faces);
  recalcNormals(m, flip);
  markPrism(m, poly, z0, z1);
  return m;
}
function prismXZ(poly, y0, y1) {
  const n = poly.length;
  const verts = [];
  for (const p of poly) verts.push([p[0], y0, p[1]]);
  for (const p of poly) verts.push([p[0], y1, p[1]]);
  const faces = [
    Array.from({ length: n }, (_, i) => i),
    Array.from({ length: n }, (_, i) => 2 * n - 1 - i)
  ];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faces.push([i, j, j + n, i + n]);
  }
  const m = MeshData.from(verts, faces);
  recalcNormals(m);
  return m;
}
function prismYZ(poly, x0, x1) {
  const n = poly.length;
  const verts = [];
  for (const p of poly) verts.push([x0, p[0], p[1]]);
  for (const p of poly) verts.push([x1, p[0], p[1]]);
  const faces = [
    Array.from({ length: n }, (_, i) => i),
    Array.from({ length: n }, (_, i) => 2 * n - 1 - i)
  ];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    faces.push([i, j, j + n, i + n]);
  }
  const m = MeshData.from(verts, faces);
  recalcNormals(m);
  return m;
}
function panelWithHoles(w, h, thickness, holes = []) {
  const xsSet = /* @__PURE__ */ new Set([0, w]);
  const zsSet = /* @__PURE__ */ new Set([0, h]);
  for (const hh of holes) {
    xsSet.add(hh[0]);
    xsSet.add(hh[2]);
    zsSet.add(hh[1]);
    zsSet.add(hh[3]);
  }
  const xs = [...xsSet].sort((a, b) => a - b);
  const zs = [...zsSet].sort((a, b) => a - b);
  const nx = xs.length - 1;
  const nz = zs.length - 1;
  const solid = (i, j) => {
    if (i < 0 || j < 0 || i >= nx || j >= nz) return false;
    const cx0 = xs[i];
    const cx1 = xs[i + 1];
    const cz0 = zs[j];
    const cz1 = zs[j + 1];
    for (const [a, b, c, d] of holes) {
      if (a - 1e-6 <= cx0 && cx1 <= c + 1e-6 && b - 1e-6 <= cz0 && cz1 <= d + 1e-6) return false;
    }
    return true;
  };
  const idx = /* @__PURE__ */ new Map();
  const verts = [];
  const vid = (i, j, side) => {
    const k = `${i}_${j}_${side}`;
    let r = idx.get(k);
    if (r === void 0) {
      r = verts.length;
      verts.push([xs[i], side ? thickness : 0, zs[j]]);
      idx.set(k, r);
    }
    return r;
  };
  const faces = [];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      if (!solid(i, j)) continue;
      const a = vid(i, j, 0);
      const b = vid(i + 1, j, 0);
      const c = vid(i + 1, j + 1, 0);
      const d = vid(i, j + 1, 0);
      faces.push([a, b, c, d]);
      const a2 = vid(i, j, 1);
      const b2 = vid(i + 1, j, 1);
      const c2 = vid(i + 1, j + 1, 1);
      const d2 = vid(i, j + 1, 1);
      faces.push([d2, c2, b2, a2]);
      if (!solid(i, j - 1)) faces.push([b, a, a2, b2]);
      if (!solid(i, j + 1)) faces.push([d, c, c2, d2]);
      if (!solid(i - 1, j)) faces.push([a, d, d2, a2]);
      if (!solid(i + 1, j)) faces.push([c, b, b2, c2]);
    }
  }
  const m = MeshData.from(verts, faces);
  recalcNormals(m);
  return m;
}
function wallRun(p0, p1, t, z0, z1, holes = [], side = 1, cap0 = true, cap1 = true) {
  const dx = p1[0] - p0[0];
  const dy = p1[1] - p0[1];
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  const nx = -uy * t * side;
  const ny = ux * t * side;
  const q = (v) => Math.round(v * 1e5) / 1e5;
  const snapped = holes.map((hh) => hh.map(q));
  const us = [.../* @__PURE__ */ new Set([q(0), q(length), ...snapped.flatMap((hh) => [hh[0], hh[1]])])].sort((a, b) => a - b);
  const zs = [.../* @__PURE__ */ new Set([q(z0), q(z1), ...snapped.flatMap((hh) => [hh[2], hh[3]])])].sort((a, b) => a - b);
  const nu = us.length - 1;
  const nz = zs.length - 1;
  const solid = (i, j) => {
    if (i < 0 || j < 0 || i >= nu || j >= nz) return false;
    const u0 = us[i];
    const u1 = us[i + 1];
    const c0 = zs[j];
    const c1 = zs[j + 1];
    for (const [a, b, e, f] of snapped) {
      if (a - 1e-6 <= u0 && u1 <= b + 1e-6 && e - 1e-6 <= c0 && c1 <= f + 1e-6) return false;
    }
    return true;
  };
  const verts = [];
  const idx = /* @__PURE__ */ new Map();
  const vid = (i, j, s) => {
    const k = `${i}_${j}_${s}`;
    let r = idx.get(k);
    if (r === void 0) {
      r = verts.length;
      verts.push([p0[0] + ux * us[i] + (s ? nx : 0), p0[1] + uy * us[i] + (s ? ny : 0), zs[j]]);
      idx.set(k, r);
    }
    return r;
  };
  const faces = [];
  for (let i = 0; i < nu; i++) {
    for (let j = 0; j < nz; j++) {
      if (!solid(i, j)) continue;
      const a = vid(i, j, 0);
      const b = vid(i + 1, j, 0);
      const c = vid(i + 1, j + 1, 0);
      const e = vid(i, j + 1, 0);
      faces.push([a, b, c, e]);
      const a2 = vid(i, j, 1);
      const b2 = vid(i + 1, j, 1);
      const c2 = vid(i + 1, j + 1, 1);
      const e2 = vid(i, j + 1, 1);
      faces.push([e2, c2, b2, a2]);
      if (!solid(i, j - 1)) faces.push([b, a, a2, b2]);
      if (!solid(i, j + 1)) faces.push([e, c, c2, e2]);
      if (!solid(i - 1, j) && (i > 0 || cap0)) faces.push([a, e, e2, a2]);
      if (!solid(i + 1, j) && (i < nu - 1 || cap1)) faces.push([c, b, b2, c2]);
    }
  }
  const md = MeshData.from(verts, faces);
  recalcNormals(md);
  return md;
}
function loft(rings, opts = {}) {
  const { closeU = false, closeV = false, weldPoles = false, capStart = false, capEnd = false } = opts;
  const nu = rings.length;
  const nv = rings[0].length;
  const verts = [];
  const grid = [];
  let poleA = -1;
  let poleB = -1;
  for (let i = 0; i < nu; i++) {
    const row = [];
    for (let j = 0; j < nv; j++) {
      const p = rings[i][j];
      if (weldPoles && j === 0 && Math.abs(p[0]) < 1e-9 && Math.abs(p[1]) < 1e-9) {
        if (poleA < 0) {
          poleA = verts.length;
          verts.push([...p]);
        }
        row.push(poleA);
        continue;
      }
      if (weldPoles && j === nv - 1 && Math.abs(p[0]) < 1e-9 && Math.abs(p[1]) < 1e-9) {
        if (poleB < 0) {
          poleB = verts.length;
          verts.push([...p]);
        }
        row.push(poleB);
        continue;
      }
      row.push(verts.length);
      verts.push([...p]);
    }
    grid.push(row);
  }
  const faces = [];
  const ulim = closeU ? nu : nu - 1;
  const vlim = closeV ? nv : nv - 1;
  for (let i = 0; i < ulim; i++) {
    const i2 = (i + 1) % nu;
    for (let j = 0; j < vlim; j++) {
      const j2 = (j + 1) % nv;
      const q = [grid[i][j], grid[i2][j], grid[i2][j2], grid[i][j2]];
      const uq = [];
      for (const k of q) if (!uq.includes(k)) uq.push(k);
      if (uq.length >= 3) faces.push(uq);
    }
  }
  if (closeU && !closeV) {
    if (capStart && grid[0][0] !== grid[1][0]) faces.push(Array.from({ length: nu }, (_, k) => grid[nu - 1 - k][0]));
    if (capEnd && grid[0][nv - 1] !== grid[1][nv - 1]) faces.push(Array.from({ length: nu }, (_, k) => grid[k][nv - 1]));
  } else if (closeV && !closeU) {
    if (capStart) faces.push(Array.from({ length: nv }, (_, j) => grid[0][nv - 1 - j]));
    if (capEnd) faces.push(Array.from({ length: nv }, (_, j) => grid[nu - 1][j]));
  }
  const m = MeshData.from(verts, faces);
  recalcNormals(m);
  return m;
}
function revolve(profile, segments = 32, opts = {}) {
  const { arc = TAU, capStart = true, capEnd = true, axis = "z", smooth = SMOOTH.turned } = opts;
  const close = opts.close ?? Math.abs(arc - TAU) < 1e-6;
  const nseg = close ? segments : segments + 1;
  const rings = [];
  for (let s = 0; s < nseg; s++) {
    const a = arc * (s / segments);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    rings.push(profile.map(([r, z]) => [r * ca, r * sa, z]));
  }
  const m = loft(rings, { closeU: close, weldPoles: true, capStart, capEnd });
  if (axis === "x") rotY(m, Math.PI / 2);
  else if (axis === "y") rotX(m, -Math.PI / 2);
  smoothShade(m, smooth);
  return m;
}
function tubeAlong(path, profile, opts = {}) {
  const { closePath = false, up = [0, 0, 1], cap = true, miter = false, roll, scale } = opts;
  const P = path;
  const n = P.length;
  const tangents = [];
  for (let i = 0; i < n; i++) {
    let t;
    if (i === 0) {
      t = closePath ? [P[1][0] - P[n - 1][0], P[1][1] - P[n - 1][1], P[1][2] - P[n - 1][2]] : [P[1][0] - P[0][0], P[1][1] - P[0][1], P[1][2] - P[0][2]];
    } else if (i === n - 1) {
      t = closePath ? [P[0][0] - P[n - 2][0], P[0][1] - P[n - 2][1], P[0][2] - P[n - 2][2]] : [P[n - 1][0] - P[n - 2][0], P[n - 1][1] - P[n - 2][1], P[n - 1][2] - P[n - 2][2]];
    } else {
      t = [P[i + 1][0] - P[i - 1][0], P[i + 1][1] - P[i - 1][1], P[i + 1][2] - P[i - 1][2]];
    }
    const tl = len(t) || 1;
    tangents.push([t[0] / tl, t[1] / tl, t[2] / tl]);
  }
  const sides = [];
  {
    let u = [...up];
    if (Math.abs(dot(tangents[0], u)) > 0.999) u = [1, 0, 0];
    sides.push(norm(cross(tangents[0], u)));
  }
  const reflect = (v, mirror) => {
    const c = dot(mirror, mirror);
    if (c < 1e-12) return v;
    const k = 2 / c * dot(mirror, v);
    return [v[0] - mirror[0] * k, v[1] - mirror[1] * k, v[2] - mirror[2] * k];
  };
  for (let i = 1; i < n; i++) {
    const v1 = [P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]];
    const sL = reflect(sides[i - 1], v1);
    const tL = reflect(tangents[i - 1], v1);
    const v2 = [tangents[i][0] - tL[0], tangents[i][1] - tL[1], tangents[i][2] - tL[2]];
    sides.push(norm(reflect(sL, v2)));
  }
  const twist = new Array(n).fill(0);
  if (closePath && n > 2) {
    const v1 = [P[0][0] - P[n - 1][0], P[0][1] - P[n - 1][1], P[0][2] - P[n - 1][2]];
    const sL = reflect(sides[n - 1], v1);
    const tL = reflect(tangents[n - 1], v1);
    const v2 = [tangents[0][0] - tL[0], tangents[0][1] - tL[1], tangents[0][2] - tL[2]];
    const sWrap = norm(reflect(sL, v2));
    const uRef = norm(cross(sides[0], tangents[0]));
    const angle = Math.atan2(dot(sWrap, uRef), dot(sWrap, sides[0]));
    for (let i = 0; i < n; i++) twist[i] = -angle * (i / n);
  }
  const rings = [];
  for (let i = 0; i < n; i++) {
    const t = tangents[i];
    let s = sides[i];
    let u2 = norm(cross(s, t));
    const rl = (typeof roll === "number" ? roll : roll ? roll[Math.min(i, roll.length - 1)] : 0) + twist[i];
    if (rl) {
      const c = Math.cos(rl);
      const sn = Math.sin(rl);
      const s2 = [s[0] * c + u2[0] * sn, s[1] * c + u2[1] * sn, s[2] * c + u2[2] * sn];
      u2 = [u2[0] * c - s[0] * sn, u2[1] * c - s[1] * sn, u2[2] * c - s[2] * sn];
      s = s2;
    }
    let ka = 1;
    let kb = 1;
    if (scale) {
      const sc = scale[Math.min(i, scale.length - 1)];
      ka = sc[0];
      kb = sc[1];
    }
    if (miter && (closePath || i > 0 && i < n - 1)) {
      const p = P[(i - 1 + n) % n];
      const e = [P[i][0] - p[0], P[i][1] - p[1], P[i][2] - p[2]];
      const el = len(e);
      if (el > 1e-9) ka /= Math.max(0.4, (e[0] * t[0] + e[1] * t[1] + e[2] * t[2]) / el);
    }
    rings.push(
      profile.map(
        ([a, b]) => [
          P[i][0] + s[0] * a * ka + u2[0] * b * kb,
          P[i][1] + s[1] * a * ka + u2[1] * b * kb,
          P[i][2] + s[2] * a * ka + u2[2] * b * kb
        ]
      )
    );
  }
  return loft(rings, {
    closeU: closePath,
    closeV: true,
    capStart: cap && !closePath,
    capEnd: cap && !closePath
  });
}
function sweepRectFrame(w, h, profile) {
  const hw = w * 0.5;
  const hh = h * 0.5;
  const corners = [
    [-hw, -hh],
    [hw, -hh],
    [hw, hh],
    [-hw, hh]
  ];
  const dirs = [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1]
  ];
  const rings = [];
  for (let k = 0; k < 4; k++) {
    const [cx, cz] = corners[k];
    const [sx, sz] = dirs[k];
    rings.push(profile.map(([a, b]) => [cx + sx * a, b, cz + sz * a]));
  }
  return loft(rings, { closeU: true, closeV: true });
}
function sweepPlanarLoop(path, profile, close = true) {
  const n = path.length;
  if (n < (close ? 3 : 2)) throw new RangeError(`sweepPlanarLoop: ${close ? "closed" : "open"} path needs at least ${close ? 3 : 2} points`);
  const rings = [];
  for (let i = 0; i < n; i++) {
    const a = !close && i === 0 ? path[0] : path[(i - 1 + n) % n];
    const b = !close && i === n - 1 ? path[n - 1] : path[(i + 1) % n];
    let tx = b[0] - a[0];
    let ty = b[1] - a[1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    const nx = ty;
    const ny = -tx;
    rings.push(profile.map(([aa, bb]) => [path[i][0] + nx * aa, path[i][1] + ny * aa, bb]));
  }
  return loft(rings, { closeU: close, closeV: true });
}
function runMolding(path, profile, cap = true, closed = false) {
  const offs = /* @__PURE__ */ new Map();
  for (const [, d] of profile) {
    if (!offs.has(d)) offs.set(d, offsetPolyline(path, d, closed));
  }
  const rings = [];
  for (let i = 0; i < path.length; i++) {
    rings.push(
      profile.map(([z, d]) => {
        const p = offs.get(d)[i];
        return [p[0], p[1], z];
      })
    );
  }
  return loft(rings, {
    closeU: closed,
    closeV: true,
    capStart: cap && !closed,
    capEnd: cap && !closed
  });
}
function roundedBoxMesh(bounds, radius, segments) {
  const [x0, y0, z0, x1, y1, z1] = bounds;
  const h = [(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2];
  const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
  const r = Math.min(radius, Math.min(h[0], h[1], h[2]) * 0.999);
  const s = Math.max(1, segments);
  const knots = (hh) => {
    const inner2 = hh - r;
    const out = [];
    for (let k = s; k >= 0; k--) out.push(-(inner2 + r * Math.tan(Math.PI / 4 * (k / s))));
    for (let k = 0; k <= s; k++) out.push(inner2 + r * Math.tan(Math.PI / 4 * (k / s)));
    return out;
  };
  const ax = [knots(h[0]), knots(h[1]), knots(h[2])];
  const inner = [Math.max(h[0] - r, 0), Math.max(h[1] - r, 0), Math.max(h[2] - r, 0)];
  const project = (p) => {
    const q = [
      Math.min(Math.max(p[0], -inner[0]), inner[0]),
      Math.min(Math.max(p[1], -inner[1]), inner[1]),
      Math.min(Math.max(p[2], -inner[2]), inner[2])
    ];
    const d = sub(p, q);
    const l = len(d);
    if (l < 1e-12) return p;
    return [q[0] + d[0] / l * r, q[1] + d[1] / l * r, q[2] + d[2] / l * r];
  };
  const vmap = /* @__PURE__ */ new Map();
  const verts = [];
  const faces = [];
  const vid = (p) => {
    const k = p.map((x) => Math.round(x * 1e7)).join("_");
    let idx = vmap.get(k);
    if (idx === void 0) {
      idx = verts.length;
      verts.push([p[0] + c[0], p[1] + c[1], p[2] + c[2]]);
      vmap.set(k, idx);
    }
    return idx;
  };
  const AXES = [
    [0, 1, 2],
    [1, 2, 0],
    [2, 0, 1]
  ];
  for (const [a, u, v] of AXES) {
    for (const sign of [-1, 1]) {
      const gu = ax[u];
      const gv = ax[v];
      for (let i = 0; i < gu.length - 1; i++) {
        for (let j = 0; j < gv.length - 1; j++) {
          const mk = (uu, vv) => {
            const p = [0, 0, 0];
            p[a] = sign * h[a];
            p[u] = uu;
            p[v] = vv;
            return vid(project(p));
          };
          const q = [mk(gu[i], gv[j]), mk(gu[i + 1], gv[j]), mk(gu[i + 1], gv[j + 1]), mk(gu[i], gv[j + 1])];
          if (sign < 0) q.reverse();
          const uq = q.filter((x, k) => q.indexOf(x) === k);
          if (uq.length >= 3) faces.push(uq);
        }
      }
    }
  }
  const m = MeshData.from(verts, faces);
  recalcNormals(m);
  m.shading = { mode: "smooth", angle: SMOOTH.turned };
  return m;
}
function beveledPrismMesh(poly, z0, z1, r, segments) {
  const s = Math.max(1, segments);
  const rr = Math.min(r, (z1 - z0) / 2 - 1e-5);
  const rings = [];
  const ringAt = (inset, z) => insetPoly(poly, inset).map((p) => [p[0], p[1], z]);
  for (let k = 0; k <= s; k++) {
    const a = Math.PI / 2 * (k / s);
    rings.push(ringAt(rr * (1 - Math.sin(a)), z0 + rr * (1 - Math.cos(a))));
  }
  for (let k = 0; k <= s; k++) {
    const a = Math.PI / 2 * (k / s);
    rings.push(ringAt(rr * (1 - Math.cos(a)), z1 - rr * (1 - Math.sin(a))));
  }
  const n = poly.length;
  const verts = [];
  const faces = [];
  for (const ring of rings) for (const p of ring) verts.push(p);
  const nr = rings.length;
  for (let i = 0; i < nr - 1; i++) {
    for (let j = 0; j < n; j++) {
      const j2 = (j + 1) % n;
      faces.push([i * n + j, i * n + j2, (i + 1) * n + j2, (i + 1) * n + j]);
    }
  }
  faces.push(Array.from({ length: n }, (_, j) => n - 1 - j));
  faces.push(Array.from({ length: n }, (_, j) => (nr - 1) * n + j));
  const m = MeshData.from(verts, faces);
  recalcNormals(m);
  m.shading = { mode: "smooth", angle: SMOOTH.turned };
  return m;
}
function bevel(m, amount = BEVEL.panel, segments = 2) {
  if (m.provenance?.kind === "box") {
    const nm = roundedBoxMesh(m.provenance.bounds, amount, segments);
    m.verts = nm.verts;
    m.faces = nm.faces;
    m.shading = nm.shading;
    m.provenance = null;
  } else if (m.provenance?.kind === "prism" && amount >= 5e-4) {
    const p = m.provenance;
    const nm = beveledPrismMesh(p.poly, p.z0, p.z1, amount, segments);
    m.verts = nm.verts;
    m.faces = nm.faces;
    m.shading = nm.shading;
    m.provenance = null;
  }
  return m;
}
function markBox(m, bounds) {
  m.provenance = { kind: "box", bounds };
  return m;
}
function markPrism(m, poly, z0, z1) {
  m.provenance = { kind: "prism", poly: poly.map((p) => [...p]), z0, z1 };
  return m;
}
function roundedBox(bounds, radius = BEVEL.panel, segments = 2) {
  return roundedBoxMesh(bounds, radius, segments);
}
function plate(cx, cy, w, d, z0, t, radius = BEVEL.panel, segments = 2) {
  return roundedBoxMesh([cx - w / 2, cy - d / 2, z0, cx + w / 2, cy + d / 2, z0 + t], radius, segments);
}
function hollowPrism(outerPoly, z0, z1, innerPoly, cavityZ, rimBevel = 0.012) {
  const n = outerPoly.length;
  if (innerPoly.length !== n) throw new Error("hollowPrism: outline vertex counts must match");
  const verts = [];
  const rings = [];
  const push = (poly, z) => rings.push(poly.map((p) => [p[0], p[1], z]));
  push(outerPoly, z0);
  push(outerPoly, z1 - rimBevel);
  push(insetPoly(outerPoly, rimBevel), z1);
  push(insetPoly(innerPoly, -rimBevel), z1);
  push(innerPoly, z1 - rimBevel);
  push(innerPoly, cavityZ + rimBevel);
  push(insetPoly(innerPoly, rimBevel), cavityZ);
  const nr = rings.length;
  for (const ring of rings) for (const p of ring) verts.push(p);
  const faces = [];
  for (let i = 0; i < nr - 1; i++) {
    for (let j = 0; j < n; j++) {
      const j2 = (j + 1) % n;
      faces.push([i * n + j, i * n + j2, (i + 1) * n + j2, (i + 1) * n + j]);
    }
  }
  faces.push(Array.from({ length: n }, (_, j) => n - 1 - j));
  faces.push(Array.from({ length: n }, (_, j) => (nr - 1) * n + j));
  const m = MeshData.from(verts, faces);
  recalcNormals(m);
  smoothShade(m, SMOOTH.turned);
  return m;
}
function annularPrism(outerPoly, innerPoly, z0, z1, bevelRadius = 0, bevelSegments = 1) {
  const n = outerPoly.length;
  if (innerPoly.length !== n) throw new Error("annularPrism: outline vertex counts must match");
  const radius = Math.max(0, Math.min(bevelRadius, (z1 - z0) / 2 - 1e-5));
  const segments = Math.max(1, bevelSegments);
  const levels = [];
  if (radius > 0) {
    for (let k = 0; k <= segments; k++) {
      const a = Math.PI / 2 * (k / segments);
      levels.push({ inset: radius * (1 - Math.sin(a)), z: z0 + radius * (1 - Math.cos(a)) });
    }
    for (let k = 0; k <= segments; k++) {
      const a = Math.PI / 2 * (k / segments);
      levels.push({ inset: radius * (1 - Math.cos(a)), z: z1 - radius * (1 - Math.sin(a)) });
    }
  } else {
    levels.push({ inset: 0, z: z0 }, { inset: 0, z: z1 });
  }
  const verts = [];
  for (const level of levels) {
    for (const [x, y] of insetPoly(outerPoly, level.inset)) verts.push([x, y, level.z]);
    for (const [x, y] of insetPoly(innerPoly, -level.inset)) verts.push([x, y, level.z]);
  }
  const faces = [];
  const stride = n * 2;
  for (let level = 0; level < levels.length - 1; level++) {
    const a = level * stride;
    const b = (level + 1) * stride;
    for (let j = 0; j < n; j++) {
      const j2 = (j + 1) % n;
      faces.push([a + j, a + j2, b + j2, b + j]);
      faces.push([a + n + j2, a + n + j, b + n + j, b + n + j2]);
    }
  }
  const bottom = 0;
  const top = (levels.length - 1) * stride;
  for (let j = 0; j < n; j++) {
    const j2 = (j + 1) % n;
    faces.push([bottom + j2, bottom + j, bottom + n + j, bottom + n + j2]);
    faces.push([top + j, top + j2, top + n + j2, top + n + j]);
  }
  const m = MeshData.from(verts, faces);
  recalcNormals(m);
  smoothShade(m, SMOOTH.turned);
  return m;
}
function aperturedPrism(outerPoly, innerPoly, z0, z1, outerBevel = 0, bevelSegments = 1) {
  const n = outerPoly.length;
  if (innerPoly.length !== n) throw new Error("aperturedPrism: outline vertex counts must match");
  const radius = Math.max(0, Math.min(outerBevel, (z1 - z0) / 2 - 1e-5));
  const segments = Math.max(1, bevelSegments);
  const outerLevels = [];
  if (radius > 0) {
    for (let k = 0; k <= segments; k++) {
      const a = Math.PI / 2 * (k / segments);
      outerLevels.push({ inset: radius * (1 - Math.sin(a)), z: z0 + radius * (1 - Math.cos(a)) });
    }
    for (let k = 0; k <= segments; k++) {
      const a = Math.PI / 2 * (k / segments);
      outerLevels.push({ inset: radius * (1 - Math.cos(a)), z: z1 - radius * (1 - Math.sin(a)) });
    }
  } else {
    outerLevels.push({ inset: 0, z: z0 }, { inset: 0, z: z1 });
  }
  const verts = [];
  for (const level of outerLevels) {
    for (const [x, y] of insetPoly(outerPoly, level.inset)) verts.push([x, y, level.z]);
  }
  const innerBottom = verts.length;
  for (const [x, y] of innerPoly) verts.push([x, y, z0]);
  const innerTop = verts.length;
  for (const [x, y] of innerPoly) verts.push([x, y, z1]);
  const faces = [];
  for (let level = 0; level < outerLevels.length - 1; level++) {
    const a = level * n;
    const b = (level + 1) * n;
    for (let j = 0; j < n; j++) {
      const j2 = (j + 1) % n;
      faces.push([a + j, a + j2, b + j2, b + j]);
    }
  }
  const outerBottom = 0;
  const outerTop = (outerLevels.length - 1) * n;
  for (let j = 0; j < n; j++) {
    const j2 = (j + 1) % n;
    faces.push([innerBottom + j2, innerBottom + j, innerTop + j, innerTop + j2]);
    faces.push([outerBottom + j2, outerBottom + j, innerBottom + j, innerBottom + j2]);
    faces.push([outerTop + j, outerTop + j2, innerTop + j2, innerTop + j]);
  }
  const m = MeshData.from(verts, faces);
  recalcNormals(m);
  if (radius > 0) smoothShade(m, SMOOTH.turned);
  return m;
}
function smoothShade(m, angle = SMOOTH.top) {
  m.shading = { mode: "smooth", angle };
  return m;
}
function flatShade(m) {
  m.shading = { mode: "flat" };
  return m;
}
function cleanMesh(m, dist = 2e-5) {
  if (!Number.isFinite(dist) || dist <= 0) throw new RangeError("cleanMesh: weld distance must be finite and greater than zero");
  const remap = new Array(m.verts.length);
  const grid = /* @__PURE__ */ new Map();
  const verts = [];
  const colors = m.colors ? [] : null;
  const key = (x, y, z) => `${x},${y},${z}`;
  const dist2 = dist * dist;
  for (let i = 0; i < m.verts.length; i++) {
    const v = m.verts[i];
    const gx = Math.floor(v[0] / dist);
    const gy = Math.floor(v[1] / dist);
    const gz = Math.floor(v[2] / dist);
    let idx;
    search: for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bucket = grid.get(key(gx + dx, gy + dy, gz + dz));
          if (!bucket) continue;
          for (const candidate of bucket) {
            const u = verts[candidate];
            const x = v[0] - u[0];
            const y = v[1] - u[1];
            const z = v[2] - u[2];
            if (x * x + y * y + z * z <= dist2) {
              idx = candidate;
              break search;
            }
          }
        }
      }
    }
    if (idx === void 0) {
      idx = verts.length;
      verts.push(v);
      if (colors && m.colors) colors.push(m.colors[i]);
      const own = key(gx, gy, gz);
      const bucket = grid.get(own);
      if (bucket) bucket.push(idx);
      else grid.set(own, [idx]);
    }
    remap[i] = idx;
  }
  const faces = [];
  const uvs = m.uvs ? [] : null;
  const faceMat = m.faceMat ? [] : null;
  m.faces.forEach((face, fi) => {
    const ff = [];
    const fuv = [];
    face.forEach((vi, c) => {
      const mi = remap[vi];
      if (!ff.includes(mi)) {
        ff.push(mi);
        const src = m.uvs?.[fi];
        if (src) fuv.push(src[c]);
      }
    });
    if (ff.length < 3) return;
    if (len(faceNormal(verts, ff)) < 1e-12) return;
    faces.push(ff);
    if (uvs) uvs.push(m.uvs?.[fi] ? fuv : null);
    if (faceMat && m.faceMat) faceMat.push(m.faceMat[fi]);
  });
  m.verts = verts;
  m.faces = faces;
  m.uvs = uvs;
  m.colors = colors;
  m.faceMat = faceMat;
  m.provenance = null;
  return m;
}
function toYUp(m) {
  if (m.frame === "y-up") return m;
  for (const v of m.verts) {
    const y = v[1];
    v[1] = v[2];
    v[2] = y;
  }
  for (let i = 0; i < m.faces.length; i++) {
    m.faces[i].reverse();
    if (m.uvs?.[i]) m.uvs[i].reverse();
  }
  m.frame = "y-up";
  m.provenance = null;
  return m;
}
function toTriangles(m, uvScale = 1) {
  const fNormals = m.faces.map((f) => norm(faceNormal(m.verts, f)));
  const smooth = m.shading.mode === "smooth";
  const cosLimit = smooth ? Math.cos(m.shading.angle * Math.PI / 180) : 2;
  const vFaces = Array.from({ length: m.verts.length }, () => []);
  if (smooth) {
    m.faces.forEach((f, fi) => {
      for (const vi of f) vFaces[vi].push(fi);
    });
  }
  const cornerNormal = (vi, fi) => {
    if (!smooth) return fNormals[fi];
    const fn = fNormals[fi];
    let nx = 0;
    let ny = 0;
    let nz = 0;
    for (const ofi of vFaces[vi]) {
      const on = fNormals[ofi];
      if (dot(fn, on) >= cosLimit - 1e-9) {
        nx += on[0];
        ny += on[1];
        nz += on[2];
      }
    }
    const l = Math.hypot(nx, ny, nz);
    if (l < 1e-9) return fn;
    return [nx / l, ny / l, nz / l];
  };
  const flip = m.frame === "z-up";
  const positions = [];
  const normals = [];
  const uvs = [];
  const cols = m.colors ? [] : null;
  const triMat = m.faceMat ? [] : null;
  const hasUv = !!m.uvs;
  m.faces.forEach((f, fi) => {
    const tris = triangulateFace(m.verts, f);
    const uvFace = hasUv ? m.uvs[fi] : null;
    const fn = fNormals[fi];
    const wn = flip ? [fn[0], fn[2], fn[1]] : fn;
    const ax = Math.abs(wn[0]);
    const ay = Math.abs(wn[1]);
    const az = Math.abs(wn[2]);
    const dominant = ay >= ax && ay >= az ? 1 : ax >= az ? 0 : 2;
    for (const t of tris) {
      const order = flip ? [t[2], t[1], t[0]] : t;
      for (const ci of order) {
        const vi = f[ci];
        const p = m.verts[vi];
        const n = cornerNormal(vi, fi);
        const px = p[0];
        const py = flip ? p[2] : p[1];
        const pz = flip ? p[1] : p[2];
        positions.push(px, py, pz);
        normals.push(n[0], flip ? n[2] : n[1], flip ? n[1] : n[2]);
        if (uvFace) uvs.push(uvFace[ci][0], uvFace[ci][1]);
        else if (dominant === 1) uvs.push(px * uvScale, pz * uvScale);
        else if (dominant === 0) uvs.push(pz * uvScale, py * uvScale);
        else uvs.push(px * uvScale, py * uvScale);
        if (cols && m.colors) {
          const c = m.colors[vi];
          cols.push(c[0], c[1], c[2]);
        }
      }
      if (triMat && m.faceMat) triMat.push(m.faceMat[fi]);
    }
  });
  return { positions, normals, uvs, colors: cols, triMat };
}
function toGeometry(m, uvScale = 1) {
  const soup = toTriangles(m, uvScale);
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(soup.positions), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(soup.normals), 3));
  g.setAttribute("uv", new BufferAttribute(new Float32Array(soup.uvs), 2));
  if (soup.colors) {
    g.setAttribute(m.colorName || "color", new BufferAttribute(new Float32Array(soup.colors), 3));
  }
  if (soup.triMat?.length) {
    let startTriangle = 0;
    let materialIndex = soup.triMat[0];
    for (let triangle = 1; triangle <= soup.triMat.length; triangle++) {
      const next = soup.triMat[triangle];
      if (triangle < soup.triMat.length && next === materialIndex) continue;
      g.addGroup(startTriangle * 3, (triangle - startTriangle) * 3, materialIndex);
      startTriangle = triangle;
      materialIndex = next;
    }
  }
  return g;
}
function slotList(parts) {
  const out = [];
  for (const [slot, value] of Object.entries(parts)) {
    if (!value) continue;
    const list = Array.isArray(value) ? value.filter((m) => !!m) : [value];
    if (list.length) out.push([slot, list]);
  }
  return out;
}
function writeInto(writer, slot, part, opts = {}) {
  const m = opts.clean === false ? part : cleanMesh(part);
  const soup = toTriangles(m, opts.uvScale ?? 1);
  if (soup.positions.length === 0) return;
  writer.raw(slot, soup.positions, soup.normals, soup.uvs);
}
function writeAll(writer, parts, opts = {}) {
  for (const [slot, list] of slotList(parts)) {
    for (const part of list) writeInto(writer, slot, part, opts);
  }
}
function buildGroup(parts, materials, opts = {}) {
  const group = new Group();
  if (opts.name) group.name = opts.name;
  for (const [slot, list] of slotList(parts)) {
    const material = materials[slot];
    if (!material) throw new Error(`meshdata: no material bound for slot "${slot}"`);
    const positions = [];
    const normals = [];
    const uvs = [];
    const anyColors = list.some((part) => !!part.colors);
    const colorNames = new Set(list.filter((part) => part.colors).map((part) => part.colorName || "color"));
    if (colorNames.size > 1) throw new Error(`meshdata: slot "${slot}" uses conflicting color attribute names: ${[...colorNames].join(", ")}`);
    const colors = anyColors ? [] : null;
    for (const part of list) {
      const m = opts.clean === false ? part : cleanMesh(part);
      const soup = toTriangles(m, opts.uvScale ?? 1);
      for (const v of soup.positions) positions.push(v);
      for (const v of soup.normals) normals.push(v);
      for (const v of soup.uvs) uvs.push(v);
      if (colors) {
        if (soup.colors) for (const value of soup.colors) colors.push(value);
        else for (let i = 0; i < soup.positions.length; i += 3) colors.push(1, 1, 1);
      }
    }
    if (positions.length === 0) continue;
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
    geometry.setAttribute("normal", new BufferAttribute(new Float32Array(normals), 3));
    geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
    if (colors) geometry.setAttribute([...colorNames][0] ?? "color", new BufferAttribute(new Float32Array(colors), 3));
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = opts.castShadow ?? true;
    mesh.receiveShadow = opts.receiveShadow ?? true;
    mesh.name = `part:${slot}`;
    group.add(mesh);
  }
  return group;
}
export {
  BEVEL,
  GAP_MIN,
  MeshData,
  PROUD_MIN,
  REVEAL_MAX,
  REVEAL_MIN,
  SMOOTH,
  TAU,
  annularPrism,
  aperturedPrism,
  arcPts,
  bevel,
  beveledPrismMesh,
  bez,
  box,
  buildGroup,
  ccw,
  chamferRect,
  circle,
  cleanMesh,
  densify,
  faceNormal,
  flatShade,
  hollowPrism,
  insetPoly,
  join,
  loft,
  markBox,
  markPrism,
  meshObj,
  offsetPolyline,
  panelWithHoles,
  placeYaw,
  plate,
  polyArea,
  polyOffset,
  prism,
  prismXZ,
  prismYZ,
  recalcNormals,
  revolve,
  rotX,
  rotY,
  rotateZ,
  roundedBox,
  roundedBoxMesh,
  roundedRect,
  runMolding,
  scaleMesh,
  smoothAngleForSegments,
  smoothShade,
  solidify,
  subsurf,
  sweepPlanarLoop,
  sweepRectFrame,
  toGeometry,
  toTriangles,
  toYUp,
  transform4,
  translate,
  tubeAlong,
  wallRun,
  writeAll,
  writeInto
};
