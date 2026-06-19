import * as THREE from "three";
import { createLabRuntime } from "../lab-runtime.js";

const renderer = new THREE.WebGLRenderer({ antialias: true });
document.body.append(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const uniforms = {
  uTime: { value: 0 },
  uResolution: { value: new THREE.Vector2(1, 1) },
  uControl: { value: new THREE.Vector2(0.55, 0.55) },
};
const runtime = createLabRuntime({
  renderer,
  scene,
  camera,
  onResize: () => renderer.getDrawingBufferSize(uniforms.uResolution.value),
});

const material = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform vec2 uControl;

    float hash21(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float valueNoise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(
        mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
        mix(hash21(i + vec2(0.0, 1.0)), hash21(i + 1.0), f.x),
        f.y
      );
    }

    float fbm(vec2 p) {
      float sum = 0.0;
      float amplitude = 0.5;
      mat2 rotation = mat2(0.8, -0.6, 0.6, 0.8);
      for (int i = 0; i < 5; i++) {
        sum += amplitude * valueNoise(p);
        p = rotation * p * 2.03 + 17.1;
        amplitude *= 0.5;
      }
      return sum;
    }

    void main() {
      vec2 p = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
      float t = uTime * 0.12;
      float warp = mix(0.15, 1.35, uControl.x);
      vec2 q = vec2(fbm(p * 1.7 + t), fbm(p * 1.7 + vec2(5.2, 1.3) - t));
      vec2 r = vec2(
        fbm(p * 2.1 + warp * q + vec2(1.7, 9.2)),
        fbm(p * 2.1 + warp * q + vec2(8.3, 2.8))
      );
      float field = fbm(p * 2.4 + warp * r);

      vec3 deep = vec3(0.012, 0.035, 0.075);
      vec3 mid = vec3(0.02, 0.42, 0.58);
      vec3 hot = vec3(1.0, 0.43, 0.12);
      vec3 color = mix(deep, mid, smoothstep(0.2, 0.67, field));
      color = mix(color, hot, smoothstep(0.68, 0.92, field + 0.12 * q.x));

      float bands = mix(5.0, 24.0, uControl.y);
      float contourSignal = abs(fract(field * bands) - 0.5);
      float contourWidth = fwidth(field * bands) * 1.25;
      float contour = 1.0 - smoothstep(contourWidth, contourWidth * 2.5, contourSignal);
      color += contour * vec3(0.32, 0.7, 1.0) * 0.34;

      float vignette = smoothstep(1.3, 0.25, length(p * vec2(0.75, 1.0)));
      gl_FragColor = vec4(color * (0.56 + 0.55 * vignette), 1.0);
    }
  `,
});

scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

let paused = false;
runtime.listen(renderer.domElement, "pointermove", (event) => {
  const pointer = runtime.pointerNdc(event);
  uniforms.uControl.value.set((pointer.x + 1) * 0.5, (pointer.y + 1) * 0.5);
});
runtime.listen(window, "keydown", (event) => {
  if (event.code === "Space") paused = !paused;
});

let previousTime = performance.now();
renderer.setAnimationLoop((time) => {
  const delta = Math.min((time - previousTime) / 1000, 0.05);
  previousTime = time;
  if (!paused) uniforms.uTime.value += delta;
  renderer.render(scene, camera);
});
