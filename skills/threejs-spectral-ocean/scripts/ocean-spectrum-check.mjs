#!/usr/bin/env node
// ocean-spectrum-check.mjs: dependency-free CPU physics validator for FFT ocean cascades.
// Use to plan disjoint cascades, verify JONSWAP + directional spreading + Hermitian symmetry +
// Parseval energy conservation, compare resolved slope variance against Cox-Munk, and validate
// GPU inverse FFT height/slope statistics before tuning shading.
//
// Run: node ocean-spectrum-check.mjs [windSpeed=8] [fetchKm=200]
//      node ocean-spectrum-check.mjs --self-test
const g = 9.81;

// Cap dimensionless fetch where JONSWAP reaches full development (Pierson-Moskowitz)
const X_FULL = 2.17e4;

export function jonswap(omega, { U = 8, fetch = 200e3, gamma = 3.3 } = {}) {
  const X = Math.min((g * fetch) / (U * U), X_FULL);
  const alpha = 0.076 * Math.pow(X, -0.22);
  const wp = 22 * (g / U) * Math.pow(X, -0.33);
  if (omega <= 0) return 0;
  const sigma = omega <= wp ? 0.07 : 0.09;
  const r = Math.exp(-((omega - wp) ** 2) / (2 * sigma * sigma * wp * wp));
  return ((alpha * g * g) / omega ** 5) * Math.exp(-1.25 * (wp / omega) ** 4) * Math.pow(gamma, r);
}

const dispersion = (k, depth = 1e4) => Math.sqrt(g * k * Math.tanh(Math.min(k * depth, 20)));

function lgamma(x) {
  const c = [
    76.18009172947146,
    -86.50532032941677,
    24.01409824083091,
    -1.231739572450155,
    0.1208650973866179e-2,
    -0.5395239384953e-5,
  ];
  let y = x;
  let t = x + 5.5;
  t -= (x + 0.5) * Math.log(t);
  let s = 1.000000000190015;
  for (const ci of c) s += ci / ++y;
  return -t + Math.log((2.5066282746310005 * s) / x);
}

function spreading(theta, omega, wp, windDir = 0) {
  const sMax = 10;
  const s = Math.max(1, omega <= wp ? sMax * Math.pow(omega / wp, 5) : sMax * Math.pow(omega / wp, -2.5));
  const c = Math.cos((theta - windDir) / 2);
  const norm =
    ((Math.exp(lgamma(s + 1)) ** 2) / (2 * Math.PI * Math.exp(lgamma(2 * s + 1)))) * Math.pow(2, 2 * s);
  return norm * Math.pow(Math.abs(c), 2 * s);
}

let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) + 0.5) / 4294967296;
const gauss = () => Math.sqrt(-2 * Math.log(rnd())) * Math.cos(2 * Math.PI * rnd());

export function makeCascade({ N = 64, L = 250, kMin = 0, kMax = Infinity, U = 8, fetch = 200e3, windDir = 0 } = {}) {
  const X = Math.min((g * fetch) / (U * U), X_FULL);
  const wp = 22 * (g / U) * Math.pow(X, -0.33);
  const dk = (2 * Math.PI) / L;
  const h0 = new Float64Array(N * N * 2);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const kx = (i < N / 2 ? i : i - N) * dk;
      const kz = (j < N / 2 ? j : j - N) * dk;
      const k = Math.hypot(kx, kz);
      if (k === 0 || k < kMin || k >= kMax) continue;
      const w = dispersion(k);
      const dwdk = (g * 0.5) / w;
      const theta = Math.atan2(kz, kx);
      const S = (jonswap(w, { U, fetch }) * spreading(theta, w, wp, windDir) * dwdk) / k;
      const amp = Math.sqrt((S * dk * dk) / 4);
      h0[(j * N + i) * 2] = gauss() * amp;
      h0[(j * N + i) * 2 + 1] = gauss() * amp;
    }
  }
  return { N, L, dk, h0, kMin, kMax };
}

function fft1d(re, im, inverse) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = ((inverse ? 2 : -2) * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k];
        const ai = im[i + k];
        const br = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const bi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ar + br;
        im[i + k] = ai + bi;
        re[i + k + len / 2] = ar - br;
        im[i + k + len / 2] = ai - bi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
}

function ifft2(re, im, N) {
  const r = new Float64Array(N);
  const i = new Float64Array(N);
  for (let row = 0; row < N; row++) {
    for (let x = 0; x < N; x++) {
      r[x] = re[row * N + x];
      i[x] = im[row * N + x];
    }
    fft1d(r, i, true);
    for (let x = 0; x < N; x++) {
      re[row * N + x] = r[x];
      im[row * N + x] = i[x];
    }
  }
  for (let col = 0; col < N; col++) {
    for (let y = 0; y < N; y++) {
      r[y] = re[y * N + col];
      i[y] = im[y * N + col];
    }
    fft1d(r, i, true);
    for (let y = 0; y < N; y++) {
      re[y * N + col] = r[y];
      im[y * N + col] = i[y];
    }
  }
}

