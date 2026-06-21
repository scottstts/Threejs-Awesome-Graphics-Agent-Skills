const fract = (value) => value - Math.floor(value);
const smoothValue = (value) => value * value * (3 - 2 * value);
const lerp = (a, b, t) => a + (b - a) * t;

function hash3(x, y, z, seed) {
  const n = x * 127.1 + y * 311.7 + z * 74.7 + seed * 191.999;
  return fract(Math.sin(n) * 43758.5453123);
}

function valueNoise3(x, y, z, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const tx = smoothValue(fract(x));
  const ty = smoothValue(fract(y));
  const tz = smoothValue(fract(z));
  const n000 = hash3(x0, y0, z0, seed);
  const n100 = hash3(x0 + 1, y0, z0, seed);
  const n010 = hash3(x0, y0 + 1, z0, seed);
  const n110 = hash3(x0 + 1, y0 + 1, z0, seed);
  const n001 = hash3(x0, y0, z0 + 1, seed);
  const n101 = hash3(x0 + 1, y0, z0 + 1, seed);
  const n011 = hash3(x0, y0 + 1, z0 + 1, seed);
  const n111 = hash3(x0 + 1, y0 + 1, z0 + 1, seed);
  const nx00 = lerp(n000, n100, tx);
  const nx10 = lerp(n010, n110, tx);
  const nx01 = lerp(n001, n101, tx);
  const nx11 = lerp(n011, n111, tx);
  return lerp(lerp(nx00, nx10, ty), lerp(nx01, nx11, ty), tz);
}

function fbmNoise3(x, y, z, seed, octaves, lacunarity, gain) {
  let amplitude = 0.5;
  let frequency = 1;
  let value = 0;
  for (let index = 0; index < octaves; index += 1) {
    value += valueNoise3(
      x * frequency,
      y * frequency,
      z * frequency,
      seed + index * 13.7,
    ) * amplitude;
    frequency *= lacunarity;
    amplitude *= gain;
  }
  return value;
}

export const PELAGIA_SEED = 31.731;

export function terrainSample(direction) {
  const seed = PELAGIA_SEED * 97.113;
  const x = direction.x * 8.4;
  const y = direction.y * 8.4;
  const z = direction.z * 8.4;
  const warpX = valueNoise3(x * 0.75 + seed, y * 0.75, z * 0.75, seed + 7.1) - 0.5;
  const warpY = valueNoise3(x * 0.75, y * 0.75 + seed, z * 0.75, seed + 11.4) - 0.5;
  const warpZ = valueNoise3(x * 0.75, y * 0.75, z * 0.75 + seed, seed + 17.9) - 0.5;
  const qx = x + warpX * 2.4;
  const qy = y + warpY * 2.4;
  const qz = z + warpZ * 2.4;
  const continental = fbmNoise3(qx * 0.55, qy * 0.55, qz * 0.55, seed + 23.1, 5, 2.03, 0.5);
  const highlands = fbmNoise3(qx * 1.25, qy * 1.25, qz * 1.25, seed + 41.8, 4, 2.15, 0.55);
  const ridgedBase = fbmNoise3(qx * 2.7, qy * 2.7, qz * 2.7, seed + 59.2, 4, 2.08, 0.52);
  const ridged = 1 - Math.abs(ridgedBase * 2 - 1);
  const value =
    continental * 0.62 +
    highlands * 0.24 +
    ridged * 0.34 +
    (0.35 - Math.abs(direction.y)) * 0.08;
  return Math.max(-1, Math.min(1, value * 2 - 1));
}
