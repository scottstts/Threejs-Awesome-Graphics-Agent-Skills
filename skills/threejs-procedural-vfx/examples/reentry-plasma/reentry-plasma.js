import * as THREE from "three";

const TWO_PI = Math.PI * 2;

const wakeVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  uniform float uTime;
  uniform float uRippleStrength;
  uniform float uFlowSpeed;

  void main() {
    vUv = uv;

    vec3 transformed = position;
    float t = uv.y;
    float theta = uv.x * 6.28318530718;

    float filamentWave =
      sin(theta * 13.0 + t * 30.0 - uTime * uFlowSpeed * 1.8) * 0.55 +
      sin(theta * 21.0 - t * 20.0 + uTime * uFlowSpeed * 2.3) * 0.25;

    transformed.xy *= 1.0 + filamentWave * uRippleStrength * t;

    vec4 worldPosition = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const wakeFragmentShader = `
  precision highp float;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  uniform float uTime;
  uniform float uOpacity;
  uniform float uGlow;
  uniform float uFlowSpeed;
  uniform float uNoiseScale;
  uniform vec3 uHeadColor;
  uniform vec3 uMidColor;
  uniform vec3 uTailColor;
  uniform vec3 uHotColor;
  uniform int uDebugMode;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.11, 0.17, 0.23));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += noise(p) * amplitude;
      p = p * 2.03 + vec3(11.7, 4.2, 8.3);
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    float t = clamp(vUv.y, 0.0, 1.0);
    float theta = vUv.x * 6.28318530718;

    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float facing = abs(dot(normalize(vWorldNormal), viewDirection));
    float fresnel = pow(1.0 - facing, 1.25);

    float movingZ = t * uNoiseScale - uTime * uFlowSpeed;
    float strandA = fbm(vec3(cos(theta) * 3.0, sin(theta) * 3.0, movingZ));
    float strandB = fbm(vec3(vUv.x * 18.0, movingZ * 1.8, uTime * 0.15));
    float filaments = pow(strandA * 0.55 + strandB * 0.45, 2.35);

    float headFade = smoothstep(0.005, 0.055, t);
    float tailFade = 1.0 - smoothstep(0.76, 1.0, t);
    float lengthEnergy = pow(1.0 - t * 0.74, 1.45);

    // This keeps the shell complete from every viewing angle.
    // Fresnel adds a rim, but the surface never collapses into a half-open crescent.
    float closedSurface = 0.38 + fresnel * 0.62;

    float alpha =
      uOpacity *
      headFade *
      tailFade *
      lengthEnergy *
      closedSurface *
      (0.42 + filaments * 0.95);

    vec3 thermalColor = mix(uHeadColor, uMidColor, smoothstep(0.02, 0.38, t));
    thermalColor = mix(thermalColor, uTailColor, smoothstep(0.28, 1.0, t));

    float whiteHeat = pow(1.0 - t, 4.0) * (0.45 + filaments * 0.95);
    vec3 finalColor = thermalColor + uHotColor * whiteHeat;
    finalColor += uMidColor * filaments * 0.42;

    if (uDebugMode == 1) {
      gl_FragColor = vec4(vec3(closedSurface * headFade * tailFade), 1.0);
      return;
    }
    if (uDebugMode == 2) {
      gl_FragColor = vec4(vec3(filaments), 1.0);
      return;
    }
    if (uDebugMode == 3) {
      gl_FragColor = vec4(thermalColor / (thermalColor + vec3(1.0)), 1.0);
      return;
    }
    if (uDebugMode == 4) {
      gl_FragColor = vec4(vec3(alpha), 1.0);
      return;
    }

    gl_FragColor = vec4(finalColor * alpha * uGlow, alpha);
  }
`;

function smootherstep(edge0, edge1, value) {
  const x = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function createClosedWakeShellGeometry({
  length,
  radiusX,
  radiusY,
  expansion,
  radialSegments = 96,
  lengthSegments = 80,
  ripple = 0,
}) {
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];

  for (let slice = 0; slice <= lengthSegments; slice += 1) {
    const t = slice / lengthSegments;

    const headOpen = smootherstep(0, 0.08, t);
    const tailSpread = 1 + expansion * Math.pow(t, 1.18);
    const frontCompression = 0.72 + 0.28 * headOpen;
    const crossScale = tailSpread * frontCompression;

    const z = -length * t;
    const verticalStretch = 1 + 0.15 * t;

    for (let segment = 0; segment <= radialSegments; segment += 1) {
      const u = segment / radialSegments;
      const theta = u * TWO_PI;
      const c = Math.cos(theta);
      const s = Math.sin(theta);

      const wave =
        1 +
        ripple *
          t *
          (Math.sin(theta * 6 + t * 13) * 0.55 +
            Math.sin(theta * 11 - t * 9) * 0.25);

      const x = c * radiusX * crossScale * wave;
      const y = s * radiusY * crossScale * verticalStretch * wave;

      positions.push(x, y, z);

      const normal = new THREE.Vector3(c / radiusX, s / radiusY, 0.06 * t).normalize();
      normals.push(normal.x, normal.y, normal.z);

      uvs.push(u, t);
    }
  }

  const stride = radialSegments + 1;
  for (let slice = 0; slice < lengthSegments; slice += 1) {
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const a = slice * stride + segment;
      const b = a + stride;
      const c = b + 1;
      const d = a + 1;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();

  return geometry;
}

function makeWakeMaterial({
  opacity,
  glow,
  speed,
  noiseScale,
  rippleStrength,
  headColor,
  midColor,
  tailColor,
  hotColor,
}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: opacity },
      uGlow: { value: glow },
      uFlowSpeed: { value: speed },
      uNoiseScale: { value: noiseScale },
      uRippleStrength: { value: rippleStrength },
      uHeadColor: { value: new THREE.Color(headColor) },
      uMidColor: { value: new THREE.Color(midColor) },
      uTailColor: { value: new THREE.Color(tailColor) },
      uHotColor: { value: new THREE.Color(hotColor) },
      uDebugMode: { value: 0 },
    },
    vertexShader: wakeVertexShader,
    fragmentShader: wakeFragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

const shellConfigs = [
  {
    length: 5.9,
    radiusX: 0.42,
    radiusY: 1,
    expansion: 0.91,
    ripple: 0.022,
    opacity: 0.66,
    glow: 2.7,
    speed: 0.72,
    noiseScale: 6.2,
    rippleStrength: 0.024,
    headColor: 0xdcecff,
    midColor: 0x4bc7ff,
    tailColor: 0x1438ff,
    hotColor: 0xffffff,
    renderOrder: 4,
  },
  {
    length: 5.98,
    radiusX: 0.46,
    radiusY: 1.05,
    expansion: 0.94,
    ripple: 0.018,
    opacity: 0.47,
    glow: 2.28,
    speed: 0.61,
    noiseScale: 5.6,
    rippleStrength: 0.018,
    headColor: 0xc7ebff,
    midColor: 0x33b4ff,
    tailColor: 0x1c35ea,
    hotColor: 0xfdffff,
    renderOrder: 3,
  },
  {
    length: 6.06,
    radiusX: 0.5,
    radiusY: 1.1,
    expansion: 0.98,
    ripple: 0.014,
    opacity: 0.31,
    glow: 2.02,
    speed: 0.52,
    noiseScale: 5,
    rippleStrength: 0.014,
    headColor: 0xa6e3ff,
    midColor: 0x2495ff,
    tailColor: 0x1b28c2,
    hotColor: 0xf1fbff,
    renderOrder: 2,
  },
  {
    length: 6.14,
    radiusX: 0.54,
    radiusY: 1.15,
    expansion: 1.02,
    ripple: 0.01,
    opacity: 0.2,
    glow: 1.82,
    speed: 0.43,
    noiseScale: 4.5,
    rippleStrength: 0.01,
    headColor: 0x87dbff,
    midColor: 0x1b76ff,
    tailColor: 0x151a8e,
    hotColor: 0xe8f6ff,
    renderOrder: 1,
  },
  {
    length: 6.22,
    radiusX: 0.58,
    radiusY: 1.2,
    expansion: 1.06,
    ripple: 0.007,
    opacity: 0.11,
    glow: 1.58,
    speed: 0.35,
    noiseScale: 4,
    rippleStrength: 0.007,
    headColor: 0x71d5ff,
    midColor: 0x145fff,
    tailColor: 0x101455,
    hotColor: 0xdaf1ff,
    renderOrder: 0,
  },
];

export function createReentryPlasma() {
  const plasma = new THREE.Group();
  const materials = [];
  const geometries = [];

  for (const config of shellConfigs) {
    const geometry = createClosedWakeShellGeometry({
      length: config.length,
      radiusX: config.radiusX,
      radiusY: config.radiusY,
      expansion: config.expansion,
      radialSegments: 128,
      lengthSegments: 96,
      ripple: config.ripple,
    });

    const material = makeWakeMaterial(config);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    mesh.renderOrder = config.renderOrder;
    plasma.add(mesh);

    geometries.push(geometry);
    materials.push(material);
  }

  return {
    object: plasma,
    setDebugMode(modeName) {
      const modes = new Map([
        ["final", 0],
        ["shell-coverage", 1],
        ["filaments", 2],
        ["thermal-color", 3],
        ["opacity", 4],
      ]);
      const mode = modes.get(modeName) ?? 0;
      for (const material of materials) {
        material.uniforms.uDebugMode.value = mode;
      }
    },
    update(elapsed) {
      for (const material of materials) {
        material.uniforms.uTime.value = elapsed;
      }
    },
    dispose() {
      for (const geometry of geometries) {
        geometry.dispose();
      }
      for (const material of materials) {
        material.dispose();
      }
    },
  };
}
