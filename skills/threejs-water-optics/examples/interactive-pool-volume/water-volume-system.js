import * as THREE from "three";

export const poolWaterDebugModes = new Map([
  ["final", 0],
  ["height", 1],
  ["normals", 2],
  ["velocity", 3],
  ["caustics", 4],
]);

export const interactivePoolWaterAssetPaths = {
  tiles: "/skills/threejs-water-optics/assets/interactive-pool-volume/tiles.jpg",
  skybox: [
    "/skills/threejs-water-optics/assets/interactive-pool-volume/xpos.jpg",
    "/skills/threejs-water-optics/assets/interactive-pool-volume/xneg.jpg",
    "/skills/threejs-water-optics/assets/interactive-pool-volume/ypos.jpg",
    "/skills/threejs-water-optics/assets/interactive-pool-volume/ypos.jpg",
    "/skills/threejs-water-optics/assets/interactive-pool-volume/zpos.jpg",
    "/skills/threejs-water-optics/assets/interactive-pool-volume/zneg.jpg",
  ],
};

const passVertexShader = `
  varying vec2 vUv;

  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

function createSimulationTarget(resolution) {
  const target = new THREE.WebGLRenderTarget(resolution, resolution, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    depthBuffer: false,
    stencilBuffer: false,
  });
  target.texture.generateMipmaps = false;
  return target;
}

function createPassMaterial(fragmentShader, uniforms = {}) {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms,
    vertexShader: passVertexShader,
    fragmentShader,
  });
}

export class InteractiveWaterHeightfield {
  constructor(renderer, {
    resolution = 256,
    damping = 0.995,
    waveSpeed = 2,
  } = {}) {
    this.renderer = renderer;
    this.resolution = resolution;
    this.textureA = createSimulationTarget(resolution);
    this.textureB = createSimulationTarget(resolution);
    this.camera = new THREE.Camera();
    this.scene = new THREE.Scene();
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    this.scene.add(this.quad);

    this.dropMaterial = createPassMaterial(
      `
        precision highp float;
        const float PI = 3.141592653589793;
        uniform sampler2D tInput;
        uniform vec2 center;
        uniform float radius;
        uniform float strength;
        varying vec2 vUv;

        void main() {
          vec4 info = texture2D(tInput, vUv);
          float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - vUv) / radius);
          drop = 0.5 - cos(drop * PI) * 0.5;
          info.r += drop * strength;
          gl_FragColor = info;
        }
      `,
      {
        tInput: { value: null },
        center: { value: new THREE.Vector2() },
        radius: { value: 0.05 },
        strength: { value: 0.1 },
      },
    );

    this.sphereMaterial = createPassMaterial(
      `
        precision highp float;
        uniform sampler2D tInput;
        uniform vec3 oldCenter;
        uniform vec3 newCenter;
        uniform float radius;
        uniform float displacementScale;
        varying vec2 vUv;

        float volumeInSphere(vec3 center) {
          vec3 toCenter = vec3(vUv.x * 2.0 - 1.0, 0.0, vUv.y * 2.0 - 1.0) - center;
          float t = length(toCenter) / radius;
          float dy = exp(-pow(t * 1.5, 6.0));
          float ymin = min(0.0, center.y - dy);
          float ymax = min(max(0.0, center.y + dy), ymin + 2.0 * dy);
          return (ymax - ymin) * 0.1 * displacementScale;
        }

        void main() {
          vec4 info = texture2D(tInput, vUv);
          info.r += volumeInSphere(oldCenter);
          info.r -= volumeInSphere(newCenter);
          gl_FragColor = info;
        }
      `,
      {
        tInput: { value: null },
        oldCenter: { value: new THREE.Vector3() },
        newCenter: { value: new THREE.Vector3() },
        radius: { value: 0.07 },
        displacementScale: { value: 0.6 },
      },
    );

    this.stepMaterial = createPassMaterial(
      `
        precision highp float;
        uniform sampler2D tInput;
        uniform vec2 delta;
        uniform float damping;
        uniform float waveSpeed;
        varying vec2 vUv;

        void main() {
          vec4 info = texture2D(tInput, vUv);
          vec2 dx = vec2(delta.x, 0.0);
          vec2 dy = vec2(0.0, delta.y);
          float average = (
            texture2D(tInput, vUv - dx).r +
            texture2D(tInput, vUv + dx).r +
            texture2D(tInput, vUv - dy).r +
            texture2D(tInput, vUv + dy).r
          ) * 0.25;
          info.g += (average - info.r) * waveSpeed;
          info.g *= damping;
          info.r += info.g;
          gl_FragColor = info;
        }
      `,
      {
        tInput: { value: null },
        delta: { value: new THREE.Vector2(1 / resolution, 1 / resolution) },
        damping: { value: damping },
        waveSpeed: { value: waveSpeed },
      },
    );

    this.normalMaterial = createPassMaterial(
      `
        precision highp float;
        uniform sampler2D tInput;
        uniform vec2 delta;
        varying vec2 vUv;

        void main() {
          vec4 info = texture2D(tInput, vUv);
          vec3 dx = vec3(
            delta.x,
            texture2D(tInput, vec2(vUv.x + delta.x, vUv.y)).r - info.r,
            0.0
          );
          vec3 dy = vec3(
            0.0,
            texture2D(tInput, vec2(vUv.x, vUv.y + delta.y)).r - info.r,
            delta.y
          );
          info.ba = normalize(cross(dy, dx)).xz;
          gl_FragColor = info;
        }
      `,
      {
        tInput: { value: null },
        delta: { value: new THREE.Vector2(1 / resolution, 1 / resolution) },
      },
    );

    this.clear();
  }

  get texture() {
    return this.textureA.texture;
  }

  clear() {
    const previousTarget = this.renderer.getRenderTarget();
    const previousColor = new THREE.Color();
    this.renderer.getClearColor(previousColor);
    const previousAlpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setRenderTarget(this.textureA);
    this.renderer.clear();
    this.renderer.setRenderTarget(this.textureB);
    this.renderer.clear();
    this.renderer.setRenderTarget(previousTarget);
    this.renderer.setClearColor(previousColor, previousAlpha);
  }

  swap() {
    const next = this.textureA;
    this.textureA = this.textureB;
    this.textureB = next;
  }

  renderPass(material) {
    this.quad.material = material;
    material.uniforms.tInput.value = this.textureA.texture;
    this.renderer.setRenderTarget(this.textureB);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.swap();
  }

  addDrop(x, z, radius = 0.06, strength = 0.12) {
    this.dropMaterial.uniforms.center.value.set(x, z);
    this.dropMaterial.uniforms.radius.value = radius;
    this.dropMaterial.uniforms.strength.value = strength;
    this.renderPass(this.dropMaterial);
  }

  moveSphere(oldCenter, newCenter, radius, {
    width = 1,
    depth = 1,
    displacementScale = 0.6,
  } = {}) {
    const halfWidth = width * 0.5;
    const halfDepth = depth * 0.5;
    const verticalScale = Math.max(halfWidth, halfDepth);
    const normalizeCenter = (source, target) => {
      target.set(
        source.x / halfWidth,
        source.y / verticalScale,
        source.z / halfDepth,
      );
    };
    normalizeCenter(oldCenter, this.sphereMaterial.uniforms.oldCenter.value);
    normalizeCenter(newCenter, this.sphereMaterial.uniforms.newCenter.value);
    this.sphereMaterial.uniforms.radius.value =
      radius / verticalScale;
    this.sphereMaterial.uniforms.displacementScale.value = displacementScale;
    this.renderPass(this.sphereMaterial);
  }

  stepSimulation(iterations = 1) {
    for (let index = 0; index < iterations; index += 1) {
      this.renderPass(this.stepMaterial);
    }
  }

  updateNormals() {
    this.renderPass(this.normalMaterial);
  }

  dispose() {
    this.textureA.dispose();
    this.textureB.dispose();
    this.quad.geometry.dispose();
    this.dropMaterial.dispose();
    this.sphereMaterial.dispose();
    this.stepMaterial.dispose();
    this.normalMaterial.dispose();
  }
}

function createPoolOpticsUniforms({
  waterTexture = null,
  causticTexture = null,
  tileTexture = null,
  skybox = null,
  sunDirection = new THREE.Vector3(2, 2, -1).normalize(),
  sphereCenter = new THREE.Vector3(-0.4, -0.75, 0.2),
  sphereRadius = 0.25,
  sphereEnabled = true,
} = {}) {
  return {
    light: { value: sunDirection.clone().normalize() },
    sphereCenter: { value: sphereCenter.clone() },
    sphereRadius: { value: sphereRadius },
    sphereEnabled: { value: sphereEnabled },
    tiles: { value: tileTexture },
    causticTex: { value: causticTexture },
    water: { value: waterTexture },
    sky: { value: skybox },
    eye: { value: new THREE.Vector3() },
    uDebugMode: { value: 0 },
  };
}

const poolCausticsVertexShader = `
  precision highp float;
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float poolHeight = 1.0;
  uniform vec3 light;
  uniform sampler2D water;
  varying vec3 oldPos;
  varying vec3 newPos;
  varying vec3 ray;

  vec2 intersectCube(vec3 origin, vec3 r, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / r;
    vec3 tMax = (cubeMax - origin) / r;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }

  vec3 project(vec3 origin, vec3 r, vec3 refractedLight) {
    vec2 tcube = intersectCube(origin, r, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
    origin += r * tcube.y;
    float tplane = (-origin.y - 1.0) / refractedLight.y;
    return origin + refractedLight * tplane;
  }

  void main() {
    vec4 info = texture2D(water, position.xy * 0.5 + 0.5);
    info.ba *= 0.5;
    vec2 slope = clamp(info.ba, vec2(-0.999), vec2(0.999));
    float slopeLengthSq = min(dot(slope, slope), 0.999);
    vec3 normal = normalize(vec3(slope.x, sqrt(max(0.001, 1.0 - slopeLengthSq)), slope.y));
    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    ray = refract(-light, normal, IOR_AIR / IOR_WATER);
    oldPos = project(position.xzy, refractedLight, refractedLight);
    newPos = project(position.xzy + vec3(0.0, info.r, 0.0), ray, refractedLight);
    gl_Position = vec4(0.75 * (newPos.xz + refractedLight.xz / refractedLight.y), 0.0, 1.0);
  }
`;

const poolCausticsFragmentShader = `
  precision highp float;
  const float IOR_AIR = 1.0;
  const float IOR_WATER = 1.333;
  const float poolHeight = 1.0;
  uniform vec3 light;
  uniform vec3 sphereCenter;
  uniform float sphereRadius;
  uniform bool sphereEnabled;
  varying vec3 oldPos;
  varying vec3 newPos;

  vec2 intersectCube(vec3 origin, vec3 r, vec3 cubeMin, vec3 cubeMax) {
    vec3 tMin = (cubeMin - origin) / r;
    vec3 tMax = (cubeMax - origin) / r;
    vec3 t1 = min(tMin, tMax);
    vec3 t2 = max(tMin, tMax);
    float tNear = max(max(t1.x, t1.y), t1.z);
    float tFar = min(min(t2.x, t2.y), t2.z);
    return vec2(tNear, tFar);
  }

  void main() {
    float oldArea = length(dFdx(oldPos)) * length(dFdy(oldPos));
    float newArea = length(dFdx(newPos)) * length(dFdy(newPos));
    gl_FragColor = vec4(oldArea / newArea * 0.2, 1.0, 0.0, 0.0);

    vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
    if (sphereEnabled) {
      vec3 dir = (sphereCenter - newPos) / sphereRadius;
      vec3 area = cross(dir, refractedLight);
      float shadow = dot(area, area);
      float dist = dot(dir, -refractedLight);
      shadow = 1.0 + (shadow - 1.0) / (0.05 + dist * 0.025);
      shadow = clamp(1.0 / (1.0 + exp(-shadow)), 0.0, 1.0);
      shadow = mix(1.0, shadow, clamp(dist * 2.0, 0.0, 1.0));
      gl_FragColor.g = shadow;
    }

    vec2 t = intersectCube(
      newPos,
      -refractedLight,
      vec3(-1.0, -poolHeight, -1.0),
      vec3(1.0, 2.0, 1.0)
    );
    gl_FragColor.r *=
      1.0 /
      (1.0 +
        exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (newPos.y - refractedLight.y * t.y - 2.0 / 12.0)));
  }
