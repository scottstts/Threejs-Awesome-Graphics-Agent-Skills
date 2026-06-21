import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import {
  FRAME_RAIL_Z_OFFSET,
  buildFrameProfile,
  createSculptedRailGeometry,
  getFrameMetrics,
} from "/skills/threejs-procedural-geometry/examples/sculpted-gallery-frame/frame-geometry.js";

export async function createGalleryFrameScene({
  renderer,
  scene,
  camera,
}) {
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.shadowMap.needsUpdate = true;
scene.background = new THREE.Color(0xeee6d9);

const layout = {
  spacing: 3.62,
  frameOuterWidth: 2.58,
  frameOuterHeight: 3.66,
  frameDepth: 0.32,
  postWidth: 2.08,
  frameY: 0.42,
  floorY: -2.72,
  ceilingY: 4.72,
};
const frameMetrics = getFrameMetrics(layout);
const frameDimensions = {
  outerWidth: layout.frameOuterWidth,
  outerHeight: layout.frameOuterHeight,
  innerWidth: frameMetrics.innerWidth,
  innerHeight: frameMetrics.innerHeight,
  railWidthX: frameMetrics.railWidthX,
  railWidthY: frameMetrics.railWidthY,
  profileRailWidth: frameMetrics.profileRailWidth,
  frameDepth: layout.frameDepth,
};
const railGeometries = Object.fromEntries(
  ["top", "bottom", "left", "right"].map((orientation) => [
    orientation,
    createSculptedRailGeometry(orientation, frameDimensions),
  ]),
);

function configureTexture(texture, repeatX, repeatY, color = true) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
}

const loader = new THREE.TextureLoader();
const [
  walnutTexture,
  goldTexture,
  ebonyTexture,
  matTexture,
  plasterTexture,
  plasterBump,
  floorTexture,
] = await Promise.all([
  loader.loadAsync("/dev/example-gallery/examples/threejs-procedural-geometry/sculpted-gallery-frame/assets/aged-walnut-frame.webp"),
  loader.loadAsync("/dev/example-gallery/examples/threejs-procedural-geometry/sculpted-gallery-frame/assets/antique-gold-frame.webp"),
  loader.loadAsync("/dev/example-gallery/examples/threejs-procedural-geometry/sculpted-gallery-frame/assets/dark-ebony-frame.webp"),
  loader.loadAsync("/dev/example-gallery/examples/threejs-procedural-geometry/sculpted-gallery-frame/assets/gallery-mat-board.webp"),
  loader.loadAsync("/dev/example-gallery/examples/threejs-procedural-geometry/sculpted-gallery-frame/assets/gallery-plaster.webp"),
  loader.loadAsync("/dev/example-gallery/examples/threejs-procedural-geometry/sculpted-gallery-frame/assets/gallery-plaster-bump.webp"),
  loader.loadAsync("/dev/example-gallery/examples/threejs-procedural-geometry/sculpted-gallery-frame/assets/gallery-floor.webp"),
]);
for (const texture of [walnutTexture, goldTexture, ebonyTexture, matTexture]) {
  configureTexture(texture, 1, 1);
}
configureTexture(plasterTexture, 2.2, 1.3);
configureTexture(plasterBump, 2.2, 1.3, false);
configureTexture(floorTexture, 8, 8);

