import * as THREE from "three";

export const grassDebugModes = new Map([
  ["final", 0],
  ["height", 1],
  ["patches", 2],
  ["wind", 3],
  ["normals", 4],
]);

export const stylizedMeadowGrassAssetPaths = {
  blades: "/skills/threejs-procedural-vegetation/assets/stylized-meadow-grass/grass-blades-up.glb",
  noise: "/skills/threejs-procedural-vegetation/assets/stylized-meadow-grass/perlin.webp",
  pathMask: "/skills/threejs-procedural-vegetation/assets/stylized-meadow-grass/path.webp",
};

class SeededRandom {
  constructor(seed = 1) {
    this.state = seed >>> 0;
  }

  value(min = 0, max = 1) {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    const normalized = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    return min + (max - min) * normalized;
  }
}

export function createStylizedGrassBladeGeometry({
  height = 1.18,
  width = 0.085,
  segments = 6,
  planes = 5,
} = {}) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let plane = 0; plane < planes; plane += 1) {
    const angle = (plane / planes) * Math.PI;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const normal = new THREE.Vector3(sin, 0.34, cos).normalize();
    const base = positions.length / 3;

    for (let segment = 0; segment <= segments; segment += 1) {
      const t = segment / segments;
      const taper = Math.pow(1 - t, 1.35);
      const lean = Math.pow(t, 1.8) * 0.16;
      const y = t * height;
      const halfWidth = width * (0.18 + 0.82 * taper);
      for (const side of [-1, 1]) {
        const localX = side * halfWidth;
        const localZ = lean;
        positions.push(
          localX * cos - localZ * sin,
          y,
          localX * sin + localZ * cos,
        );
        normals.push(normal.x, normal.y, normal.z);
        uvs.push(side < 0 ? 0 : 1, t);
      }
    }

    for (let segment = 0; segment < segments; segment += 1) {
      const row = base + segment * 2;
      indices.push(row, row + 1, row + 2, row + 1, row + 3, row + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(normals, 3),
  );
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

export function createStylizedGrassMaterial({
  bladeHeight = 1.18,
  sunDirection = new THREE.Vector3(-0.38, 0.72, 0.58).normalize(),
  rootColor = 0x6aa14f,
  tipColor = 0xa1cc33,
  rootColorB = 0x74a022,
  tipColorB = 0xe8e84f,
  groundColorMap = null,
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uBladeHeight: { value: bladeHeight },
      uWindStrength: { value: 0.25 },
      uWindSpeed: { value: 2.0 },
      uWindAngle: { value: THREE.MathUtils.degToRad(45) },
      uGustScale: { value: 0.5 },
      uTurbulence: { value: 0.28 },
      uFlutter: { value: 0.28 },
      uHeightVariation: { value: 0.5 },
      uHeightNoiseScale: { value: 0.15 },
      uColorPatchScale: { value: 0.7 },
      uColorVariation: { value: 0.5 },
      uMacroScale: { value: 0.115 },
      uMacroVariation: { value: 0.48 },
      uProjection: { value: 0.74 },
      uGroundSize: { value: 40 },
      uGroundRepeat: { value: 8 },
      uUseGroundMap: { value: groundColorMap ? 1 : 0 },
      uGroundMap: { value: groundColorMap },
      uShadowStrength: { value: 0 },
      uShadow0: { value: new THREE.Vector4(0, 0, 1, 1) },
      uShadow1: { value: new THREE.Vector4(0, 0, 1, 1) },
      uShadow2: { value: new THREE.Vector4(0, 0, 1, 1) },
      uDebugMode: { value: 0 },
      uSunDirection: { value: sunDirection },
      uRootColor: { value: new THREE.Color(rootColor) },
      uTipColor: { value: new THREE.Color(tipColor) },
      uRootColorB: { value: new THREE.Color(rootColorB) },
      uTipColorB: { value: new THREE.Color(tipColorB) },
    },
    side: THREE.DoubleSide,
    vertexShader: `
      precision highp float;

      attribute vec2 aOrigin;
      attribute vec2 aFacing;
      attribute float aSeed;

      uniform float uTime;
      uniform float uBladeHeight;
      uniform float uWindStrength;
      uniform float uWindSpeed;
      uniform float uWindAngle;
      uniform float uGustScale;
      uniform float uTurbulence;
      uniform float uFlutter;
      uniform float uHeightVariation;
      uniform float uHeightNoiseScale;
      uniform int uDebugMode;

      varying vec2 vWorldXZ;
      varying float vBladeT;
      varying float vPatch;
      varying float vSeed;
      varying float vWind;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;

      float hash21(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float valueNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), u.x),
          u.y
        );
      }

      vec3 bendOffset(vec3 local, float bladeT) {
        float bladePhase = aSeed * 6.28318530718;
        float wobble =
          sin(uTime * uWindSpeed * 0.6 + bladePhase) *
          uTurbulence *
          0.4;
        float windAngle = uWindAngle + wobble;
        vec2 windDir = vec2(cos(windAngle), sin(windAngle));
        vec2 sideDir = vec2(-windDir.y, windDir.x);
        float along = dot(aOrigin, windDir);
        float jitter =
          (valueNoise(aOrigin * 0.03 + 11.7) * 2.0 - 1.0) * 1.45;
        float gustPhase =
          along * uGustScale - uTime * uWindSpeed * 0.6 + jitter;
        float gust = pow(sin(gustPhase) * 0.5 + 0.5, 1.6);
        float chopPhase =
          along * uGustScale * 2.7 -
          uTime * uWindSpeed * 1.3 +
          bladePhase;
        float chop = sin(chopPhase) * 0.5 + 0.5;
        float ampVar = 0.65 + hash21(vec2(aSeed, 7.0)) * 0.7;
        float intensity = (0.25 + gust * 0.85 + chop * 0.18) * ampVar;
        float phi = clamp(uWindStrength * intensity * 3.0, 0.0, 1.48);
        float shaped = pow(bladeT, 1.5);
        float a = phi * shaped;
        float radius = uBladeHeight / max(phi, 0.001);
        float arc = radius * (1.0 - cos(a));
        float drop = radius * sin(a) - local.y;
        float flutterMask = smoothstep(0.55, 1.0, bladeT);
        float flutterPhase = uTime * 10.0 + bladePhase * 3.0 + along * 0.8;
        float flutter =
          sin(flutterPhase) * uFlutter * 0.08 * flutterMask;
        vec2 worldOffset = windDir * arc + sideDir * flutter;
        float localX =
          worldOffset.x * aFacing.x - worldOffset.y * aFacing.y;
        float localZ =
          worldOffset.x * aFacing.y + worldOffset.y * aFacing.x;
        vWind = clamp(gust * 0.75 + chop * 0.25, 0.0, 1.0);
        return vec3(localX, drop, localZ);
      }

      void main() {
        vBladeT = clamp(position.y / uBladeHeight, 0.0, 1.0);
        float heightNoise =
          valueNoise(aOrigin * uHeightNoiseScale + vec2(53.0, 17.0)) *
          2.0 - 1.0;
        float heightFactor =
          clamp(1.0 + heightNoise * uHeightVariation, 0.35, 1.8);
        vec3 local = position + bendOffset(position, vBladeT);
        local.y *= heightFactor;

        vec4 world = modelMatrix * instanceMatrix * vec4(local, 1.0);
        vWorldPosition = world.xyz;
        vWorldXZ = world.xz;
        vPatch = valueNoise(vWorldXZ * 0.16);
        vSeed = aSeed;
        vWorldNormal = normalize(mat3(modelMatrix * instanceMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      precision highp float;

      uniform int uDebugMode;
      uniform vec3 uSunDirection;
      uniform vec3 uRootColor;
      uniform vec3 uTipColor;
      uniform vec3 uRootColorB;
      uniform vec3 uTipColorB;
      uniform float uColorPatchScale;
      uniform float uColorVariation;
      uniform float uMacroScale;
      uniform float uMacroVariation;
      uniform float uProjection;
      uniform float uGroundSize;
      uniform float uGroundRepeat;
      uniform float uUseGroundMap;
      uniform float uShadowStrength;
      uniform vec4 uShadow0;
      uniform vec4 uShadow1;
      uniform vec4 uShadow2;
      uniform sampler2D uGroundMap;

      varying vec2 vWorldXZ;
      varying float vBladeT;
      varying float vPatch;
      varying float vSeed;
      varying float vWind;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;

      float hash21(vec2 p) {
        vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
        p3 += dot(p3, p3.yzx + 33.33);
        return fract((p3.x + p3.y) * p3.z);
      }

      float ellipseShadow(vec2 position, vec4 shadow) {
        vec2 d = (position - shadow.xy) / max(shadow.zw, vec2(0.001));
        return smoothstep(1.0, 0.12, dot(d, d));
      }

      float valueNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(
          mix(hash21(i), hash21(i + vec2(1.0, 0.0)), u.x),
          mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), u.x),
          u.y
        );
      }

      void main() {
        vec3 N = normalize(vWorldNormal + vec3(0.0, 0.42, 0.0));
        vec3 V = normalize(cameraPosition - vWorldPosition);
        vec3 L = normalize(uSunDirection);
        float gradT = pow(vBladeT, 1.35);
        float patchBlend =
          clamp(valueNoise(vWorldXZ * uColorPatchScale) * uColorVariation, 0.0, 1.0);
        vec3 gradientA = mix(uRootColor, uTipColor, gradT);
        vec3 gradientB = mix(uRootColorB, uTipColorB, gradT);
        vec3 baseColor = mix(gradientA, gradientB, patchBlend);
        if (uUseGroundMap > 0.5) {
          vec2 groundUv = (vWorldXZ / uGroundSize + 0.5) * uGroundRepeat;
          vec3 groundTint = texture2D(uGroundMap, groundUv).rgb;
          float projection = uProjection * mix(1.0, 0.4, gradT);
          baseColor = mix(baseColor, baseColor * groundTint, projection);
        }
        float macro =
          1.0 +
          (valueNoise(vWorldXZ * uMacroScale + vec2(137.0, 91.0)) - 0.5) *
          2.0 *
          uMacroVariation;
        float brightness = mix(0.85, 1.15, hash21(vec2(vSeed + 13.37, 4.2)));

        float hemi = 0.46 + 0.54 * clamp(N.y * 0.5 + 0.5, 0.0, 1.0);
        float diffuse = max(dot(N, L), 0.0);
        float back = pow(max(dot(V, -normalize(L + N * 0.5)), 0.0), 3.0);
        float rim = pow(1.0 - max(dot(N, V), 0.0), 4.0);
        vec3 color =
          baseColor * brightness * macro * (hemi * 0.72 + diffuse * 0.38) +
          vec3(0.68, 0.77, 0.28) * back * pow(vBladeT, 1.5) * 0.68 +
          vec3(0.88, 0.92, 0.60) * rim * 0.16;
        float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(luma), color, 1.32) * 1.06;
        float shadow =
          max(ellipseShadow(vWorldXZ, uShadow0),
          max(ellipseShadow(vWorldXZ, uShadow1), ellipseShadow(vWorldXZ, uShadow2)));
        color *= 1.0 - shadow * uShadowStrength;

        if (uDebugMode == 1) {
          color = vec3(vBladeT);
        } else if (uDebugMode == 2) {
          color = mix(vec3(0.14, 0.24, 0.06), vec3(0.8, 0.95, 0.28), patchBlend);
        } else if (uDebugMode == 3) {
          color = vec3(vWind, 1.0 - vWind, pow(vBladeT, 2.0));
        } else if (uDebugMode == 4) {
          color = N * 0.5 + 0.5;
        }

        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

function measureBladeHeight(geometry, fallback) {
  const position = geometry?.attributes?.position;
  if (!position) return fallback;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let index = 0; index < position.count; index += 1) {
    const y = position.getY(index);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }
  return Number.isFinite(minY) && Number.isFinite(maxY)
    ? Math.max(0.001, maxY - minY)
    : fallback;
}

export function createStylizedGrassField({
  count = 18000,
  area = 40,
  seed = 7331,
  bladeHeight = 1.18,
  bladeWidth = 0.085,
  scale = 1.3,
  scaleVariation = 0,
  pathSampler = null,
  sunDirection,
  bladeGeometry = null,
  groundColorMap = null,
} = {}) {
  const random = new SeededRandom(seed);
  const geometry = bladeGeometry
    ? bladeGeometry.clone()
    : createStylizedGrassBladeGeometry({
        height: bladeHeight,
        width: bladeWidth,
      });
  const measuredBladeHeight = measureBladeHeight(geometry, bladeHeight);
  const origins = new Float32Array(count * 2);
  const facings = new Float32Array(count * 2);
  const seeds = new Float32Array(count);
  geometry.setAttribute(
    "aOrigin",
    new THREE.InstancedBufferAttribute(origins, 2),
  );
  geometry.setAttribute(
    "aFacing",
    new THREE.InstancedBufferAttribute(facings, 2),
  );
  geometry.setAttribute(
    "aSeed",
    new THREE.InstancedBufferAttribute(seeds, 1),
  );

  const material = createStylizedGrassMaterial({
    bladeHeight: measuredBladeHeight,
    sunDirection,
    groundColorMap,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const dummy = new THREE.Object3D();
  for (let index = 0; index < count; index += 1) {
    const x = random.value(-area * 0.5, area * 0.5);
    const z = random.value(-area * 0.5, area * 0.5);
    const yaw = random.value(0, Math.PI * 2);
    const pathValue = pathSampler ? pathSampler(x, z) : 0;
    const visible = pathValue < 0.52;
    const clumpScale = scale * (1 + random.value(-scaleVariation, scaleVariation));
    origins[index * 2] = x;
    origins[index * 2 + 1] = z;
    facings[index * 2] = Math.cos(yaw);
    facings[index * 2 + 1] = Math.sin(yaw);
    seeds[index] = random.value();
    dummy.position.set(x, 0, z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.setScalar(visible ? clumpScale : 0.001);
    dummy.updateMatrix();
    mesh.setMatrixAt(index, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  geometry.attributes.aOrigin.needsUpdate = true;
  geometry.attributes.aFacing.needsUpdate = true;
  geometry.attributes.aSeed.needsUpdate = true;

  let debugMode = "final";
  return {
    object: mesh,
    geometry,
    material,
    setDebugMode(mode) {
      debugMode = mode;
      material.uniforms.uDebugMode.value = grassDebugModes.get(mode) ?? 0;
    },
    update({ elapsed }) {
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uDebugMode.value = grassDebugModes.get(debugMode) ?? 0;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
