import { exampleRuntime } from "../../runtime/example-runtime.js";

const canvas = document.querySelector("canvas");
const gl = canvas.getContext("webgl2", {
  antialias: false,
  alpha: false,
  preserveDrawingBuffer: true,
});

if (!gl) throw new Error("WebGL2 is required by the gallery fixture.");

const vertexSource = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 resolution;
uniform float time;
uniform int debugMode;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + vec2(1)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.55;
  mat2 rotation = mat2(0.82, -0.57, 0.57, 0.82);
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = rotation * p * 2.08 + 7.3;
    amplitude *= 0.48;
  }
  return value;
}

void main() {
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / resolution.y;
  float t = time * 0.11;
  vec2 warp = vec2(fbm(p * 1.15 + t), fbm(p * 1.15 - t + 19.0)) - 0.5;
  float macro = fbm(p * 1.65 + warp * 1.35);
  float meso = fbm(p * 5.2 - warp * 0.7);
  float field = macro * 0.76 + meso * 0.24;

  if (debugMode == 1) {
    outColor = vec4(vec3(field), 1.0);
    return;
  }
  if (debugMode == 2) {
    outColor = vec4(macro, meso, abs(macro - meso), 1.0);
    return;
  }

  float angle = atan(p.y, p.x);
  float radius = length(p);
  float orbit = abs(radius - (0.58 + 0.08 * sin(angle * 3.0 + t * 4.0)));
  float filament = exp(-orbit * 56.0) * smoothstep(0.18, 0.92, field);
  float core = exp(-radius * 5.8);
  float grain = hash(gl_FragCoord.xy + floor(time * 17.0)) - 0.5;

  vec3 deep = vec3(0.014, 0.018, 0.03);
  vec3 violet = vec3(0.20, 0.28, 0.78);
  vec3 acid = vec3(0.72, 1.0, 0.22);
  vec3 color = deep;
  color += violet * pow(field, 3.1) * 0.8;
  color += acid * filament * (1.4 + field);
  color += mix(violet, acid, field) * core * 0.42;
  color += grain * 0.012;
  color *= 1.0 - smoothstep(0.65, 1.5, radius) * 0.72;
  outColor = vec4(color, 1.0);
}`;

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

const program = gl.createProgram();
gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(program));
}

const buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(
  gl.ARRAY_BUFFER,
  new Float32Array([-1, -1, 3, -1, -1, 3]),
  gl.STATIC_DRAW,
);

const position = gl.getAttribLocation(program, "position");
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

const uniforms = {
  resolution: gl.getUniformLocation(program, "resolution"),
  time: gl.getUniformLocation(program, "time"),
  debugMode: gl.getUniformLocation(program, "debugMode"),
};

let runtimeState = exampleRuntime.state;
let elapsed = 0;
let previous = performance.now();
let frames = 0;
let metricStart = previous;

exampleRuntime.setCaptureCanvas(canvas);
exampleRuntime.onStateChange((next) => {
  runtimeState = next;
});

function resize() {
  const dpr = runtimeState.dpr;
  const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
  }
}

function draw(now) {
  resize();
  const delta = Math.min((now - previous) / 1000, 0.1);
  previous = now;
  elapsed += exampleRuntime.frameDelta(delta);

  gl.useProgram(program);
  gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
  gl.uniform1f(uniforms.time, elapsed);
  gl.uniform1i(
    uniforms.debugMode,
    runtimeState.debugMode === "field"
      ? 1
      : runtimeState.debugMode === "bands"
        ? 2
        : 0,
  );
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  frames += 1;
  if (now - metricStart > 1000) {
    exampleRuntime.reportMetrics({
      fps: Math.round((frames * 1000) / (now - metricStart)),
      buffer: `${canvas.width}×${canvas.height}`,
    });
    frames = 0;
    metricStart = now;
  }
  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
