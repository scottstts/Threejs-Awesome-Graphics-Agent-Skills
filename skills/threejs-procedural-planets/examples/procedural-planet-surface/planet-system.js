import * as THREE from "three";
import {
  PELAGIA_SEED,
  terrainSample,
} from "./terrain-field.js";


function createTerrainPlanetGeometry({ radius, terrainAmplitude, resolution }) {
  const positions = [];
  const surfaceDirections = [];
  const indices = [];
  const vertexByDirection = new Map();
  const direction = new THREE.Vector3();

  const facePoint = (faceIndex, u, v) => {
    switch (faceIndex) {
      case 0:
        return [1, v, -u];
      case 1:
        return [-1, v, u];
      case 2:
        return [u, 1, -v];
      case 3:
        return [u, -1, v];
      case 4:
        return [u, v, 1];
      default:
        return [-u, v, -1];
    }
  };

  const directionKey = ({ x, y, z }) =>
    `${x.toFixed(12)},${y.toFixed(12)},${z.toFixed(12)}`;

  const getVertexIndex = (faceIndex, gridX, gridY) => {
    const u = (gridX / resolution) * 2 - 1;
    const v = (gridY / resolution) * 2 - 1;
    const [x, y, z] = facePoint(faceIndex, u, v);
    direction.set(x, y, z).normalize();
    const key = directionKey(direction);
    const existingIndex = vertexByDirection.get(key);
    if (existingIndex !== undefined) return existingIndex;

    const height = terrainSample(direction);
    const vertexRadius = radius * (1 + height * terrainAmplitude);
    const vertexIndex = positions.length / 3;
    positions.push(
      direction.x * vertexRadius,
      direction.y * vertexRadius,
      direction.z * vertexRadius,
    );
    surfaceDirections.push(direction.x, direction.y, direction.z);
    vertexByDirection.set(key, vertexIndex);
    return vertexIndex;
  };

  const pushOutwardTriangle = (a, b, c) => {
    const ax = positions[a * 3];
    const ay = positions[a * 3 + 1];
    const az = positions[a * 3 + 2];
    const bx = positions[b * 3];
    const by = positions[b * 3 + 1];
    const bz = positions[b * 3 + 2];
    const cx = positions[c * 3];
    const cy = positions[c * 3 + 1];
    const cz = positions[c * 3 + 2];
    const abx = bx - ax;
    const aby = by - ay;
    const abz = bz - az;
    const acx = cx - ax;
    const acy = cy - ay;
    const acz = cz - az;
    const nx = aby * acz - abz * acy;
    const ny = abz * acx - abx * acz;
    const nz = abx * acy - aby * acx;
    const centerX = ax + bx + cx;
    const centerY = ay + by + cy;
    const centerZ = az + bz + cz;
    if (nx * centerX + ny * centerY + nz * centerZ < 0) {
      indices.push(a, c, b);
      return;
    }
    indices.push(a, b, c);
  };

  for (let faceIndex = 0; faceIndex < 6; faceIndex += 1) {
    for (let gridY = 0; gridY < resolution; gridY += 1) {
      for (let gridX = 0; gridX < resolution; gridX += 1) {
        const a = getVertexIndex(faceIndex, gridX, gridY);
        const b = getVertexIndex(faceIndex, gridX + 1, gridY);
        const c = getVertexIndex(faceIndex, gridX + 1, gridY + 1);
        const d = getVertexIndex(faceIndex, gridX, gridY + 1);
        pushOutwardTriangle(a, b, d);
        pushOutwardTriangle(b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "surfaceDirection",
    new THREE.Float32BufferAttribute(surfaceDirections, 3),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

export function createProceduralPlanetSurface({ camera }) {
const sunDirection = new THREE.Vector3(0.68, 0.28, 0.67).normalize();
const planetRadius = 1;
const terrainAmplitude = 0.018;
const geometry = createTerrainPlanetGeometry({
  radius: planetRadius,
  terrainAmplitude,
  resolution: 72,
});

const sharedNoiseGlsl = `
  float hash3(vec3 cell, float seed) {
    float n = dot(cell, vec3(127.1, 311.7, 74.7)) + seed * 191.999;
    return fract(sin(n) * 43758.5453123);
  }
  float valueNoise3(vec3 point, float seed) {
    vec3 cell = floor(point);
    vec3 fraction = fract(point);
    vec3 curve = fraction * fraction * (3.0 - 2.0 * fraction);
    float n000 = hash3(cell, seed);
    float n100 = hash3(cell + vec3(1, 0, 0), seed);
    float n010 = hash3(cell + vec3(0, 1, 0), seed);
    float n110 = hash3(cell + vec3(1, 1, 0), seed);
    float n001 = hash3(cell + vec3(0, 0, 1), seed);
    float n101 = hash3(cell + vec3(1, 0, 1), seed);
    float n011 = hash3(cell + vec3(0, 1, 1), seed);
    float n111 = hash3(cell + vec3(1, 1, 1), seed);
    float nx00 = mix(n000, n100, curve.x);
    float nx10 = mix(n010, n110, curve.x);
    float nx01 = mix(n001, n101, curve.x);
    float nx11 = mix(n011, n111, curve.x);
    return mix(mix(nx00, nx10, curve.y), mix(nx01, nx11, curve.y), curve.z);
  }
  float fbm5(vec3 point, float seed, float lacunarity, float gain) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int index = 0; index < 5; index += 1) {
      value += valueNoise3(point * frequency, seed + float(index) * 13.7) * amplitude;
      frequency *= lacunarity;
      amplitude *= gain;
    }
    return value;
  }
  float fbm4(vec3 point, float seed, float lacunarity, float gain) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int index = 0; index < 4; index += 1) {
      value += valueNoise3(point * frequency, seed + float(index) * 13.7) * amplitude;
      frequency *= lacunarity;
      amplitude *= gain;
    }
    return value;
  }
  float sharedTerrain(vec3 radial) {
    float seed = ${Number((PELAGIA_SEED * 97.113).toFixed(8))};
    vec3 point = radial * 8.4;
    vec3 warp = vec3(
      valueNoise3(point * 0.75 + vec3(seed, 0, 0), seed + 7.1),
      valueNoise3(point * 0.75 + vec3(0, seed, 0), seed + 11.4),
      valueNoise3(point * 0.75 + vec3(0, 0, seed), seed + 17.9)
    ) - 0.5;
    vec3 q = point + warp * 2.4;
    float continental = fbm5(q * 0.55, seed + 23.1, 2.03, 0.5);
    float highlands = fbm4(q * 1.25, seed + 41.8, 2.15, 0.55);
    float ridgedBase = fbm4(q * 2.7, seed + 59.2, 2.08, 0.52);
    float ridged = 1.0 - abs(ridgedBase * 2.0 - 1.0);
    float value =
      continental * 0.62 +
      highlands * 0.24 +
      ridged * 0.34 +
      (0.35 - abs(radial.y)) * 0.08;
    return clamp(value * 2.0 - 1.0, -1.0, 1.0);
  }
`;

const planetUniforms = {
  uSunDirection: { value: sunDirection },
  uCameraAltitude: { value: camera.position.length() - 1 },
  uDebugMode: { value: 0 },
};
const planetMaterial = new THREE.ShaderMaterial({
  uniforms: planetUniforms,
  vertexShader: `
    attribute vec3 surfaceDirection;
    varying vec3 vSurfaceDirection;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;
    void main() {
      vSurfaceDirection = normalize(surfaceDirection);
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      vWorldNormal = normalize(mat3(modelMatrix) * normal);
      vec4 viewPosition = viewMatrix * worldPosition;
      vViewPosition = viewPosition.xyz;
      gl_Position = projectionMatrix * viewPosition;
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform vec3 uSunDirection;
    uniform float uCameraAltitude;
    uniform int uDebugMode;
    varying vec3 vSurfaceDirection;
    varying vec3 vWorldPosition;
    varying vec3 vWorldNormal;
    varying vec3 vViewPosition;
    ${sharedNoiseGlsl}

    void main() {
      vec3 radial = normalize(vSurfaceDirection);
      float terrainHeight = sharedTerrain(radial);
      float radiusKm = 12000.0;
      vec3 terrainKm = radial * radiusKm;
      vec3 warpCoord = terrainKm * 0.00115 +
        vec3(7.3, 11.9, 13.7) * ${PELAGIA_SEED.toFixed(4)};
      vec3 warp = vec3(
        valueNoise3(warpCoord, 17.1),
        valueNoise3(warpCoord + 37.2, 29.4),
        valueNoise3(warpCoord + 81.7, 43.8)
      ) - 0.5;
      vec3 tangentWarp = warp - radial * dot(warp, radial);
      vec3 warpedKm = normalize(terrainKm + tangentWarp * 520.0) * radiusKm;

      float continent =
        valueNoise3(warpedKm * 0.00022, 3.7) * 0.60 +
        valueNoise3(warpedKm * 0.00048, 9.1) * 0.28 +
        valueNoise3(warpedKm * 0.00095, 15.4) * 0.12;
      float coastJitter =
        (valueNoise3(warpedKm * 0.0024, 23.2) - 0.5) * 0.10 +
        (valueNoise3(warpedKm * 0.0085, 47.9) - 0.5) * 0.025;
      float continentField = continent + terrainHeight * 0.115 + coastJitter;
      float landMask = smoothstep(0.49, 0.515, continentField);
      float coastMask = 1.0 - smoothstep(0.0, 0.045, abs(continentField - 0.502));
      float humidity =
        valueNoise3(warpedKm * 0.0022, 63.1) * 0.65 +
        valueNoise3(warpedKm * 0.0075, 79.3) * 0.35;
      float temperature =
        (1.0 - pow(abs(radial.y), 1.35)) * 0.85 +
        0.15 - terrainHeight * 0.32;
      float slope = clamp(
        1.0 - abs(dot(normalize(vWorldNormal), radial)),
        0.0,
        1.0
      );
      float jitter = valueNoise3(warpedKm * 0.018, 101.7) - 0.5;
      float snow = smoothstep(
        0.58,
        0.88,
        abs(radial.y) + terrainHeight * 0.35 -
          temperature * 0.18 + jitter * 0.08
      );
      float arid = smoothstep(
        0.46,
        0.78,
        (1.0 - humidity) * temperature -
          terrainHeight * 0.08 + jitter * 0.12
      );
      float lush = smoothstep(
        0.36,
        0.72,
        humidity * temperature - arid * 0.35 -
          slope * 0.8 + jitter * 0.08
      );
      float rock = smoothstep(
        0.08,
        0.30,
        slope + max(terrainHeight, 0.0) * 0.28 +
          abs(jitter) * 0.12
      );

      vec3 deepOcean = vec3(0.012, 0.075, 0.16);
      vec3 shelfOcean = vec3(0.025, 0.24, 0.34);
      float oceanDepth = clamp((0.505 - continentField) * 7.5, 0.0, 1.0);
      vec3 oceanColor = mix(shelfOcean, deepOcean, oceanDepth);
      vec3 groundColor = vec3(0.36, 0.25, 0.13);
      groundColor = mix(groundColor, vec3(0.55, 0.44, 0.25), arid);
      groundColor = mix(groundColor, vec3(0.06, 0.24, 0.11), lush);
      groundColor = mix(groundColor, vec3(0.24, 0.22, 0.20), rock);
      groundColor = mix(groundColor, vec3(0.89, 0.94, 0.96), snow);
      groundColor = mix(
        groundColor,
        vec3(0.72, 0.61, 0.40),
        coastMask * landMask
      );
      vec3 baseColor = mix(oceanColor, groundColor, landMask);

      float detail = valueNoise3(warpedKm * 0.009, 131.4);
      vec3 sigmaX = normalize(dFdx(vViewPosition));
      vec3 sigmaY = normalize(dFdy(vViewPosition));
      vec2 dHeight = vec2(dFdx(detail), dFdy(detail)) *
        mix(0.18, 0.025, clamp(uCameraAltitude / 3.0, 0.0, 1.0));
      vec3 surfaceNormalView = normalize(mat3(viewMatrix) * vWorldNormal);
      vec3 r1 = cross(sigmaY, surfaceNormalView);
      vec3 r2 = cross(surfaceNormalView, sigmaX);
      float determinant = dot(sigmaX, r1);
      vec3 gradient = sign(determinant) *
        (dHeight.x * r1 + dHeight.y * r2);
      vec3 bumpNormalView = normalize(
        max(abs(determinant), 1e-5) * surfaceNormalView - gradient
      );
      float normalVariance = max(
        dot(dFdx(bumpNormalView), dFdx(bumpNormalView)),
        dot(dFdy(bumpNormalView), dFdy(bumpNormalView))
      );
      float roughnessBase = mix(
        0.17,
        mix(0.78, 0.58, lush),
        landMask
      );
      float roughness = clamp(
        sqrt(
          roughnessBase * roughnessBase +
          min(normalVariance * 0.8, 1.0)
        ),
        0.0,
        1.0
      );

      vec3 lightDirection = normalize(mat3(viewMatrix) * uSunDirection);
      vec3 viewDirection = normalize(-vViewPosition);
      float diffuse = max(dot(bumpNormalView, lightDirection), 0.0);
      float wrap = max(
        (dot(bumpNormalView, lightDirection) + 0.18) / 1.18,
        0.0
      );
      vec3 halfVector = normalize(lightDirection + viewDirection);
      float specularPower = mix(180.0, 8.0, roughness);
      float fresnel = pow(
        1.0 - max(dot(bumpNormalView, viewDirection), 0.0),
        5.0
      );
      float specular = pow(
        max(dot(bumpNormalView, halfVector), 0.0),
        specularPower
      );
      specular *= mix(0.025, 0.85, 1.0 - landMask) *
        (1.0 - roughness * 0.55);
      vec3 finalColor = baseColor *
        (0.025 + diffuse * 0.92 + wrap * 0.08);
      finalColor += vec3(0.82, 0.93, 1.0) * specular;
      finalColor += oceanColor * fresnel * (1.0 - landMask) * 0.35;

      if (uDebugMode == 1) {
        finalColor = vec3(terrainHeight * 0.5 + 0.5);
      } else if (uDebugMode == 2) {
        finalColor = vec3(landMask, coastMask, oceanDepth);
      } else if (uDebugMode == 3) {
        finalColor = vec3(humidity, temperature, 0.1);
      } else if (uDebugMode == 4) {
        finalColor =
          snow * vec3(0.9, 0.95, 1.0) +
          arid * vec3(0.95, 0.55, 0.1) +
          lush * vec3(0.05, 0.8, 0.2) +
          rock * vec3(0.42) +
          (1.0 - landMask) * vec3(0.0, 0.12, 0.7);
      } else if (uDebugMode == 5) {
        finalColor = bumpNormalView * 0.5 + 0.5;
      } else if (uDebugMode == 6) {
        discard;
      }

      gl_FragColor = vec4(finalColor, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
});
const planet = new THREE.Mesh(geometry, planetMaterial);

const debugModes = new Map([
  ["final", 0],
  ["height", 1],
  ["continents", 2],
  ["climate", 3],
  ["biomes", 4],
  ["normals", 5],
]);
function setDebugMode(modeName) {
  const mode = debugModes.get(modeName) ?? 0;
  planetUniforms.uDebugMode.value = mode;
}

  return {
      object: planet,
      setDebugMode,
      update({ delta }) {
        planet.rotation.y += delta * 0.035;
        planetUniforms.uCameraAltitude.value = Math.max(
          camera.position.length() - 1,
          0,
        );
      },
      metrics() {
        return { tier: "cube-sphere terrain / altitude-filtered material" };
      },
      dispose() {
        geometry.dispose();
        planetMaterial.dispose();
      },
  };
}
