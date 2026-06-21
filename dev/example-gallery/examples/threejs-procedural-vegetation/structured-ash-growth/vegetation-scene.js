import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SMAAPass } from "three/addons/postprocessing/SMAAPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ashMedium } from
  "/skills/threejs-procedural-vegetation/examples/structured-ash-growth/ash-preset.js";
import { compileAshTree } from
  "/skills/threejs-procedural-vegetation/examples/structured-ash-growth/tree-system.js";

export async function createVegetationScene({
  renderer,
  scene,
  camera,
}) {

class SceneRandom {
  constructor(seed) {
    this.state = seed >>> 0;
  }

  value() {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 4294967296;
  }

  range(min, max) {
    return THREE.MathUtils.lerp(min, max, this.value());
  }
}

function simplex2d(x, y) {
  const c0 = 0.211324865405187;
  const c1 = 0.366025403784439;
  const c2 = -0.577350269189626;
  const c3 = 0.024390243902439;
  let ix = Math.floor(x + c1 * (x + y));
  let iy = Math.floor(y + c1 * (x + y));
  const x0 = x - ix + c0 * (ix + iy);
  const y0 = y - iy + c0 * (ix + iy);
  const i1x = x0 > y0 ? 1 : 0;
  const i1y = x0 > y0 ? 0 : 1;
  const x1 = x0 + c0 - i1x;
  const y1 = y0 + c0 - i1y;
  const x2 = x0 + c2;
  const y2 = y0 + c2;
  ix -= Math.floor(ix / 289) * 289;
  iy -= Math.floor(iy / 289) * 289;

  const mod289 = (value) => value - Math.floor(value / 289) * 289;
  const permute = (value) => mod289(((value * 34) + 1) * value);
  const p0 = permute(permute(iy) + ix);
  const p1 = permute(permute(iy + i1y) + ix + i1x);
  const p2 = permute(permute(iy + 1) + ix + 1);
  const contribution = (px, py, p) => {
    let m = Math.max(0, 0.5 - px * px - py * py);
    m *= m;
    m *= m;
    const gx = 2 * ((p * c3) - Math.floor(p * c3)) - 1;
    const h = Math.abs(gx) - 0.5;
    const a0 = gx - Math.floor(gx + 0.5);
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    return m * (a0 * px + h * py);
  };
  return 130 * (
    contribution(x0, y0, p0) +
    contribution(x1, y1, p1) +
    contribution(x2, y2, p2)
  );
}

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
scene.fog = new THREE.FogExp2(0x94b9f8, 0.0015);

const textureLoader = new THREE.TextureLoader();
const [
  barkColor,
  barkNormal,
  barkRoughness,
  leafTexture,
  groundGrass,
  groundDirt,
  groundNormal,
] = await Promise.all([
  textureLoader.loadAsync("/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/bark-color.jpg"),
  textureLoader.loadAsync("/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/bark-normal.jpg"),
  textureLoader.loadAsync("/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/bark-roughness.jpg"),
  textureLoader.loadAsync("/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/ash.png"),
  textureLoader.loadAsync("/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/ground-grass.jpg"),
  textureLoader.loadAsync("/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/ground-dirt.jpg"),
  textureLoader.loadAsync("/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/ground-normal.jpg"),
]);

for (const texture of [
  barkColor,
  barkNormal,
  barkRoughness,
  groundGrass,
  groundDirt,
  groundNormal,
]) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
}
barkColor.colorSpace = THREE.SRGBColorSpace;
leafTexture.colorSpace = THREE.SRGBColorSpace;
leafTexture.premultiplyAlpha = true;
groundGrass.colorSpace = THREE.SRGBColorSpace;
groundDirt.colorSpace = THREE.SRGBColorSpace;
barkColor.repeat.set(1, 1 / ashMedium.bark.textureScaleY);
barkNormal.repeat.copy(barkColor.repeat);
barkRoughness.repeat.copy(barkColor.repeat);

const compiled = compileAshTree(ashMedium);

const barkMaterial = new THREE.MeshPhongMaterial({
  color: ashMedium.bark.tint,
  map: barkColor,
  normalMap: barkNormal,
  shininess: 7,
});
barkMaterial.specular.setScalar(0.12);