const frameMaterials = [
  new THREE.MeshPhysicalMaterial({
    name: "aged-walnut",
    map: walnutTexture,
    bumpMap: walnutTexture,
    bumpScale: 0.022,
    color: 0xffffff,
    roughness: 0.42,
    metalness: 0.04,
    clearcoat: 0.62,
    clearcoatRoughness: 0.28,
    side: THREE.DoubleSide,
  }),
  new THREE.MeshPhysicalMaterial({
    name: "antique-gold",
    map: goldTexture,
    bumpMap: goldTexture,
    bumpScale: 0.012,
    color: 0xffd891,
    roughness: 0.24,
    metalness: 0.78,
    clearcoat: 0.24,
    clearcoatRoughness: 0.2,
    side: THREE.DoubleSide,
  }),
  new THREE.MeshPhysicalMaterial({
    name: "dark-ebony",
    map: ebonyTexture,
    bumpMap: ebonyTexture,
    bumpScale: 0.018,
    color: 0xffffff,
    roughness: 0.4,
    metalness: 0.03,
    clearcoat: 0.7,
    clearcoatRoughness: 0.24,
    side: THREE.DoubleSide,
  }),
];
const backingMaterial = new THREE.MeshStandardMaterial({
  map: matTexture,
  color: 0xf3eadc,
  roughness: 0.92,
});
const plaqueMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xb9822d,
  roughness: 0.34,
  metalness: 0.82,
  clearcoat: 0.22,
  clearcoatRoughness: 0.18,
});

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function createPlaceholderArtTexture(seed) {
  const random = seededRandom(seed);
  const artCanvas = document.createElement("canvas");
  artCanvas.width = 384;
  artCanvas.height = 580;
  const context = artCanvas.getContext("2d");
  const palette = [
    "#6fd7d2",
    "#4f7dff",
    "#ca42c9",
    "#f26c54",
    "#f4df68",
    "#68c75f",
    "#9d78ff",
    "#f1a968",
  ];
  const background = context.createLinearGradient(0, 0, 0, artCanvas.height);
  background.addColorStop(0, "#203345");
  background.addColorStop(1, "#142334");
  context.fillStyle = background;
  context.fillRect(0, 0, artCanvas.width, artCanvas.height);

  context.globalAlpha = 0.13;
  context.fillStyle = "#ffffff";
  for (let y = 8; y < artCanvas.height; y += 9) {
    for (let x = 8; x < artCanvas.width; x += 9) {
      context.beginPath();
      context.arc(x, y, 1.1, 0, Math.PI * 2);
      context.fill();
    }
  }

  context.globalCompositeOperation = "screen";
  for (let index = 0; index < 28; index += 1) {
    const radius = 18 + random() * 74;
    context.globalAlpha = 0.24 + random() * 0.28;
    context.fillStyle = palette[Math.floor(random() * palette.length)];
    context.beginPath();
    context.ellipse(
      random() * artCanvas.width,
      random() * artCanvas.height,
      radius * (0.78 + random() * 0.72),
      radius,
      random() * Math.PI,
      0,
      Math.PI * 2,
    );
    context.fill();
  }

  for (let index = 0; index < 44; index += 1) {
    const width = 5 + random() * 8;
    const height = 28 + random() * 86;
    context.save();
    context.translate(random() * artCanvas.width, random() * artCanvas.height);
    context.rotate(-0.9 + random() * 1.8);
    context.globalAlpha = 0.34 + random() * 0.3;
    context.fillStyle = palette[Math.floor(random() * palette.length)];
    context.fillRect(-width / 2, -height / 2, width, height);
    context.restore();
  }

  context.globalCompositeOperation = "multiply";
  context.globalAlpha = 0.18;
  const shadow = context.createLinearGradient(
    artCanvas.width * 0.12,
    artCanvas.height,
    artCanvas.width,
    0,
  );
  shadow.addColorStop(0, "rgba(0, 0, 0, 0.02)");
  shadow.addColorStop(0.64, "rgba(0, 0, 0, 0.7)");
  shadow.addColorStop(1, "rgba(0, 0, 0, 0.08)");
  context.fillStyle = shadow;
  context.fillRect(0, 0, artCanvas.width, artCanvas.height);

  context.globalCompositeOperation = "source-over";
  context.globalAlpha = 0.16;
  context.strokeStyle = "#f3d49d";
  context.lineWidth = 4;
  context.strokeRect(2, 2, artCanvas.width - 4, artCanvas.height - 4);

  const texture = new THREE.CanvasTexture(artCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
  return texture;
}

function createPlaqueTexture(label) {
  const plaqueCanvas = document.createElement("canvas");
  plaqueCanvas.width = 512;
  plaqueCanvas.height = 128;
  const context = plaqueCanvas.getContext("2d");
  context.clearRect(0, 0, plaqueCanvas.width, plaqueCanvas.height);
  context.fillStyle = "rgba(55, 31, 8, 0.82)";
  context.font = "600 56px Georgia, Times New Roman, serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.shadowColor = "rgba(255, 238, 188, 0.42)";
  context.shadowBlur = 1.2;
  context.shadowOffsetY = 1;
  context.fillText(label, plaqueCanvas.width / 2, plaqueCanvas.height / 2 + 1);
  const texture = new THREE.CanvasTexture(plaqueCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const artTextures = [0x51a7c0, 0xefff39f1, 0x18c7b332].map(
  createPlaceholderArtTexture,
);
const artMaterials = artTextures.map(
  (map) =>
    new THREE.MeshStandardMaterial({
      map,
      color: 0xffffff,
      roughness: 0.74,
      metalness: 0.01,
    }),
);
const plaqueLabels = ["WALNUT", "ANTIQUE GOLD", "EBONY"];
const plaqueTextMaterials = plaqueLabels.map(
  (label) =>
    new THREE.MeshStandardMaterial({
      map: createPlaqueTexture(label),
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      roughness: 0.82,
      metalness: 0.04,
    }),
);

const unitBox = new THREE.BoxGeometry(1, 1, 1);
const unitPlane = new THREE.PlaneGeometry(1, 1);
const railMeshes = [];

function configureSpotlightShadow(spotlight) {
  spotlight.castShadow = true;
  spotlight.shadow.mapSize.set(2048, 2048);
  spotlight.shadow.camera.near = 1.6;
  spotlight.shadow.camera.far = 18;
  spotlight.shadow.bias = -0.00004;
  spotlight.shadow.normalBias = 0.035;
  spotlight.shadow.radius = 3;
  spotlight.shadow.blurSamples = 8;
}

function createFrame(index, x) {
  const group = new THREE.Group();
  group.position.set(x, layout.frameY, 0);

  const backing = new THREE.Mesh(unitBox, backingMaterial);
  backing.scale.set(
    frameMetrics.innerWidth + 0.08,
    frameMetrics.innerHeight + 0.08,
    0.045,
  );
  backing.position.set(0, 0, 0.018);
  backing.receiveShadow = true;
  group.add(backing);

  const art = new THREE.Mesh(unitPlane, artMaterials[index]);
  art.scale.set(frameMetrics.cardWidth, frameMetrics.cardHeight, 1);
  art.position.set(0, 0, frameMetrics.cardZ - 0.006);
  art.receiveShadow = true;
  group.add(art);

  for (const orientation of ["top", "bottom", "left", "right"]) {
    const rail = new THREE.Mesh(
      railGeometries[orientation],
      frameMaterials[index],
    );
    rail.name = `sculpted-${orientation}-frame-rail`;
    rail.position.z = FRAME_RAIL_Z_OFFSET;
    rail.castShadow = true;
    rail.receiveShadow = true;
    rail.userData.sourceMaterial = frameMaterials[index];
    rail.userData.orientation = orientation;
    railMeshes.push(rail);
    group.add(rail);
  }

  const plaqueWidth = Math.min(0.86, layout.frameOuterWidth * 0.34);
  const plaqueY = layout.frameOuterHeight / 2 + 0.34;
  const plaque = new THREE.Mesh(unitBox, plaqueMaterial);
  plaque.scale.set(plaqueWidth, 0.18, 0.035);
  plaque.position.set(0, plaqueY, 0.02);
  plaque.castShadow = true;
  plaque.receiveShadow = true;
  group.add(plaque);

  const plaqueText = new THREE.Mesh(unitPlane, plaqueTextMaterials[index]);
  plaqueText.scale.set(plaqueWidth * 0.76, 0.18 * 0.54, 1);
  plaqueText.position.set(0, plaqueY, 0.041);
  group.add(plaqueText);

  const paintingLightY = layout.frameOuterHeight / 2 + 3.6;
  const lightBar = new THREE.Mesh(unitBox, plaqueMaterial);
  lightBar.scale.set(layout.frameOuterWidth * 0.42, 0.07, 0.12);
  lightBar.position.set(0, paintingLightY, 1.42);
  group.add(lightBar);

  const spotlight = new THREE.SpotLight(
    0xffc58c,
    5.65,
    9.4,
    0.4,
    0.88,
    1.8,
  );
  spotlight.position.set(0, paintingLightY, 1.42);
  spotlight.target.position.set(0, -0.22, -0.06);
  configureSpotlightShadow(spotlight);
  group.add(spotlight, spotlight.target);

  scene.add(group);
}

[-layout.spacing, 0, layout.spacing].forEach((x, index) =>
  createFrame(index, x),
);

const wallMaterial = new THREE.MeshStandardMaterial({
  map: plasterTexture,
  bumpMap: plasterBump,
  bumpScale: 0.024,
  color: 0xf2e8d9,
  roughness: 0.94,
  metalness: 0,
});
const wall = new THREE.Mesh(
  new THREE.PlaneGeometry(14.5, 8, 120, 56),
  wallMaterial,
);
wall.position.set(0, 0.85, -0.22);
wall.receiveShadow = true;
scene.add(wall);

const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorTexture,
  bumpMap: floorTexture,
  bumpScale: 0.003,
  color: 0xffffff,
  roughness: 0.92,
  metalness: 0,
});
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(18, 14, 80, 80),
  floorMaterial,
);
floor.rotation.x = -Math.PI / 2;
floor.position.y = layout.floorY;
floor.receiveShadow = true;
scene.add(floor);