`;

export class PoolCausticsPass {
  constructor(renderer, {
    waterTexture,
    sunDirection = new THREE.Vector3(2, 2, -1).normalize(),
    sphereCenter = new THREE.Vector3(-0.4, -0.75, 0.2),
    sphereRadius = 0.25,
    resolution = 1024,
  } = {}) {
    this.renderer = renderer;
    this.target = new THREE.WebGLRenderTarget(resolution, resolution, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
    });
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.material = new THREE.ShaderMaterial({
      vertexShader: poolCausticsVertexShader,
      fragmentShader: poolCausticsFragmentShader,
      uniforms: {
        light: { value: sunDirection.clone().normalize() },
        water: { value: waterTexture },
        sphereCenter: { value: sphereCenter.clone() },
        sphereRadius: { value: sphereRadius },
        sphereEnabled: { value: true },
      },
      blending: THREE.NoBlending,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
      extensions: { derivatives: true },
    });
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 200, 200), this.material);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);
  }

  get texture() {
    return this.target.texture;
  }

  setSphere(center, radius = 0.25, enabled = true) {
    this.material.uniforms.sphereCenter.value.copy(center);
    this.material.uniforms.sphereRadius.value = radius;
    this.material.uniforms.sphereEnabled.value = enabled;
  }

  update(waterTexture) {
    this.material.uniforms.water.value = waterTexture;
    const previousTarget = this.renderer.getRenderTarget();
    const previousColor = new THREE.Color();
    this.renderer.getClearColor(previousColor);
    const previousAlpha = this.renderer.getClearAlpha();
    this.renderer.setRenderTarget(this.target);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(previousTarget);
    this.renderer.setClearColor(previousColor, previousAlpha);
  }

  dispose() {
    this.target.dispose();
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

function createPoolInteriorGeometry() {
  const geometry = new THREE.BoxGeometry(2, 2, 2);
  const positions = geometry.attributes.position;
  const source = geometry.index;
  const indices = [];

  for (let index = 0; index < source.count; index += 3) {
    const a = source.getX(index);
    const b = source.getX(index + 1);
    const c = source.getX(index + 2);
    if (!(positions.getY(a) < 0 && positions.getY(b) < 0 && positions.getY(c) < 0)) {
      indices.push(a, b, c);
    }
  }

  geometry.setIndex(indices);
  return geometry;
}

export function createPoolInteriorMaterial(options = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: `
      precision highp float;
      const float poolHeight = 1.0;
      varying vec3 vPosition;

      void main() {
        vPosition = position.xyz;
        vPosition.y = ((1.0 - vPosition.y) * (7.0 / 12.0) - 1.0) * poolHeight;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      const float IOR_AIR = 1.0;
      const float IOR_WATER = 1.333;
      const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);
      const float poolHeight = 1.0;
      uniform vec3 light;
      uniform vec3 sphereCenter;
      uniform float sphereRadius;
      uniform bool sphereEnabled;
      uniform sampler2D tiles;
      uniform sampler2D causticTex;
      uniform sampler2D water;
      uniform int uDebugMode;
      varying vec3 vPosition;

      vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
        vec3 tMin = (cubeMin - origin) / ray;
        vec3 tMax = (cubeMax - origin) / ray;
        vec3 t1 = min(tMin, tMax);
        vec3 t2 = max(tMin, tMax);
        float tNear = max(max(t1.x, t1.y), t1.z);
        float tFar = min(min(t2.x, t2.y), t2.z);
        return vec2(tNear, tFar);
      }

      vec3 getWallColor(vec3 point) {
        float scale = 0.5;
        vec3 wallColor;
        vec3 normal;
        if (abs(point.x) > 0.999) {
          wallColor = texture2D(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
          normal = vec3(-point.x, 0.0, 0.0);
        } else if (abs(point.z) > 0.999) {
          wallColor = texture2D(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
          normal = vec3(0.0, 0.0, -point.z);
        } else {
          wallColor = texture2D(tiles, point.xz * 0.5 + 0.5).rgb;
          normal = vec3(0.0, 1.0, 0.0);
        }

        scale /= length(point);
        if (sphereEnabled) {
          scale *= 1.0 - 0.9 / pow(max(length(point - sphereCenter) / sphereRadius, 1.0), 4.0);
        }

        vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
        float diffuse = max(0.0, dot(refractedLight, normal));
        vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
        if (point.y < info.r) {
          vec4 caustic = texture2D(
            causticTex,
            0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5
          );
          scale += diffuse * caustic.r * 2.0 * caustic.g;
        } else {
          vec2 t = intersectCube(
            point,
            refractedLight,
            vec3(-1.0, -poolHeight, -1.0),
            vec3(1.0, 2.0, 1.0)
          );
          diffuse *=
            1.0 /
            (1.0 +
              exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
          scale += diffuse * 0.5;
        }
        return wallColor * scale;
      }

      void main() {
        if (uDebugMode == 4) {
          vec4 caustic = texture2D(causticTex, 0.75 * vPosition.xz * 0.5 + 0.5);
          gl_FragColor = vec4(vec3(caustic.r * caustic.g), 1.0);
          return;
        }
        gl_FragColor = vec4(getWallColor(vPosition), 1.0);
        vec4 info = texture2D(water, vPosition.xz * 0.5 + 0.5);
        if (vPosition.y < info.r) {
          gl_FragColor.rgb *= underwaterColor * 1.2;
        }
      }
    `,
    uniforms: createPoolOpticsUniforms(options),
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: true,
  });
}

export function createPoolInteriorMesh({ material } = {}) {
  const mesh = new THREE.Mesh(createPoolInteriorGeometry(), material);
  mesh.frustumCulled = false;
  return mesh;
}

export function createPoolSphereMaterial(options = {}) {
  return new THREE.ShaderMaterial({
    vertexShader: `
      precision highp float;
      varying vec3 vPosition;

      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      precision highp float;
      const float IOR_AIR = 1.0;
      const float IOR_WATER = 1.333;
      const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);
      uniform vec3 light;
      uniform vec3 sphereCenter;
      uniform float sphereRadius;
      uniform float poolWidth;
      uniform float poolHeight;
      uniform float poolLength;
      uniform sampler2D water;
      uniform sampler2D causticTex;
      varying vec3 vPosition;

      vec3 getSphereColor(vec3 point) {
        vec3 color = vec3(0.5);
        color *= 1.0 - 0.9 / pow((poolWidth + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
        color *= 1.0 - 0.9 / pow((poolLength + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
        color *= 1.0 - 0.9 / pow((point.y + poolHeight + sphereRadius) / sphereRadius, 3.0);
        vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
        vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
        float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
        vec4 info = texture2D(water, point.xz * vec2(0.5 / poolWidth, 0.5 / poolLength) + 0.5);
        if (point.y < info.r) {
          vec4 caustic = texture2D(
            causticTex,
            0.75 *
              (point.xz - point.y * refractedLight.xz / refractedLight.y) *
              vec2(0.5 / poolWidth, 0.5 / poolLength) +
              0.5
          );
          diffuse *= caustic.r * 4.0;
        }
        color += diffuse;
        return color;
      }

      void main() {
        gl_FragColor = vec4(getSphereColor(vPosition), 1.0);
        vec4 info = texture2D(water, vPosition.xz * vec2(0.5 / poolWidth, 0.5 / poolLength) + 0.5);
        if (vPosition.y < info.r) {
          gl_FragColor.rgb *= underwaterColor * 1.2;
        }
      }
    `,
    uniforms: {
      ...createPoolOpticsUniforms(options),
      poolWidth: { value: 1.0 },
      poolHeight: { value: 1.0 },
      poolLength: { value: 1.0 },
    },
    depthTest: true,
    depthWrite: true,
  });
}

export function createInteractiveWaterSurfaceMaterial(options = {}) {
  return new THREE.ShaderMaterial({
    uniforms: createPoolOpticsUniforms(options),
    side: THREE.BackSide,
    depthTest: true,
    depthWrite: true,
    vertexShader: `
      precision highp float;
      uniform sampler2D water;
      varying vec3 vPosition;

      void main() {
        vec4 info = texture2D(water, position.xy * 0.5 + 0.5);
        vPosition = position.xzy;
        vPosition.y += info.r;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      const float IOR_AIR = 1.0;
      const float IOR_WATER = 1.333;
      const vec3 abovewaterColor = vec3(0.25, 1.0, 1.25);
      const vec3 underwaterColor = vec3(0.4, 0.9, 1.0);
      const float poolHeight = 1.0;
      uniform vec3 light;
      uniform vec3 sphereCenter;
      uniform float sphereRadius;
      uniform bool sphereEnabled;
      uniform sampler2D tiles;
      uniform sampler2D causticTex;
      uniform sampler2D water;
      uniform samplerCube sky;
      uniform vec3 eye;
      uniform int uDebugMode;
      varying vec3 vPosition;

      vec2 intersectCube(vec3 origin, vec3 ray, vec3 cubeMin, vec3 cubeMax) {
        vec3 tMin = (cubeMin - origin) / ray;
        vec3 tMax = (cubeMax - origin) / ray;
        vec3 t1 = min(tMin, tMax);
        vec3 t2 = max(tMin, tMax);
        float tNear = max(max(t1.x, t1.y), t1.z);
        float tFar = min(min(t2.x, t2.y), t2.z);
        return vec2(tNear, tFar);
      }

      float intersectSphere(vec3 origin, vec3 ray, vec3 center, float radius) {
        vec3 toSphere = origin - center;
        float a = dot(ray, ray);
        float b = 2.0 * dot(toSphere, ray);
        float c = dot(toSphere, toSphere) - radius * radius;
        float discriminant = b * b - 4.0 * a * c;
        if (discriminant > 0.0) {
          float t = (-b - sqrt(discriminant)) / (2.0 * a);
          if (t > 0.0) return t;
        }
        return 1.0e6;
      }

      vec3 getSphereColor(vec3 point) {
        vec3 color = vec3(0.5);
        color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.x)) / sphereRadius, 3.0);
        color *= 1.0 - 0.9 / pow((1.0 + sphereRadius - abs(point.z)) / sphereRadius, 3.0);
        color *= 1.0 - 0.9 / pow((point.y + poolHeight + sphereRadius) / sphereRadius, 3.0);
        vec3 sphereNormal = (point - sphereCenter) / sphereRadius;
        vec3 refractedLight = refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
        float diffuse = max(0.0, dot(-refractedLight, sphereNormal)) * 0.5;
        vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
        if (point.y < info.r) {
          vec4 caustic = texture2D(
            causticTex,
            0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5
          );
          diffuse *= caustic.r * 4.0;
        }
        color += diffuse;
        return color;
      }

      vec3 getWallColor(vec3 point) {
        float scale = 0.5;
        vec3 wallColor;
        vec3 normal;
        if (abs(point.x) > 0.999) {
          wallColor = texture2D(tiles, point.yz * 0.5 + vec2(1.0, 0.5)).rgb;
          normal = vec3(-point.x, 0.0, 0.0);
        } else if (abs(point.z) > 0.999) {
          wallColor = texture2D(tiles, point.yx * 0.5 + vec2(1.0, 0.5)).rgb;
          normal = vec3(0.0, 0.0, -point.z);
        } else {
          wallColor = texture2D(tiles, point.xz * 0.5 + 0.5).rgb;
          normal = vec3(0.0, 1.0, 0.0);
        }

        scale /= length(point);
        if (sphereEnabled) {
          scale *= 1.0 - 0.9 / pow(max(length(point - sphereCenter) / sphereRadius, 1.0), 4.0);
        }

        vec3 refractedLight = -refract(-light, vec3(0.0, 1.0, 0.0), IOR_AIR / IOR_WATER);
        float diffuse = max(0.0, dot(refractedLight, normal));
        vec4 info = texture2D(water, point.xz * 0.5 + 0.5);
        if (point.y < info.r) {
          vec4 caustic = texture2D(
            causticTex,
            0.75 * (point.xz - point.y * refractedLight.xz / refractedLight.y) * 0.5 + 0.5
          );
          scale += diffuse * caustic.r * 2.0 * caustic.g;
        } else {
          vec2 t = intersectCube(
            point,
            refractedLight,
            vec3(-1.0, -poolHeight, -1.0),
            vec3(1.0, 2.0, 1.0)
          );
          diffuse *=
            1.0 /
            (1.0 +
              exp(-200.0 / (1.0 + 10.0 * (t.y - t.x)) * (point.y + refractedLight.y * t.y - 2.0 / 12.0)));
          scale += diffuse * 0.5;
        }
        return wallColor * scale;
      }

      vec3 getSurfaceRayColor(vec3 origin, vec3 ray, vec3 waterColor) {
        vec3 color;
        float sphereDistance = sphereEnabled
          ? intersectSphere(origin, ray, sphereCenter, sphereRadius)
          : 1.0e6;
        if (sphereDistance < 1.0e6) {
          color = getSphereColor(origin + ray * sphereDistance);
        } else if (ray.y < 0.0) {
          vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
          color = getWallColor(origin + ray * t.y);
        } else {
          vec2 t = intersectCube(origin, ray, vec3(-1.0, -poolHeight, -1.0), vec3(1.0, 2.0, 1.0));
          vec3 hit = origin + ray * t.y;
          if (hit.y < 2.0 / 12.0) {
            color = getWallColor(hit);
          } else {
            color = textureCube(sky, ray).rgb;
            color += vec3(pow(max(0.0, dot(light, ray)), 5000.0)) * vec3(10.0, 8.0, 6.0);
          }
        }
        if (ray.y < 0.0) color *= waterColor;
        return color;
      }

      void main() {
        vec2 coord = vPosition.xz * 0.5 + 0.5;
        vec4 info = texture2D(water, coord);
        for (int i = 0; i < 5; i++) {
          coord = clamp(coord + info.ba * 0.005, 0.0, 1.0);
          info = texture2D(water, coord);
        }
        vec2 slope = clamp(info.ba, vec2(-0.999), vec2(0.999));
        float slopeLengthSq = min(dot(slope, slope), 0.999);
        vec3 normal = normalize(vec3(slope.x, sqrt(max(0.001, 1.0 - slopeLengthSq)), slope.y));

        if (uDebugMode == 1) {
          gl_FragColor = vec4(mix(vec3(0.03, 0.08, 0.14), vec3(0.8, 0.25, 0.08), info.r * 5.0 + 0.5), 1.0);
          return;
        }
        if (uDebugMode == 2) {
          gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
          return;
        }
        if (uDebugMode == 3) {
          gl_FragColor = vec4(vec3(abs(info.g) * 12.0), 1.0);
          return;
        }

        vec3 incomingRay = normalize(vPosition - eye);
        vec3 reflectedRay = reflect(incomingRay, normal);
        vec3 refractedRay = refract(incomingRay, normal, IOR_AIR / IOR_WATER);
        float fresnel = mix(0.25, 1.0, pow(1.0 - dot(normal, -incomingRay), 3.0));
        vec3 reflectedColor = getSurfaceRayColor(vPosition, reflectedRay, abovewaterColor);
        vec3 refractedColor = getSurfaceRayColor(vPosition, refractedRay, abovewaterColor);
        gl_FragColor = vec4(mix(refractedColor, reflectedColor, fresnel), 1.0);
      }
    `,
  });
}

export function createInteractiveWaterSurfaceMesh({
  width = 2,
  depth = 2,
  segments = 200,
  material,
} = {}) {
  const geometry = new THREE.PlaneGeometry(width, depth, segments, segments);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  return mesh;
}