const leafMaterial = new THREE.MeshPhongMaterial({
  color: 0xffffff,
  map: leafTexture,
  side: THREE.DoubleSide,
  alphaTest: ashMedium.leaves.alphaTest,
  dithering: true,
});
leafMaterial.specular.setScalar(0.03);

const leafWindUniforms = {
  time: { value: 0 },
  strength: { value: new THREE.Vector3(0.5, 0, 0.5) },
  frequency: { value: 0.5 },
  scale: { value: 70 },
};

leafMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = leafWindUniforms.time;
  shader.uniforms.uWindStrength = leafWindUniforms.strength;
  shader.uniforms.uWindFrequency = leafWindUniforms.frequency;
  shader.uniforms.uWindScale = leafWindUniforms.scale;
  shader.vertexShader = `
    uniform float uTime;
    uniform vec3 uWindStrength;
    uniform float uWindFrequency;
    uniform float uWindScale;
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    vec4 mod289(vec4 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    vec4 permute(vec4 x) {
      return mod289(((x * 34.0) + 1.0) * x);
    }
    vec4 taylorInvSqrt(vec4 r) {
      return 1.79284291400159 - 0.85373472095314 * r;
    }
    float simplex3(vec3 v) {
      const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(
        permute(
          permute(i.z + vec4(0, i1.z, i2.z, 1)) +
          i.y + vec4(0, i1.y, i2.y, 1)
        ) + i.x + vec4(0, i1.x, i2.x, 1)
      );
      float n = 1.0 / 7.0;
      vec3 ns = n * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 g0 = vec3(a0.xy, h.x);
      vec3 g1 = vec3(a0.zw, h.y);
      vec3 g2 = vec3(a1.xy, h.z);
      vec3 g3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(
        dot(g0, g0),
        dot(g1, g1),
        dot(g2, g2),
        dot(g3, g3)
      ));
      g0 *= norm.x;
      g1 *= norm.y;
      g2 *= norm.z;
      g3 *= norm.w;
      vec4 m = max(0.6 - vec4(
        dot(x0, x0),
        dot(x1, x1),
        dot(x2, x2),
        dot(x3, x3)
      ), 0.0);
      m *= m;
      return 42.0 * dot(m * m, vec4(
        dot(g0, x0),
        dot(g1, x1),
        dot(g2, x2),
        dot(g3, x3)
      ));
    }
  ${shader.vertexShader}`;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <begin_vertex>",
    `
      #include <begin_vertex>
      float windPhase = 6.2831853 * simplex3(position / uWindScale);
      float wind =
        0.5 * sin(uTime * uWindFrequency + windPhase)
        + 0.3 * sin(2.0 * uTime * uWindFrequency + 1.3 * windPhase)
        + 0.2 * sin(5.0 * uTime * uWindFrequency + 1.5 * windPhase);
      transformed += uv.y * uWindStrength * wind;
    `,
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <normal_fragment_begin>",
    THREE.ShaderChunk.normal_fragment_begin.replace(
      "normal *= faceDirection;",
      "",
    ),
  );
};
leafMaterial.customProgramCacheKey = () => "ash-rooted-leaf-wind-v1";

const hierarchyBranchMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    attribute float aLevel;
    varying float vLevel;
    void main() {
      vLevel = aLevel;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying float vLevel;
    vec3 palette(float level) {
      if (level < 0.12) return vec3(0.13, 0.03, 0.01);
      if (level < 0.48) return vec3(0.78, 0.16, 0.03);
      if (level < 0.82) return vec3(1.0, 0.55, 0.02);
      return vec3(1.0, 0.94, 0.18);
    }
    void main() {
      gl_FragColor = vec4(palette(vLevel), 1.0);
    }
  `,
});

const hierarchyLeafMaterial = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  vertexShader: `
    attribute float aLevel;
    varying vec2 vUv;
    varying float vLevel;
    void main() {
      vUv = uv;
      vLevel = aLevel;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D uLeaf;
    varying vec2 vUv;
    varying float vLevel;
    void main() {
      if (texture2D(uLeaf, vUv).a < 0.5) discard;
      gl_FragColor = vec4(mix(vec3(0.05, 0.32, 0.04), vec3(0.42, 1.0, 0.18), vLevel), 1.0);
    }
  `,
  uniforms: { uLeaf: { value: leafTexture } },
});

const continuationMaterial = new THREE.ShaderMaterial({
  vertexShader: `
    attribute float aContinuation;
    varying float vContinuation;
    void main() {
      vContinuation = aContinuation;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying float vContinuation;
    void main() {
      vec3 lateral = vec3(0.08, 0.34, 0.95);
      vec3 continuation = vec3(1.0, 0.14, 0.025);
      gl_FragColor = vec4(mix(lateral, continuation, vContinuation), 1.0);
    }
  `,
});

const branchNormalMaterial = new THREE.MeshNormalMaterial();
const leafNormalMaterial = new THREE.MeshNormalMaterial({
  side: THREE.DoubleSide,
  alphaTest: ashMedium.leaves.alphaTest,
  map: leafTexture,
});

function createTreeObject() {
  const group = new THREE.Group();
  const branches = new THREE.Mesh(compiled.branchGeometry, barkMaterial);
  const leaves = new THREE.Mesh(compiled.leafGeometry, leafMaterial);
  branches.castShadow = true;
  branches.receiveShadow = true;
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  group.add(branches, leaves);
  group.userData = { branches, leaves };
  return group;
}

const foregroundTree = createTreeObject();
scene.add(foregroundTree);

const forest = new THREE.Group();
forest.name = "Forest";
const forestRandom = new SceneRandom(9172);
for (let index = 0; index < 100; index += 1) {
  const distance = 175 + forestRandom.value() * 500;
  const angle = forestRandom.range(0, Math.PI * 2);
  const tree = createTreeObject();
  tree.position.set(
    Math.cos(angle) * distance,
    0,
    Math.sin(angle) * distance,
  );
  tree.rotation.y = forestRandom.range(0, Math.PI * 2);
  tree.scale.setScalar(forestRandom.range(0.58, 1.45));
  forest.add(tree);
}
scene.add(forest);

const groundMaterial = new THREE.MeshPhongMaterial({
  emissive: 0xffffff,
  emissiveIntensity: 0.01,
  normalMap: groundNormal,
  shininess: 0.1,
});
groundMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uGrass = { value: groundGrass };
  shader.uniforms.uDirt = { value: groundDirt };
  shader.vertexShader = `varying vec3 vGroundWorld;\n${shader.vertexShader}`;
  shader.vertexShader = shader.vertexShader.replace(
    "#include <worldpos_vertex>",
    `
      #include <worldpos_vertex>
      vGroundWorld = worldPosition.xyz;
    `,
  );
  shader.fragmentShader = `
    varying vec3 vGroundWorld;
    uniform sampler2D uGrass;
    uniform sampler2D uDirt;
    vec3 mod289(vec3 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    vec2 mod289(vec2 x) {
      return x - floor(x * (1.0 / 289.0)) * 289.0;
    }
    vec3 permute(vec3 x) {
      return mod289(((x * 34.0) + 1.0) * x);
    }
    float simplex2d(vec2 v) {
      const vec4 C = vec4(
        0.211324865405187,
        0.366025403784439,
        -0.577350269189626,
        0.024390243902439
      );
      vec2 i = floor(v + dot(v, C.yy));
      vec2 x0 = v - i + dot(i, C.xx);
      vec2 i1 = x0.x > x0.y ? vec2(1, 0) : vec2(0, 1);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(
        permute(i.y + vec3(0, i1.y, 1)) + i.x + vec3(0, i1.x, 1)
      );
      vec3 m = max(
        0.5 - vec3(
          dot(x0, x0),
          dot(x12.xy, x12.xy),
          dot(x12.zw, x12.zw)
        ),
        0.0
      );
      m *= m;
      m *= m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 -
        0.85373472095314 * (a0 * a0 + h * h);
      vec3 g;
      g.x = a0.x * x0.x + h.x * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
  ${shader.fragmentShader}`;
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <map_fragment>",
    `
      vec2 groundUv = vGroundWorld.xz / 30.0;
      vec3 grass = texture2D(uGrass, groundUv).rgb;
      vec3 dirt = texture2D(uDirt, groundUv).rgb;
      float field = 0.5 + 0.5 * simplex2d(vGroundWorld.xz / 100.0);
      float patchMask = smoothstep(0.6, 0.8, field);
      diffuseColor *= vec4(mix(grass, dirt, patchMask), 1.0);
    `,
  );
  shader.fragmentShader = shader.fragmentShader.replace(
    "#include <normal_fragment_maps>",
    `
      vec3 mapN = texture2D(normalMap, vGroundWorld.xz / 30.0).xyz * 2.0 - 1.0;
      mapN.xy *= normalScale;
      normal = normalize(tbn * mapN);
    `,
  );
};

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(2000, 2000),
  groundMaterial,
);
ground.rotation.x = -Math.PI * 0.5;
ground.receiveShadow = true;
scene.add(ground);

const skyUniforms = {
  sunAzimuth: { value: 90 },
  sunElevation: { value: 30 },
  sunColor: {
    value: new THREE.Color(0xffe5b0).convertLinearToSRGB(),
  },
  low: {
    value: new THREE.Color(0x6fa2ef).convertLinearToSRGB(),
  },
  high: {
    value: new THREE.Color(0x2053ff).convertLinearToSRGB(),
  },
  size: { value: 1 },
};
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(900, 96, 48),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: skyUniforms,
    vertexShader: `
      varying vec3 vPosition;
      void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPosition;
      uniform float sunAzimuth;
      uniform float sunElevation;
      uniform vec3 sunColor;
      uniform vec3 low;
      uniform vec3 high;
      uniform float size;
      void main() {
        float azimuth = radians(sunAzimuth);
        float elevation = radians(sunElevation);
        vec3 sunDirection = normalize(vec3(
          cos(elevation) * sin(azimuth),
          sin(elevation),
          cos(elevation) * cos(azimuth)
        ));
        vec3 direction = normalize(vPosition);
        vec3 skyColor = mix(low, high, direction.y * 0.5 + 0.5);
        float disc = pow(max(dot(direction, sunDirection), 0.0), 1000.0 / size);
        gl_FragColor = vec4(skyColor + sunColor * disc, 1.0);
      }
    `,
  }),
);
scene.add(sky);

const sun = new THREE.DirectionalLight(0xffe5b0, 5);
sun.position.set(50, 100, 50);
sun.castShadow = true;
sun.shadow.camera.left = -100;
sun.shadow.camera.right = 100;
sun.shadow.camera.top = 100;
sun.shadow.camera.bottom = -100;
sun.shadow.mapSize.set(512, 512);
sun.shadow.bias = -0.001;
sun.shadow.normalBias = 0.2;
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

const gltfLoader = new GLTFLoader();
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/node_modules/three/examples/jsm/libs/draco/gltf/");
gltfLoader.setDRACOLoader(dracoLoader);

const gltf = await gltfLoader.loadAsync(
  "/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/grass.glb",
);
const grassSource = gltf.scene.children.find((child) => child.isMesh);
const grassMaterial = new THREE.MeshPhongMaterial({
  map: grassSource.material.map,
  emissive: 0x308040,
  emissiveIntensity: 0.05,
  alphaTest: 0.5,
  depthWrite: true,
  side: THREE.DoubleSide,
});
grassMaterial.color.multiplyScalar(0.6);
const meadowWindUniformSets = [];
function attachMeadowWind(material, instanced, amplitude) {
  const uniforms = {
    time: { value: 0 },
    strength: { value: new THREE.Vector3(0.3, 0, 0.3) },
    frequency: { value: 1 },
    scale: { value: 400 },
  };
  meadowWindUniformSets.push(uniforms);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.time;
    shader.uniforms.uWindStrength = uniforms.strength;
    shader.uniforms.uWindFrequency = uniforms.frequency;
    shader.uniforms.uWindScale = uniforms.scale;
    shader.vertexShader = `
      uniform float uTime;
      uniform vec3 uWindStrength;
      uniform float uWindFrequency;
      uniform float uWindScale;
    ${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      "void main() {",
      `
        vec3 mod289(vec3 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        vec2 mod289(vec2 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }
        vec3 permute(vec3 x) {
          return mod289(((x * 34.0) + 1.0) * x);
        }
        float meadowSimplex(vec2 v) {
          const vec4 C = vec4(
            0.211324865405187,
            0.366025403784439,
            -0.577350269189626,
            0.024390243902439
          );
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = x0.x > x0.y ? vec2(1, 0) : vec2(0, 1);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(
            permute(i.y + vec3(0, i1.y, 1)) +
            i.x + vec3(0, i1.x, 1)
          );
          vec3 m = max(
            0.5 - vec3(
              dot(x0, x0),
              dot(x12.xy, x12.xy),
              dot(x12.zw, x12.zw)
            ),
            0.0
          );
          m *= m;
          m *= m;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 -
            0.85373472095314 * (a0 * a0 + h * h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }
        void main() {
      `,
    );
    shader.vertexShader = shader.vertexShader.replace(
      "#include <project_vertex>",
      `
        vec4 mvPosition = ${
          instanced
            ? "instanceMatrix * vec4(transformed, 1.0)"
            : "vec4(transformed, 1.0)"
        };
        float windOffset = 6.2831853 * meadowSimplex(
          (modelMatrix * mvPosition).xz / uWindScale
        );
        vec3 windSway =
          ${amplitude.toFixed(1)} * position.y * uWindStrength *
          sin(uTime * uWindFrequency + windOffset) *
          cos(uTime * 1.4 * uWindFrequency + windOffset);
        mvPosition.xyz += windSway;
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
      `,
    );
  };
  material.customProgramCacheKey = () =>
    `structured-meadow-wind-${instanced ? "instanced" : "mesh"}-${amplitude}`;
}
attachMeadowWind(grassMaterial, true, 1);
const grassCount = 5000;
const grass = new THREE.InstancedMesh(
  grassSource.geometry,
  grassMaterial,
  grassCount,
);
const grassRandom = new SceneRandom(41382);
const grassTransform = new THREE.Object3D();
let visibleGrass = 0;
while (visibleGrass < grassCount) {
  const radius = 10 + grassRandom.value() * 500;
  const angle = grassRandom.range(0, Math.PI * 2);
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const patch = 0.5 + 0.5 * simplex2d(x / 100, z / 100);
  if (patch > 0.7 && grassRandom.value() + 0.6 > 0.7) continue;
  grassTransform.position.set(x, 0, z);
  grassTransform.rotation.set(0, grassRandom.range(0, Math.PI * 2), 0);
  grassTransform.scale.set(
    grassRandom.range(5, 6),
    grassRandom.range(4, 6),
    grassRandom.range(5, 6),
  );
  grassTransform.updateMatrix();
  grass.setMatrixAt(visibleGrass, grassTransform.matrix);
  grass.setColorAt(
    visibleGrass,
    new THREE.Color(
      grassRandom.range(0.25, 0.35),
      grassRandom.range(0.3, 0.6),
      0.1,
    ),
  );
  visibleGrass += 1;
}
grass.instanceMatrix.needsUpdate = true;
grass.instanceColor.needsUpdate = true;
grass.castShadow = true;
grass.receiveShadow = true;
scene.add(grass);

const flowers = new THREE.Group();
const flowerRandom = new SceneRandom(81924);
for (const asset of [
  "/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/flower-white.glb",
  "/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/flower-blue.glb",
  "/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/flower-yellow.glb",
]) {
  const flowerSource = (await gltfLoader.loadAsync(asset)).scene;
  flowerSource.traverse((object) => {
    if (!object.isMesh) return;
    if (object.material?.map) {
      object.material = new THREE.MeshPhongMaterial({
        map: object.material.map,
      });
    }
    attachMeadowWind(object.material, false, 0.2);
    object.castShadow = true;
    object.receiveShadow = true;
  });
  for (let index = 0; index < 50; index += 1) {
    const radius = 10 + flowerRandom.value() * 200;
    const angle = flowerRandom.value() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const patch = 0.5 + 0.5 * simplex2d(x / 100, z / 100);
    if (patch > 0.7 && flowerRandom.value() + 0.8 > 0.7) continue;
    const flower = flowerSource.clone(true);
    flower.position.set(x, 0, z);
    flower.rotation.y = flowerRandom.value() * Math.PI * 2;
    flower.scale.setScalar(0.02 + flowerRandom.value() * 0.03);
    flowers.add(flower);
  }
}
scene.add(flowers);

const rocks = new THREE.Group();
const rockRandom = new SceneRandom(25177);
for (const asset of [
  "/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/rock1.glb",
  "/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/rock2.glb",
  "/dev/example-gallery/examples/threejs-procedural-vegetation/structured-ash-growth/assets/rock3.glb",
]) {
  const source = (await gltfLoader.loadAsync(asset)).scene.children.find(
    (child) => child.isMesh,
  );
  const instances = new THREE.InstancedMesh(
    source.geometry,
    source.material,
    50,
  );
  const transform = new THREE.Object3D();
  for (let index = 0; index < 50; index += 1) {
    transform.position.set(
      rockRandom.range(-250, 250),
      0.3,
      rockRandom.range(-250, 250),
    );
    transform.rotation.set(0, rockRandom.value() * Math.PI * 2, 0);
    transform.scale.set(
      rockRandom.range(2, 5),
      rockRandom.range(2, 5),
      rockRandom.range(2, 5),
    );
    transform.updateMatrix();
    instances.setMatrixAt(index, transform.matrix);
  }
  instances.instanceMatrix.needsUpdate = true;
  instances.castShadow = true;
  rocks.add(instances);
}
scene.add(rocks);

const leafOriginPoints = new THREE.Points(
  compiled.leafOrigins,
  new THREE.PointsMaterial({
    color: 0xff006e,
    size: 0.42,
    sizeAttenuation: true,
    depthTest: true,
  }),
);
leafOriginPoints.visible = false;
foregroundTree.add(leafOriginPoints);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const smaa = new SMAAPass();
composer.addPass(smaa);
composer.addPass(new OutputPass());

function setTreeMaterials(tree, branchMaterial, foliageMaterial) {
  tree.userData.branches.material = branchMaterial;
  tree.userData.leaves.material = foliageMaterial;
}

function setDebugMode(mode) {
  leafOriginPoints.visible = mode === "leaf-origins";
  const final = mode === "final" || mode === "leaf-origins";

  if (mode === "hierarchy") {
    setTreeMaterials(
      foregroundTree,
      hierarchyBranchMaterial,
      hierarchyLeafMaterial,
    );
  } else if (mode === "continuations") {
    setTreeMaterials(
      foregroundTree,
      continuationMaterial,
      hierarchyLeafMaterial,
    );
    foregroundTree.userData.leaves.visible = false;
  } else if (mode === "normals") {
    setTreeMaterials(
      foregroundTree,
      branchNormalMaterial,
      leafNormalMaterial,
    );
  } else {
    setTreeMaterials(foregroundTree, barkMaterial, leafMaterial);
  }

  if (mode !== "continuations") {
    foregroundTree.userData.leaves.visible = true;
  }
  forest.visible = final;
  grass.visible = final;
  flowers.visible = final;
  rocks.visible = final;
  ground.visible = final;
  sky.visible = final;
  sun.visible = final;
  smaa.enabled = final;
}

  return {
      resize({ width, height, dpr }) {
        composer.setPixelRatio(dpr);
        composer.setSize(width, height);
        smaa.setSize(width * dpr, height * dpr);
      },
      setDebugMode,
      update({ elapsed }) {
        leafWindUniforms.time.value = elapsed;
        for (const uniforms of meadowWindUniformSets) {
          uniforms.time.value = elapsed;
        }
      },
      render({ rawDelta }) {
        composer.render(rawDelta);
      },
      metrics() {
    const branchJobs = compiled.stats.branchJobs.reduce(
      (sum, count) => sum + count,
      0,
    );
        return {
          branches: branchJobs,
          leafCards: compiled.stats.leafCards,
        };
      },
      dispose() {
        dracoLoader.dispose();
      },
  };
}
