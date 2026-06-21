import * as THREE from "three";

const DAYLIGHT_TEXTURE_WIDTH = 512;

export const daylightSunDirection = new THREE.Vector3(
  0.45,
  0.78,
  0.55,
).normalize();

const settings = {
  zenith: [0.2, 0.46, 0.82],
  upper: [0.42, 0.64, 0.9],
  horizon: [0.78, 0.86, 0.92],
  ground: [0.6, 0.55, 0.48],
  horizonMixPower: 0.62,
  groundMixPower: 0.42,
  horizonGlowStrength: 0.05,
  broadHaloPower: 12,
  broadHaloStrength: 0.18,
  innerHaloPower: 90,
  innerHaloStrength: 0.55,
  sunCoreStrength: 1.4,
  sunAngularDiameterDegrees: 0.545,
};

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function mixColor(a, b, amount) {
  return a.map((value, index) => value + (b[index] - value) * amount);
}

function directionFromEquirect(u, v) {
  const longitude = (u - 0.5) * Math.PI * 2;
  const latitude = (0.5 - v) * Math.PI;
  const cosLatitude = Math.cos(latitude);
  return new THREE.Vector3(
    Math.sin(longitude) * cosLatitude,
    Math.sin(latitude),
    Math.cos(longitude) * cosLatitude,
  );
}

function sampleSky(direction) {
  const up = clamp01(direction.y);
  const down = clamp01(-direction.y);
  const horizonAmount = Math.pow(
    1 - Math.abs(direction.y),
    settings.horizonMixPower,
  );
  let color = mixColor(settings.upper, settings.zenith, Math.pow(up, 0.55));
  color = mixColor(color, settings.horizon, horizonAmount);
  color = mixColor(
    color,
    settings.ground,
    Math.pow(down, settings.groundMixPower),
  );

  const sunDot = clamp01(direction.dot(daylightSunDirection));
  const halo =
    Math.pow(sunDot, settings.broadHaloPower) * settings.broadHaloStrength +
    Math.pow(sunDot, settings.innerHaloPower) * settings.innerHaloStrength;
  const sunRadius =
    THREE.MathUtils.degToRad(settings.sunAngularDiameterDegrees) * 0.5;
  const core = sunDot > Math.cos(sunRadius) ? settings.sunCoreStrength : 0;
  const horizonGlow =
    Math.pow(1 - Math.abs(direction.y), 3) *
    settings.horizonGlowStrength;

  return color.map(
    (value, index) =>
      value +
      [1, 0.86, 0.56][index] * (halo + horizonGlow) +
      [1, 0.98, 0.92][index] * core,
  );
}

export function createDaylightEnvironment(renderer) {
  const width = DAYLIGHT_TEXTURE_WIDTH;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  const image = context.createImageData(width, height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const color = sampleSky(
        directionFromEquirect((x + 0.5) / width, (y + 0.5) / height),
      );
      const offset = (y * width + x) * 4;
      image.data[offset] = Math.round(clamp01(color[0]) * 255);
      image.data[offset + 1] = Math.round(clamp01(color[1]) * 255);
      image.data[offset + 2] = Math.round(clamp01(color[2]) * 255);
      image.data[offset + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);

  const background = new THREE.CanvasTexture(canvas);
  background.mapping = THREE.EquirectangularReflectionMapping;
  background.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environmentTarget = pmrem.fromEquirectangular(background);
  pmrem.dispose();
  return {
    background,
    environment: environmentTarget.texture,
    dispose() {
      background.dispose();
      environmentTarget.dispose();
    },
  };
}
