// Pure procedural WebGPU/TSL architectural materials:
// baked tileable carved-relief height fields, derivative relief bump with pixel-footprint LOD fade,
// specular AA, enclosure warm bounce, wrapped scattering, glazed fish-scale dome tiles, and gilding.
import * as THREE from "three/webgpu";
import {
  attribute,
  color,
  mix,
  float,
  vec2,
  vec3,
  floor,
  fract,
  mod,
  sin,
  length,
  smoothstep,
  saturate,
  max,
  mx_fractal_noise_float,
  positionWorld,
  positionView,
  normalView,
  normalWorld,
  texture,
  varying,
  abs,
  normalize,
  sign,
  step,
  dot,
  cross,
  dFdx,
  dFdy,
  uniform,
} from "three/tsl";

export const DEFAULT_SUN_DIR = Object.freeze(new THREE.Vector3(0.63, 0.69, 0.35).normalize());
export const SUN_RADIANCE = 1.0;

/** Tileable carved-relief height fields. R: quatrefoil lace diaper (2×2 cells); G: running scroll band. */
export function bakeCarveTexture(N = 512) {
  const d = new Uint8Array(N * N * 4);
  const rg = (x, w) => {
    const t = Math.max(0, 1 - Math.abs(x) / w);
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const u = (x + 0.5) / N;
      const v = (y + 0.5) / N;
      const px = ((u * 2) % 1) - 0.5;
      const py = ((v * 2) % 1) - 0.5;
      const r = Math.hypot(px, py);
      const th = Math.atan2(py, px);
      let h = Math.max(
        rg(r - 0.43, 0.035),
        rg(r - 0.30 * (0.62 + 0.38 * Math.abs(Math.cos(2 * th))), 0.04),
        rg(r - 0.12 * (0.7 + 0.3 * Math.cos(8 * th)), 0.03),
        r < 0.045 ? 1 : 0,
      );
      const qx = 0.5 - Math.abs(px);
      const qy = 0.5 - Math.abs(py);
      const rc = Math.hypot(qx, qy);
      const tc = Math.atan2(qy, qx);
      h = Math.max(h, rg(rc - 0.17 * (0.6 + 0.4 * Math.cos(4 * tc)), 0.035), rg(Math.min(qx, qy), 0.03) * 0.9);

      const bu = (u * 2) % 1;
      const yc = 0.5 + 0.2 * Math.sin(2 * Math.PI * bu);
      let g = Math.max(rg(v - yc, 0.05), rg(v - 0.06, 0.06), rg(v - 0.94, 0.06));
      for (const [cx, cy] of [[0.25, 0.72], [0.75, 0.28]]) {
        const r2 = Math.hypot(bu - cx, v - cy);
        const t2 = Math.atan2(v - cy, bu - cx);
        g = Math.max(g, rg(r2 - 0.15, 0.035), rg(r2 - 0.08 * (0.65 + 0.35 * Math.cos(5 * t2)), 0.03));
      }
      const o = (x + y * N) * 4;
      d[o] = h * 255;
      d[o + 1] = g * 255;
      d[o + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function createCastleMaterials({ aoNode = null, sunDir = DEFAULT_SUN_DIR } = {}) {
  const carveTexture = bakeCarveTexture(512);
  const uMode = uniform(0); // 0 = final, 1 = single-sided clay, 2 = recess-tint & relief map

  const n = normalWorld;
  const baseNormal = normalView;

  // Pure procedural glazed ivory body: subtle stone/glaze variation with micro-ripple roughness.
  const macroGrain = mx_fractal_noise_float(positionWorld.mul(0.22), 3, 2.0, 0.5).mul(0.5).add(0.5);
  const fineGrain = mx_fractal_noise_float(positionWorld.mul(2.1), 3, 2.1, 0.5).mul(0.5).add(0.5);
  const albedo = mix(vec3(0.925, 0.915, 0.895), vec3(0.975, 0.97, 0.955), macroGrain.mul(0.65).add(fineGrain.mul(0.35)));
  const baseRough = mix(float(0.14), float(0.23), fineGrain.mul(0.7).add(macroGrain.mul(0.3)));

  const tint = varying(attribute("tint", "float"));
  const cv = varying(attribute("carve", "vec3"));
  const on = step(0.5, cv.z);
  const isBand = step(1.5, cv.z);
  const reliefAt = (uv) => mix(texture(carveTexture, uv.mul(0.5)).r, texture(carveTexture, uv).g, isBand).mul(on);
  const relief = reliefAt(cv.xy);

  // Fade derivative bump out before relief exceeds the pixel grid so fine carving falls back to the mip chain.
  const fw = max(length(dFdx(cv.xy)), length(dFdy(cv.xy)));
  const reliefLOD = smoothstep(0.30, 0.08, fw);
  const e = max(fw.mul(0.75), 1 / 512);
  const K = float(0.016).mul(reliefLOD);
  const hu = reliefAt(cv.xy.add(vec2(e, 0))).sub(reliefAt(cv.xy.sub(vec2(e, 0)))).div(e.mul(2));
  const hv = reliefAt(cv.xy.add(vec2(0, e))).sub(reliefAt(cv.xy.sub(vec2(0, e)))).div(e.mul(2));
  const dhx = hu.mul(dFdx(cv.x)).add(hv.mul(dFdx(cv.y))).mul(K);
  const dhy = hu.mul(dFdy(cv.x)).add(hv.mul(dFdy(cv.y))).mul(K);
  const sx = dFdx(positionView);
  const sy = dFdy(positionView);
  const r1 = cross(sy, baseNormal);
  const r2 = cross(baseNormal, sx);
  const det = dot(sx, r1);
  const carvedNormal = normalize(baseNormal.mul(abs(det)).sub(sign(det).mul(dhx.mul(r1).add(dhy.mul(r2)))));

  // Specular anti-aliasing from screen-space normal variance.
  const nv = dFdx(carvedNormal);
  const nw = dFdy(carvedNormal);
  const variance = dot(nv, nv).add(dot(nw, nw)).mul(0.5).min(0.25);
  const aa = (r) => r.mul(r).add(variance).sqrt().clamp(0.11, 1);

  // Enclosure warm bounce light inside multi-order recesses and vaults.
  const occl = aoNode ? aoNode.oneMinus() : float(0);
  const depthIn = tint.mul(tint).mul(float(3).sub(tint.mul(2)));
  const enclosure = depthIn.mul(0.85).add(occl.pow(1.5).mul(0.38)).min(1);
  const BOUNCE1 = vec3(1.0, 0.66, 0.28);
  const BOUNCE2 = vec3(1.0, 0.48, 0.12);
  const fall = enclosure.mul(enclosure.oneMinus().pow(1.4)).mul(3.2).add(enclosure.mul(0.07));
  const bounce = mix(BOUNCE1, BOUNCE2, enclosure).mul(fall).mul(SUN_RADIANCE * 0.50);

  // Wrapped subsurface scattering for warm luminous ivory shadow sides.
  const L = vec3(sunDir.x, sunDir.y, sunDir.z);
  const ndl = dot(n, L);
  const SUN_E = 2.04;
  const wrap = (w) => saturate(ndl.add(w).div(1 + w));
  const carried = wrap(0.75).pow(1.6).sub(saturate(ndl)).max(0);
  const openness = aoNode ? aoNode.mul(0.75).add(0.25) : float(1);
  const sss = vec3(1.0, 0.70, 0.42)
    .mul(carried)
    .mul(SUN_E * 0.34)
    .mul(openness)
    .add(vec3(1.0, 0.62, 0.30).mul(0.075).mul(openness));

  // Mode masks: 0 = final, 1 = clay, 2 = recess-tint & relief diagnostic.
  const isClay = step(0.5, uMode).mul(step(uMode, 1.5));
  const isRecess = step(1.5, uMode);
  const isFinal = float(1).sub(step(0.5, uMode));

  const clayColor = vec3(0.78, 0.76, 0.73);
  const recessVis = mix(
    mix(vec3(0.16, 0.36, 0.72), vec3(0.95, 0.48, 0.12), tint),
    mix(vec3(0.24, 0.80, 0.55), vec3(0.96, 0.85, 0.25), isBand),
    on.mul(relief.mul(0.65).add(0.35)),
  );

  const mk = () => {
    const m = new THREE.MeshPhysicalNodeMaterial();
    m.normalNode = carvedNormal;
    m.metalnessNode = float(0);
    m.iorNode = float(1.5);
    return m;
  };

  // Sculpted stone masonry, columns, archivolts, and carved panels.
  const stone = mk();
  const stoneFinalColor = albedo
    .mul(mix(vec3(1), vec3(1.0, 0.82, 0.54), enclosure.mul(0.8)))
    .mul(mix(vec3(1), vec3(0.52, 0.34, 0.17), depthIn.pow(1.5).mul(0.92)));
  const stoneFinalEmissive = albedo.mul(bounce.add(sss.mul(depthIn.mul(0.75).oneMinus())));

  stone.colorNode = mix(mix(stoneFinalColor, clayColor, isClay), recessVis.mul(0.15), isRecess);
  stone.roughnessNode = mix(aa(baseRough), float(0.82), step(0.5, uMode));
  stone.emissiveNode = stoneFinalEmissive.mul(isFinal).add(recessVis.mul(0.85).mul(isRecess));

  // Ribbed domes and turret roofs: procedural fish-scale slate-blue ceramic glaze.
  const roof = mk();
  {
    const isT = step(2.5, cv.z);
    const row = floor(cv.y);
    const su = cv.x.add(mod(row, 2).mul(0.5));
    const cell = floor(su);
    const fu = fract(su).sub(0.5);
    const fv = fract(cv.y);
    const rr = length(vec2(fu.mul(2), fv.oneMinus().mul(1.15)));
    const tongue = smoothstep(1.0, 0.72, rr);
    const lap = smoothstep(0.0, 0.16, fv);
    const hT = tongue.mul(mix(float(0.55), float(1), fv.oneMinus())).mul(lap).mul(isT);
    const rnd = fract(sin(cell.mul(12.9898).add(row.mul(78.233))).mul(43758.5453));
    const mott = mx_fractal_noise_float(positionWorld.mul(1.7), 3, 2.1, 0.5).mul(0.5).add(0.5);
    const hr = hT.mul(0.022);
    const q1 = cross(sy, baseNormal);
    const q2 = cross(baseNormal, sx);
    const dt = dot(sx, q1);
    roof.normalNode = normalize(baseNormal.mul(abs(dt)).sub(sign(dt).mul(dFdx(hr).mul(q1).add(dFdy(hr).mul(q2)))));
    const glaze = mix(vec3(0.50, 0.585, 0.76), vec3(0.64, 0.715, 0.86), rnd.mul(0.6).add(mott.mul(0.55)).clamp(0, 1));
    const roofFinalColor = albedo.mul(glaze).mul(mix(float(1), hT.mul(0.3).add(0.7), isT));
    const roofVis = mix(vec3(0.22, 0.45, 0.85), vec3(0.65, 0.85, 1.0), hT);
    roof.colorNode = mix(mix(roofFinalColor, clayColor.mul(0.92), isClay), roofVis.mul(0.15), isRecess);
    roof.roughnessNode = mix(aa(baseRough.add(mix(float(0.02), float(0.12), rnd))), float(0.82), step(0.5, uMode));
    roof.emissiveNode = roofVis.mul(0.85).mul(isRecess);
  }

  // Deep recessed door/window back panels.
  const glass = mk();
  glass.colorNode = mix(mix(albedo.mul(vec3(0.34, 0.33, 0.36)), clayColor.mul(0.78), isClay), vec3(0.08, 0.08, 0.14), isRecess);
  glass.roughnessNode = mix(float(0.6), float(0.85), step(0.5, uMode));
  glass.emissiveNode = albedo.mul(BOUNCE2).mul(SUN_RADIANCE * 0.10).mul(isFinal).add(vec3(0.55, 0.15, 0.65).mul(0.7).mul(isRecess));

  // Gate tunnel floor paving.
  const floorMat = mk();
  floorMat.colorNode = mix(mix(albedo.mul(vec3(0.92, 0.895, 0.87)), clayColor, isClay), recessVis.mul(0.15), isRecess);
  floorMat.roughnessNode = mix(aa(baseRough.add(0.03)), float(0.82), step(0.5, uMode));
  floorMat.emissiveNode = albedo
    .mul(vec3(0.075, 0.095, 0.15).mul(openness))
    .mul(isFinal)
    .add(recessVis.mul(0.85).mul(isRecess));

  // Gilded springing rings, arch bands, spires, and finials.
  const gold = new THREE.MeshStandardNodeMaterial();
  gold.colorNode = mix(mix(color(0xf5c469), clayColor.mul(0.96), isClay), vec3(0.95, 0.78, 0.18).mul(0.2), isRecess);
  gold.roughnessNode = mix(float(0.30), float(0.82), step(0.5, uMode));
  gold.metalnessNode = mix(float(1), float(0), step(0.5, uMode));
  gold.emissiveNode = vec3(1.0, 0.82, 0.25).mul(0.8).mul(isRecess);

  const slots = { stone, gold, roof, glass, floor: floorMat };
  return {
    slots,
    uMode,
    carveTexture,
    dispose() {
      carveTexture.dispose();
      for (const m of Object.values(slots)) m.dispose();
    },
  };
}
