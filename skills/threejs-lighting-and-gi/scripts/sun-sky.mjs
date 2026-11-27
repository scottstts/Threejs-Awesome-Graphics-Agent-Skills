#!/usr/bin/env node
// sun-sky.mjs: clear-sky direct sun and diffuse sky irradiance ratios for a given
// sun elevation, plus matching Three.js directional/sky-fill targets.
//
// Models (clear sky, sea level):
//   air mass               Kasten-Young (1989)
//   direct normal (DNI)    Meinel: 1361 * 0.7^(AM^0.678)  W/m^2
//   global horizontal      Haurwitz: 1098 * cos z * exp(-0.057 / cos z)  W/m^2
//   diffuse horizontal     DHI = GHI - DNI * cos z
//
// Valid for sun elevations of about 10-90 deg. Below about 10 deg the Haurwitz fit
// under-predicts twilight diffuse light; use a physical sky model there.
//
// Usage: node sun-sky.mjs <sunElevationDeg> [sunIntensity=3]
//        node sun-sky.mjs --self-test
// Output: DNI, DHI, diffuse/direct ratio, lit-to-shade ratios, and matching Three.js
// sky-fill irradiance: E_sky = sunIntensity * DHI / DNI (uniform sky radiance ~= E_sky / pi).
const D = Math.PI / 180;

export function clearSky(elevDeg) {
  const z = (90 - elevDeg) * D;
  const cz = Math.cos(z);
  if (cz <= 0) return { dni: 0, ghi: 0, dhi: 0, airMass: Infinity };
  const am = 1 / (cz + 0.50572 * Math.pow(96.07995 - (90 - elevDeg), -1.6364));
  const dni = 1361 * Math.pow(0.7, Math.pow(am, 0.678));
  const ghi = 1098 * cz * Math.exp(-0.057 / cz);
  const dhi = Math.max(0, ghi - dni * cz);
  return { airMass: am, dni, ghi, dhi };
}

export function report(elevDeg, sunIntensity = 3) {
  const s = clearSky(elevDeg);
  const cz = Math.sin(elevDeg * D);
  const ratio = s.dhi / s.dni;
  return {
    sunElevationDeg: elevDeg,
    ...(elevDeg < 10
      ? { warning: "below about 10 deg this model under-predicts diffuse light; derive the ratio from a physical sky model" }
      : {}),
    airMass: +s.airMass.toFixed(2),
    DNI_Wm2: +s.dni.toFixed(0),
    DHI_Wm2: +s.dhi.toFixed(0),
    diffuseToDirect: +ratio.toFixed(3),
    litToShadeUpFacing: +((s.dni * cz + s.dhi) / s.dhi).toFixed(1),
    litToShadeSunFacing: +((s.dni + s.dhi * 0.5) / (s.dhi * 0.5)).toFixed(1),
    three: {
      directionalIntensity: sunIntensity,
      skyIrradianceUpFacing: +(sunIntensity * ratio).toFixed(3),
      uniformSkyRadiance: +((sunIntensity * ratio) / Math.PI).toFixed(4),
    },
  };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  if (process.argv[2] === "--self-test") {
    const hi = report(70);
    const mid = report(18);
    const lo = report(10);
    console.log(
      JSON.stringify(
        [hi, mid, lo].map((r) => [
          r.sunElevationDeg,
          r.DNI_Wm2,
          r.DHI_Wm2,
          r.diffuseToDirect,
          r.litToShadeUpFacing,
        ]),
      ),
    );
    const ok =
      hi.DNI_Wm2 > 850 &&
      hi.DNI_Wm2 < 1000 &&
      hi.diffuseToDirect > 0.07 &&
      hi.diffuseToDirect < 0.15 &&
      mid.diffuseToDirect > 0.12 &&
      mid.diffuseToDirect < 0.22 &&
      lo.diffuseToDirect > hi.diffuseToDirect &&
      hi.litToShadeUpFacing > 8 &&
      report(5).warning !== undefined;
    if (!ok) {
      console.error("SELF-TEST FAILED");
      process.exit(1);
    }
    console.log("sun-sky self-test passed");
  } else {
    const e = +(process.argv[2] ?? 45);
    const i = +(process.argv[3] ?? 3);
    console.log(JSON.stringify(report(e, i), null, 2));
  }
}