export function evaluate(c, t = 0) {
  const { N, dk, h0 } = c;
  const n2 = N * N;
  const hr = new Float64Array(n2);
  const hi = new Float64Array(n2);
  const sxr = new Float64Array(n2);
  const sxi = new Float64Array(n2);
  const szr = new Float64Array(n2);
  const szi = new Float64Array(n2);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const kx = (i < N / 2 ? i : i - N) * dk;
      const kz = (j < N / 2 ? j : j - N) * dk;
      const k = Math.hypot(kx, kz);
      if (k === 0) continue;
      const mi = (N - i) % N;
      const mj = (N - j) % N;
      const w = dispersion(k);
      const co = Math.cos(w * t);
      const si = Math.sin(w * t);
      const ar = h0[(j * N + i) * 2];
      const ai = h0[(j * N + i) * 2 + 1];
      const br = h0[(mj * N + mi) * 2];
      const bi = -h0[(mj * N + mi) * 2 + 1];
      const r = ar * co - ai * si + (br * co + bi * si);
      const im = ar * si + ai * co + (bi * co - br * si);
      const idx = j * N + i;
      hr[idx] = r;
      hi[idx] = im;
      sxr[idx] = -kx * im;
      sxi[idx] = kx * r;
      szr[idx] = -kz * im;
      szi[idx] = kz * r;
    }
  }
  let spectralVariance = 0;
  for (let q = 0; q < n2; q++) spectralVariance += hr[q] * hr[q] + hi[q] * hi[q];
  ifft2(hr, hi, N);
  ifft2(sxr, sxi, N);
  ifft2(szr, szi, N);
  return { height: hr, heightImag: hi, slopeX: sxr, slopeZ: szr, spectralVariance };
}

export function stats(c, f) {
  const n = f.height.length;
  let m = 0;
  let v = 0;
  let s = 0;
  let imMax = 0;
  for (let i = 0; i < n; i++) m += f.height[i];
  m /= n;
  for (let i = 0; i < n; i++) {
    v += (f.height[i] - m) ** 2;
    s += f.slopeX[i] ** 2 + f.slopeZ[i] ** 2;
    imMax = Math.max(imMax, Math.abs(f.heightImag[i]));
  }
  return { variance: v / n, Hs: 4 * Math.sqrt(v / n), mss: s / n, imagMax: imMax, spectralVariance: f.spectralVariance };
}

export const coxMunkMss = (U) => 0.003 + 0.00512 * U;

export function defaultCascades({ U = 8, fetch = 200e3, N = 256 } = {}) {
  const Ls = [233, 41, 7.3];
  const out = [];
  for (let c = 0; c < Ls.length; c++) {
    const kMin = c === 0 ? 0 : (Math.PI * 2) / Ls[c];
    const kMax = c === Ls.length - 1 ? (Math.PI * N) / Ls[c] : (Math.PI * 2) / Ls[c + 1];
    out.push(makeCascade({ N, L: Ls[c], kMin, kMax, U, fetch }));
  }
  return out;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  if (process.argv[2] === "--self-test") {
    let failed = 0;
    const check = (n, cond, info = "") => {
      console.log(`${cond ? "ok  " : "FAIL"} ${n} ${info}`);
      if (!cond) failed++;
    };
    const c = makeCascade({ N: 64, L: 200, U: 10, fetch: 500e3 });
    const f = evaluate(c, 3.7);
    const s = stats(c, f);
    check(
      "height field is real (Hermitian spectrum)",
      s.imagMax < 1e-9 * Math.max(1, Math.sqrt(s.variance)),
      `max imag ${s.imagMax.toExponential(2)}`,
    );
    check(
      "Parseval: field variance equals spectral variance",
      Math.abs(s.variance - s.spectralVariance) / s.spectralVariance < 1e-6,
      `${s.variance.toFixed(5)} vs ${s.spectralVariance.toFixed(5)}`,
    );
    const big = makeCascade({ N: 128, L: 1200, U: 10, fetch: 1e6 });
    const sb = stats(big, evaluate(big, 0));
    const pmHs = (0.21 * (10 * 1.07) ** 2) / g;
    check(
      "fully developed Hs near Pierson-Moskowitz",
      Math.abs(sb.Hs - pmHs) / pmHs < 0.35,
      `Hs ${sb.Hs.toFixed(2)} m vs PM ${pmHs.toFixed(2)} m`,
    );
    const cs = defaultCascades({ U: 8, N: 128 });
    const mss = cs.reduce((a, cc) => a + stats(cc, evaluate(cc, 0)).mss, 0);
    check(
      "resolved slopes do not exceed Cox-Munk",
      mss < coxMunkMss(8) * 1.1,
      `resolved ${mss.toFixed(4)} vs CM ${coxMunkMss(8).toFixed(4)}`,
    );
    if (failed) process.exit(1);
    console.log("ocean-spectrum-check self-test passed");
  } else {
    const U = +(process.argv[2] || 8);
    const fetch = +(process.argv[3] || 200) * 1e3;
    const cs = defaultCascades({ U, fetch, N: 256 });
    let mss = 0;
    for (const c of cs) {
      const s = stats(c, evaluate(c, 0));
      mss += s.mss;
      console.log(
        `cascade L=${c.L} m  band k in [${c.kMin.toFixed(3)}, ${c.kMax.toFixed(2)}) rad/m  Hs ${s.Hs.toFixed(3)} m  mss ${s.mss.toFixed(5)}`,
      );
    }
    console.log(
      `resolved mss ${mss.toFixed(5)}; Cox-Munk total ${coxMunkMss(U).toFixed(5)}; hand ${Math.max(0, coxMunkMss(U) - mss).toFixed(5)} to roughness`,
    );
  }
}