const ceilingSpotlight = new THREE.SpotLight(
  0xfff8e7,
  2.5,
  19,
  1.4,
  0.72,
  1.8,
);
ceilingSpotlight.position.set(0, layout.ceilingY - 0.24, 4.2);
ceilingSpotlight.target.position.set(0, layout.frameY - 0.1, 0);
configureSpotlightShadow(ceilingSpotlight);
scene.add(ceilingSpotlight, ceilingSpotlight.target);

const chandelierFill = new THREE.PointLight(0xffc06d, 18, 18, 1.75);
chandelierFill.position.set(0, 3.85, 4.2);
scene.add(chandelierFill);

const bloomLayer = new THREE.Layers();
bloomLayer.set(1);
const bulbMaterial = new THREE.MeshBasicMaterial({
  color: 0xfff7e2,
  toneMapped: false,
});
const glowMaterial = new THREE.MeshBasicMaterial({
  color: 0xffb759,
  transparent: true,
  opacity: 0.55,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  toneMapped: false,
});
const lightFixture = new THREE.Group();
lightFixture.position.set(0, 3.68, 1.5);
const fixtureRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.79, 0.035, 14, 96),
  plaqueMaterial,
);
fixtureRing.rotation.x = Math.PI / 2;
lightFixture.add(fixtureRing);
for (let index = 0; index < 5; index += 1) {
  const angle = (index / 5) * Math.PI * 2;
  const position = new THREE.Vector3(
    Math.cos(angle) * 0.7,
    0,
    Math.sin(angle) * 0.28,
  );
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.085, 18, 12),
    bulbMaterial,
  );
  bulb.position.copy(position);
  bulb.layers.enable(1);
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.15, 18, 12),
    glowMaterial,
  );
  glow.position.copy(position);
  glow.layers.enable(1);
  lightFixture.add(bulb, glow);
}
scene.add(lightFixture);

