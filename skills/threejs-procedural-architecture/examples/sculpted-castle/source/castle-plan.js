// Massing plan for a complete multi-tier sculpted keep with recessed vaulted gates,
// stepped arcaded storeys, dodecagonal crown rotunda with lantern dome, and companion domed rotunda.
// Pure data with no Three.js imports. Footprint centered at (0, 0) with base grounded at y = 0.

const LENS = { f: 2800, cx: 484.5, hy: 1400, h: 4.9, d0: 109.8 };
const BASE_Y = 68.26;
const CENTER_Z = (LENS.d0 - 488) - 48; // -426.2 m shifted to 0

const X = (xp, d) => ((xp - LENS.cx) * d) / LENS.f;
const Y = (yp, d) => LENS.h + ((LENS.hy - yp) * d) / LENS.f - BASE_Y;
const Z = (d) => LENS.d0 - d - CENTER_Z;

const rect = (x0, x1, zFront, depth) => [
  [x0, zFront],
  [x1, zFront],
  [x1, zFront - depth],
  [x0, zFront - depth],
];

const ngon = (cx, cz, R, n, rot = 0) => {
  const p = [];
  for (let k = 0; k < n; k++) {
    const a = ((rot + (k * 360) / n) * Math.PI) / 180;
    p.push([cx + R * Math.sin(a), cz + R * Math.cos(a)]);
  }
  return p;
};

export const CASTLE_GATE = Object.freeze({
  frontZ: Z(488),
  backZ: Z(488) - 96,
  glowZ: Z(488) - 98,
  tunnelCenterY: 84 - BASE_Y,
  tunnelTopY: 116 - BASE_Y,
  halfOpen: 6.35,
});

export function buildCastlePlan() {
  const items = [];
  let chunk = "keep0";
  const ck = (id) => {
    chunk = id;
  };
  const tier = (id, poly, y0, y1, faces = [], o = {}) => {
    items.push({ t: "tier", chunk, id, poly, y0, y1, faces, ...o });
  };
  const dome = (id, x, z, y, R, top, tip, o = {}) => {
    items.push({ t: "dome", chunk, id, x, z, y, R, top, tip, ...o });
  };
  const rep = (n, f) => Array.from({ length: n }, (_, i) => (typeof f === "function" ? f(i) : f));

  // Base keep with front/back colossal vaulted gate portals and six-bay flanking facades.
  ck("keep0");
  const d = 488;
  const y0 = 0;
  const y1 = Y(806, d);
  const side0 = { n: 6, maxD: 12 };
  tier(
    "keep0",
    rect(-46, 46, Z(d), 96),
    y0,
    y1,
    [
      { kind: "gate", depth: 89.5, half: 16.5, flankBays: 2, halfOpen: CASTLE_GATE.halfOpen },
      side0,
      {
        kind: "gate",
        depth: 6.5,
        half: 13,
        k: 3,
        Ro: 10.4,
        hs: y1 - 2.6 - y0 - 1.0 - 14.4,
        flankBays: 3,
        halfOpen: CASTLE_GATE.halfOpen,
      },
      side0,
    ],
    { bal: { scale: 1.5, turretEvery: 2 } },
  );

  // Stepped mid-keep storeys with asymmetric principal bays and upper arcaded gallery.
  ck("keep1");
  const d1 = 494;
  const t1 = Y(683, d1);
  tier(
    "keep1",
    rect(-46, 41, Z(d1), 88),
    y1,
    t1,
    [
      {
        bays: [6, 5.6, 9.7, 12.9, 10.6, 7.1, 6],
        piers: [2.4, 2.25, 1.2, 0.95, 2.65, 2.4],
        corner: 7.1,
        apex: Y(703, d1),
        imp: Y(735, d1),
        maxD: 20,
      },
      { n: 5, maxD: 14 },
      { n: 7, maxD: 14 },
      { n: 5, maxD: 14 },
    ],
    { bal: { scale: 1.4, turretEvery: 2 } },
  );

  const d2 = 498;
  const t2 = Y(640, d2);
  const s2 = { n: 9, pier: 0.5, maxD: 6 };
  tier(
    "keep2",
    rect(-45, 39, Z(d2), 82),
    t1,
    t2,
    [{ n: 15, pier: 0.5, maxD: 6 }, s2, { n: 15, pier: 0.5, maxD: 6 }, s2],
    { bal: { scale: 1.4, turretEvery: 2 } },
  );

  // Twelve-sided upper rotunda stepping inward to the ribbed lantern dome.
  const dM = 536;
  const mx = X(452, dM);
  const mz = Z(dM);
  const bal12 = (s) => ({ scale: s, cornerKind: "turret", midKind: "spike" });

  ck("keep3");
  const gTop = Y(503, 501);
  tier(
    "great",
    ngon(mx, mz, 36, 12, 15),
    t2,
    gTop,
    rep(12, { n: 1, open: 0.9, pier: 0.3, apex: Y(521, 501), imp: Y(578, 501), maxD: 13 }),
    { bal: bal12(1.5) },
  );

  ck("keep4");
  const r1 = Y(474, 512);
  const r2 = Y(445, 516);
  tier("row1", ngon(mx, mz, 23, 12, 15), gTop, r1, rep(12, { n: 4, maxD: 4, pier: 0.3 }), { bal: bal12(1.2) });
  tier("row2", ngon(mx, mz, 18.6, 12, 15), r1, r2, rep(12, { n: 3, maxD: 4, pier: 0.3 }), { bal: bal12(1.1) });

  ck("crown");
  const ringY = Y(383, dM);
  tier(
    "crownDrum",
    ngon(mx, mz, 13.4, 12, 15),
    r2,
    ringY - 0.9,
    rep(12, { n: 1, open: 0.9, maxD: 4.5, pier: 0.16, orders: 3 }),
    { bal: false, he: 1.0 },
  );
  dome("crownDome", mx, mz, ringY, 12.2, Y(349, dM), Y(235, dM), { lantern: Y(325, dM) });

  // Companion rotunda on the front-left shoulder, grounded down to keep1 via its carved substructure.
  const dq = 512;
  const qx = X(332, dq);
  const qz = Z(dq);
  const qTop = Y(497, 497);
  const qr = Y(385, dq);
  const compPoly = ngon(qx, qz, 19, 8, 22.5);

  tier(
    "compBody",
    compPoly,
    t2,
    qTop,
    rep(8, { n: 1, open: 0.9, pier: 0.3, apex: Y(507, 497), imp: Y(566, 497), maxD: 8 }),
    { bal: bal12(1.4) },
  );
  tier("compRow", ngon(qx, qz, 15.6, 12, 15), qTop, Y(454, 500), rep(12, { n: 2, maxD: 3.5, pier: 0.3 }), {
    bal: bal12(1.1),
  });
  tier(
    "compDrum",
    ngon(qx, qz, 12.4, 12, 15),
    Y(454, 500),
    qr - 0.9,
    rep(12, { n: 1, open: 0.9, maxD: 4, pier: 0.16, orders: 3 }),
    { bal: false, he: 1.0 },
  );
  dome("compDome", qx, qz, qr, 11.3, Y(353, dq), Y(318, dq));

  // Carved plinth grounding compBody cleanly onto keep1 where it steps beyond keep2.
  tier("compBodyF", compPoly, t1 - 1.5, t2, compPoly.map(() => ({ blank: true })), {
    bal: false,
    cap: false,
    he: 0.3,
    pl: 0.4,
    found: true,
  });

  return items;
}
