import * as THREE from "three";
import {
  createWaterMaterial,
  oceanSurfaceHeightAt,
} from "/skills/threejs-water-optics/examples/analytic-wave-optics/water-system.js";

export function createWaterOpticsScene({ renderer, scene, camera }) {
scene.background = new THREE.Color(0x07152d);
scene.fog = new THREE.FogExp2(0x7fa6cd, 0.0015);

const skyUniforms = {
  uSunDirection: {
    value: new THREE.Vector3(-0.28, 0.62, -0.73).normalize(),
  },
};
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(900, 48, 24),
  new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: `
      varying vec3 vDirection;
      void main() {
        vDirection = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 uSunDirection;
      varying vec3 vDirection;
      void main() {
        float y = vDirection.y;
        vec3 below = vec3(0.35, 0.55, 0.78);
        vec3 horizon = vec3(0.52, 0.72, 0.92);
        vec3 lower = vec3(0.30, 0.58, 0.88);
        vec3 middle = vec3(0.12, 0.32, 0.70);
        vec3 zenith = vec3(0.02, 0.08, 0.36);
        float t0 = smoothstep(-0.1, 0.0, y);
        float t1 = smoothstep(0.0, 0.28, y);
        float t2 = smoothstep(0.28, 0.85, y);
        vec3 color = mix(
          mix(below, horizon, t0),
          mix(lower, mix(middle, zenith, t2), t1),
          t1
        );
        float sunDot = clamp(dot(vDirection, uSunDirection), 0.0, 1.0);
        color += vec3(1.0, 0.95, 0.75) * pow(sunDot, 5000.0) * 50.0;
        color += vec3(1.0, 0.72, 0.32) * pow(sunDot, 20.0) * 2.8;
        color += vec3(1.0, 0.8, 0.5) * pow(sunDot, 4.0) * 0.5;
        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  }),
);
scene.add(sky);

const seabed = new THREE.Mesh(
  new THREE.PlaneGeometry(900, 900, 80, 80),
  new THREE.MeshStandardMaterial({
    color: 0x786f5a,
    roughness: 0.96,
  }),
);
seabed.geometry.rotateX(-Math.PI / 2);
seabed.position.y = -4.2;
scene.add(seabed);

const rockMaterial = new THREE.MeshStandardMaterial({
  color: 0x6b6960,
  roughness: 0.9,
});
for (let index = 0; index < 24; index += 1) {
  const angle = index * 2.39996;
  const radius = 12 + (index % 7) * 5.8;
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.55 + (index % 4) * 0.16, 1),
    rockMaterial,
  );
  rock.position.set(
    Math.cos(angle) * radius,
    -3.45 + (index % 3) * 0.08,
    -24 + Math.sin(angle) * radius,
  );
  rock.scale.set(1.6, 0.85, 1.1);
  rock.rotation.set(index * 0.31, index * 0.73, index * 0.19);
  scene.add(rock);
}

scene.add(new THREE.HemisphereLight(0xbfd8ef, 0x38404c, 1.4));
const sun = new THREE.DirectionalLight(0xffe7b8, 2.4);
sun.position.copy(skyUniforms.uSunDirection.value).multiplyScalar(160);
scene.add(sun);

let sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  depthBuffer: true,
});
const waterMaterial = createWaterMaterial(sceneTarget.texture);
const waterGeometry = new THREE.PlaneGeometry(1200, 1200, 256, 256);
waterGeometry.rotateX(-Math.PI / 2);
const water = new THREE.Mesh(waterGeometry, waterMaterial);
scene.add(water);

const debugModes = new Map([
  ["final", 0],
  ["displacement", 1],
  ["normals", 2],
  ["micro-filter", 3],
  ["fresnel", 4],
  ["refraction", 5],
  ["absorption", 6],
  ["crest-foam", 7],
]);
function setDebugMode(modeName) {
  waterMaterial.uniforms.uDebugMode.value =
    debugModes.get(modeName) ?? 0;
}

  return {
      resize({ bufferWidth, bufferHeight }) {
        sceneTarget.setSize(bufferWidth, bufferHeight);
        waterMaterial.uniforms.uResolution.value.set(
          bufferWidth,
          bufferHeight,
        );
      },
      setDebugMode,
      update({ elapsed }) {
        waterMaterial.uniforms.uTime.value = elapsed;
        if (camera.position.y < 1.2) {
          const surface = oceanSurfaceHeightAt(
            camera.position.x,
            camera.position.z,
            elapsed,
          );
          camera.position.y = Math.max(camera.position.y, surface + 0.9);
        }
      },
      render() {
        water.visible = false;
        renderer.setRenderTarget(sceneTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);
        water.visible = true;
        renderer.render(scene, camera);
      },
      metrics() {
        return {
          tier:
            "5 displaced waves / 3 filtered micro bands / " +
            "scene-color refraction",
        };
      },
      dispose() {
        sceneTarget.dispose();
        waterGeometry.dispose();
        waterMaterial.dispose();
      },
  };
}