const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(new RenderPass(scene, camera));
bloomComposer.addPass(
  new UnrealBloomPass(new THREE.Vector2(1440, 900), 0.78, 0.48, 0.16),
);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const finalMaterial = new THREE.ShaderMaterial({
  uniforms: {
    baseTexture: { value: null },
    bloomTexture: { value: bloomComposer.renderTarget2.texture },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;
    void main() {
      gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv);
    }
  `,
});
composer.addPass(new ShaderPass(finalMaterial, "baseTexture"));
composer.addPass(new OutputPass());

const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
const darkened = [];
function darkenNonBloomed(object) {
  if (
    object.isMesh &&
    !bloomLayer.test(object.layers) &&
    object.material !== darkMaterial
  ) {
    darkened.push({ mesh: object, material: object.material });
    object.material = darkMaterial;
  }
}
function restoreDarkened() {
  for (const { mesh, material } of darkened) mesh.material = material;
  darkened.length = 0;
}

const profileGroup = new THREE.Group();
const profilePoints = buildFrameProfile(frameMetrics.profileRailWidth).map(
  ({ t, z }) => new THREE.Vector3((t - 0.5) * 4.1, z * 8.5, 0),
);
const profileLine = new THREE.Line(
  new THREE.BufferGeometry().setFromPoints(profilePoints),
  new THREE.LineBasicMaterial({ color: 0xffb24c }),
);
profileGroup.add(profileLine);
for (const sample of profilePoints.filter((_, index) => index % 6 === 0)) {
  const marker = new THREE.Mesh(
    new THREE.SphereGeometry(0.025, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0x7fe2ff }),
  );
  marker.position.copy(sample);
  profileGroup.add(marker);
}
profileGroup.position.set(0, -1.6, 1.2);
profileGroup.visible = false;
scene.add(profileGroup);

const normalMaterial = new THREE.MeshNormalMaterial();
const topologyMaterials = {
  top: new THREE.MeshBasicMaterial({ color: 0xf3b74b, wireframe: true }),
  bottom: new THREE.MeshBasicMaterial({ color: 0x65d1ca, wireframe: true }),
  left: new THREE.MeshBasicMaterial({ color: 0xc276ff, wireframe: true }),
  right: new THREE.MeshBasicMaterial({ color: 0xff6d82, wireframe: true }),
};
let debugMode = "final";
function setDebugMode(nextMode) {
  debugMode = nextMode;
  profileGroup.visible = nextMode === "profile";
  for (const rail of railMeshes) {
    if (nextMode === "normals") {
      rail.material = normalMaterial;
    } else if (nextMode === "topology") {
      rail.material = topologyMaterials[rail.userData.orientation];
    } else {
      rail.material = rail.userData.sourceMaterial;
    }
  }
}

function render() {
  const diagnostic = debugMode !== "final";
  if (diagnostic) {
    renderer.render(scene, camera);
    return;
  }
  scene.traverseVisible(darkenNonBloomed);
  try {
    bloomComposer.render();
  } finally {
    restoreDarkened();
  }
  composer.render();
}

  return {
      resize({ width, height }) {
        bloomComposer.setSize(width, height);
        composer.setSize(width, height);
      },
      setDebugMode,
      render,
      metrics() {
        return { tier: "authored profile / 92 samples" };
      },
  };
}
