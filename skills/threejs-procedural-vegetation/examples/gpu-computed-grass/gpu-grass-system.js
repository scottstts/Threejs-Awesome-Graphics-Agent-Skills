import * as THREE from "three";

export const gpuComputedGrassDebugModes = new Map([
  ["final", 0],
  ["bladeParams", 1],
  ["clumps", 2],
  ["wind", 3],
  ["normals", 4],
]);

export const DEFAULT_GRID_SIZE = 384;
export const DEFAULT_PATCH_SIZE = 20;
export const BLADE_SEGMENTS = 14;

const utility = `
float remap(float value, vec2 minmaxI, vec2 minmaxO) {
    return minmaxO.x + (value - minmaxI.x) * (minmaxO.y - minmaxO.x) / (minmaxI.y - minmaxI.x);
}

vec2 rotate2D(vec2 p, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    mat2 m = mat2(c, s, -s, c);
    return m * p;
}

vec3 rotate3D(vec3 p, vec3 axis, float angle) {
    return mix(dot(axis, p) * axis, p, cos(angle)) + cross(axis, p) * sin(angle);
}
`;

const simplexNoise = `
vec3 permute(vec3 x) { return mod(((x*44.0)+1.0)*x, 299.0); }

float simplexNoise2d(vec2 v)
{
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 299.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
}

vec4 permute4(vec4 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314 * r; }

float simplexNoise3d(vec3 v)
{
    const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
    const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy) );
    vec3 x0 =   v - i + dot(i, C.xxx) ;

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min( g.xyz, l.zxy );
    vec3 i2 = max( g.xyz, l.zxy );

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1. + 3.0 * C.xxx;

    i = mod(i, 289.0 );
    vec4 p = permute4( permute4( permute4( i.z + vec4(0.0, i1.z, i2.z, 1.0 )) + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))  + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

    float n_ = 1.0/7.0;
    vec3  ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_ );

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4( x.xy, y.xy );
    vec4 b1 = vec4( x.zw, y.zw );

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
}
`;

const fractal = `
${simplexNoise}

float fbm4(vec2 p, float t)
{
    float f;
    f = 0.50000 * simplexNoise3d(vec3(p, t)); p = p * 2.01;
    f += 0.25000 * simplexNoise3d(vec3(p, t)); p = p * 2.02;
    f += 0.12500 * simplexNoise3d(vec3(p, t)); p = p * 2.03;
    f += 0.06250 * simplexNoise3d(vec3(p, t));
    return f * (1.0 / 0.9375) * 0.5 + 0.5;
}

float fbm3(vec2 p, float t)
{
    float f;
    f = 0.50000 * simplexNoise3d(vec3(p, t)); p = p * 2.01;
    f += 0.25000 * simplexNoise3d(vec3(p, t)); p = p * 2.02;
    f += 0.12500 * simplexNoise3d(vec3(p, t));
    return f * (1.0 / 0.875) * 0.5 + 0.5;
}

float fbm2(vec2 p, float t)
{
    float f;
    f = 0.50000 * simplexNoise3d(vec3(p, t)); p = p * 2.01;
    f += 0.25000 * simplexNoise3d(vec3(p, t));
    return f * (1.0 / 0.75) * 0.5 + 0.5;
}
`;

const terrainMath = `
uniform float uTerrainAmp;
uniform float uTerrainFreq;
uniform float uTerrainSeed;

float getTerrainHeight(vec2 xz) {
    vec2 samplePos = xz + vec2(0.001);
    return fbm2(samplePos * uTerrainFreq + uTerrainSeed, 0.0) * uTerrainAmp;
}

vec3 getTerrainNormal(vec2 xz) {
    float baseEpsilon = 0.1;
    float minDist = max(abs(xz.x), abs(xz.y));
    float epsilon = max(baseEpsilon, minDist * 0.01);

    float h = getTerrainHeight(xz);
    float hx = getTerrainHeight(xz + vec2(epsilon, 0.0));
    float hz = getTerrainHeight(xz + vec2(0.0, epsilon));

    vec3 p1 = vec3(epsilon, hx - h, 0.0);
    vec3 p2 = vec3(0.0, hz - h, epsilon);

    vec3 normal = cross(p2, p1);
    float len = length(normal);

    if (len < 0.0001) {
        return vec3(0.0, 1.0, 0.0);
    }

    return normalize(normal);
}

vec3 rotateAxis(vec3 v, vec3 axis, float angle) {
    return mix(dot(axis, v) * axis, v, cos(angle)) + cross(axis, v) * sin(angle);
}
`;

const grassComputeShader = `precision highp float;

${fractal}

#define PI 3.14159265359
#define TWO_PI 6.28318530718

uniform vec2 uResolution;
uniform sampler2D uPositions;
uniform float uBladeHeightMin;
uniform float uBladeHeightMax;
uniform float uBladeWidthMin;
uniform float uBladeWidthMax;
uniform float uBendAmountMin;
uniform float uBendAmountMax;
uniform float uClumpSize;
uniform float uClumpRadius;
uniform float uCenterYaw;
uniform float uBladeYaw;
uniform float uClumpYaw;
uniform vec3 uBladeRandomness;
uniform float uTypeTrendScale;
uniform float uWindTime;
uniform float uWindScale;
uniform float uWindSpeed;
uniform float uWindStrength;
uniform vec2 uWindDir;
uniform float uWindFacing;

layout(location = 0) out vec4 outBladeParams;
layout(location = 1) out vec4 outClumpData;
layout(location = 2) out vec4 outMotionSeeds;

float hash11(float x) {
  return fract(sin(x * 37.0) * 43758.5453123);
}

vec2 hash21(vec2 p) {
  float h1 = hash11(dot(p, vec2(127.1, 311.7)));
  float h2 = hash11(dot(p, vec2(269.5, 183.3)));
  return vec2(h1, h2);
}

vec2 hash2(vec2 p) {
  float x = dot(p, vec2(127.1, 311.7));
  float y = dot(p, vec2(269.5, 183.3));
  return fract(sin(vec2(x, y)) * 43758.5453);
}

vec2 safeNormalize(vec2 v) {
  float m2 = dot(v, v);
  return (m2 > 1e-6) ? v * inversesqrt(m2) : vec2(1.0, 0.0);
}

float normalizeAngle(float angle) {
  return atan(sin(angle), cos(angle));
}

vec3 getClumpInfo(vec2 worldXZ) {
  vec2 cell = worldXZ / uClumpSize;
  vec2 baseCell = floor(cell);
  float minDist = 1e9;
  vec2 bestCellId = vec2(0.0);
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 neighborCell = baseCell + vec2(float(i), float(j));
      vec2 seed = hash2(neighborCell);
      vec2 seedCoord = neighborCell + seed;
      vec2 diff = cell - seedCoord;
      float d2 = dot(diff, diff);
      if (d2 < minDist) {
        minDist = d2;
        bestCellId = neighborCell;
      }
    }
  }
  float distToCenter = sqrt(minDist) * uClumpSize;
  return vec3(distToCenter, bestCellId.x, bestCellId.y);
}

vec2 calculateToCenter(vec2 worldXZ, vec2 cellId) {
  vec2 clumpSeed = hash2(cellId);
  vec2 clumpCenterWorld = (cellId + clumpSeed) * uClumpSize;
  vec2 dir = clumpCenterWorld - worldXZ;
  float len = length(dir);
  return len > 1e-5 ? dir / len : vec2(1.0, 0.0);
}

float calculatePresence(float distToCenter) {
  float r = clamp(distToCenter / uClumpRadius, 0.0, 1.0);
  float t = clamp((r - 0.7) / (1.0 - 0.7), 0.0, 1.0);
  float smoothstepVal = t * t * (3.0 - 2.0 * t);
  return 1.0 - smoothstepVal;
}

vec4 getClumpParams(vec2 cellId) {
  vec2 c1 = hash21(cellId * 11.0);
  vec2 c2 = hash21(cellId * 23.0);
  float clumpBaseHeight = mix(uBladeHeightMin, uBladeHeightMax, c1.x);
  float clumpBaseWidth = mix(uBladeWidthMin, uBladeWidthMax, c1.y);
  float clumpBaseBend = mix(uBendAmountMin, uBendAmountMax, c2.x);
  float typeTrend = simplexNoise2d(cellId * uTypeTrendScale);
  typeTrend = typeTrend * 0.5 + 0.5;
  return vec4(clumpBaseHeight, clumpBaseWidth, clumpBaseBend, typeTrend);
}

vec4 getBladeParams(vec2 seed, vec4 clumpParams) {
  vec2 h1 = hash21(seed * 13.0);
  vec2 h2 = hash21(seed * 29.0);
  float height = clumpParams.x * mix(1.0 - uBladeRandomness.x, 1.0 + uBladeRandomness.x, h1.x);
  float width = clumpParams.y * mix(1.0 - uBladeRandomness.y, 1.0 + uBladeRandomness.y, h1.y);
  float bend = clumpParams.z * mix(1.0 - uBladeRandomness.z, 1.0 + uBladeRandomness.z, h2.x);
  float type = clumpParams.w;
  return vec4(height, width, bend, type);
}

float calculateBaseAngle(vec2 toCenter, vec2 worldXZ, vec2 cellId, float perBladeHash01) {
  float clumpAngle = atan(toCenter.y, toCenter.x) * uCenterYaw;
  float randomOffset = (perBladeHash01 - 0.5) * uBladeYaw;
  float clumpHash = hash11(dot(cellId, vec2(9.7, 3.1)));
  float clumpYaw = (clumpHash - 0.5) * uClumpYaw;
  return clumpAngle + randomOffset + clumpYaw;
}

float applyWindFacing(float baseAngle, vec2 windDir, float windStrength01) {
  float windAngle = atan(windDir.y, windDir.x);
  float angleDiff = atan(sin(windAngle - baseAngle), cos(windAngle - baseAngle));
  return baseAngle + angleDiff * (uWindFacing * windStrength01);
}

float applyWindFacingAndNormalize(float baseAngle, vec2 windDir, float windStrength01) {
  float facingAngle = applyWindFacing(baseAngle, windDir, windStrength01);
  return (normalizeAngle(facingAngle) + PI) / TWO_PI;
}

float calculateWindStrength(vec2 worldXZ) {
  vec2 windDir = safeNormalize(uWindDir);
  vec2 windUv = worldXZ * uWindScale + windDir * uWindTime * uWindSpeed;
  float windStrength01 = fbm2(windUv, 0.0);
  return clamp(windStrength01 * uWindStrength, 0.0, 1.0);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec4 posData = texture(uPositions, uv);
  vec2 worldXZ = posData.xz;
  vec3 clumpInfo = getClumpInfo(worldXZ);
  float distToCenter = clumpInfo.x;
  vec2 cellId = clumpInfo.yz;
  vec2 toCenter = calculateToCenter(worldXZ, cellId);
  float presence = calculatePresence(distToCenter);
  vec4 clumpParams = getClumpParams(cellId);
  vec4 bladeParams = getBladeParams(worldXZ, clumpParams);
  float perBladeHash01 = hash11(dot(worldXZ, vec2(37.0, 17.0)));
  float lodSeed01 = hash11(dot(worldXZ, vec2(19.3, 53.7)));
  float clumpSeed01 = hash11(dot(cellId, vec2(47.3, 61.7)));
  float baseAngle = calculateBaseAngle(toCenter, worldXZ, cellId, perBladeHash01);
  float windStrength = calculateWindStrength(worldXZ);
  vec2 windDir = safeNormalize(uWindDir);
  float facingAngle01 = applyWindFacingAndNormalize(baseAngle, windDir, windStrength);
  outBladeParams = bladeParams;
  outClumpData = vec4(toCenter.x, toCenter.y, presence, clumpSeed01);
  outMotionSeeds = vec4(facingAngle01, perBladeHash01, windStrength, lodSeed01);
}
`;

const grassVertexShader = `
${utility}
${fractal}
${terrainMath}

attribute vec3 instanceOffset;
attribute float instanceId;

uniform sampler2D uTextureBladeParams;
uniform sampler2D uTextureClumpData;
uniform sampler2D uTextureMotionSeeds;
uniform vec2 uTextureGrassSize;
uniform float uGeometryThicknessStrength;
uniform float uGeometryBaseWidth;
uniform float uGeometryTipThin;
uniform float uBladeSegments;
uniform float uWindTime;
uniform vec2 uWindDir;
uniform float uWindSwayFreqMin;
uniform float uWindSwayFreqMax;
uniform float uWindSwayStrength;
uniform vec2 uWindDistanceRange;
uniform vec2 uLODRange;
uniform vec3 uCullParams;

varying float vHeight;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vTangent;
varying vec3 vSide;
varying vec2 vToCenter;
varying vec3 vWorldPos;
varying float vClumpSeed;
varying float vBladeSeed;
varying float vWindStrength;
varying float vCullWeight;

vec2 safeNormalize(vec2 v) {
  float m2 = dot(v, v);
  return (m2 > 1e-6) ? v * inversesqrt(m2) : vec2(1.0, 0.0);
}

vec3 bezier3(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
  float u = 1.0 - t;
  return u*u*u*p0 + 3.0*u*u*t*p1 + 3.0*u*t*t*p2 + t*t*t*p3;
}

vec3 bezier3Tangent(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
  float u = 1.0 - t;
  return 3.0*u*u*(p1-p0) + 6.0*u*t*(p2-p1) + 3.0*t*t*(p3-p2);
}

vec3 getWindDirection() {
  return vec3(safeNormalize(uWindDir), 0.0).xzy;
}

void applyWindPush(inout vec3 p1, inout vec3 p2, inout vec3 p3, float windStrength, float height) {
  vec3 windDir = getWindDirection();
  float windScale = windStrength;
  float tipPush = windScale * height * 0.25;
  float midPush1 = windScale * height * 0.08;
  float midPush2 = windScale * height * 0.15;
  p1 += windDir * midPush1;
  p2 += windDir * midPush2;
  p3 += windDir * tipPush;
}

void applyWindSway(
  inout vec3 p1, inout vec3 p2, inout vec3 p3,
  float windStrength, float height, float perBladeHash01, float t,
  vec2 worldXZ
) {
  vec3 W = getWindDirection();
  vec3 CW = normalize(vec3(-W.z, 0.0, W.x));
  vec2 windDir2 = vec2(W.x, W.z);
  float seed = mod(perBladeHash01 * 3.567, 1.0);
  float gust = 0.65 + 0.35 * sin(uWindTime * 0.35 + seed * 6.28318);
  float wave = dot(worldXZ, windDir2) * 0.15;
  float baseFreq = mix(uWindSwayFreqMin, uWindSwayFreqMax, seed);
  float phase = perBladeHash01 * 6.28318 + wave;
  float low  = sin(uWindTime * baseFreq + phase + t * 2.2);
  float high = sin(uWindTime * (baseFreq * 5.0) + phase * 1.7 + t * 5.0);
  float amp = height * windStrength;
  float swayLow  = amp * gust * uWindSwayStrength;
  float swayHigh = amp * 0.8 * uWindSwayStrength;
  vec3 dir = normalize(W + CW * (high * 0.35));
  p1 += dir * (low * swayLow * 0.25 + high * swayHigh * 0.25 * 0.3);
  p2 += dir * (low * swayLow * 0.55 + high * swayHigh * 0.55 * 0.6);
  p3 += dir * (low * swayLow * 1.00 + high * swayHigh * 1.00 * 1.0);
}

vec3 applyViewDependentTilt(
  vec3 posObj, vec3 posW,
  vec3 tangent, vec3 side, vec3 normal,
  vec2 uv, float t
) {
  vec3 camDirW = normalize(cameraPosition - posW);
  vec3 tangentW = normalize((modelMatrix * vec4(tangent, 0.0)).xyz);
  vec3 sideW = normalize((modelMatrix * vec4(side, 0.0)).xyz);
  vec3 normalW = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  mat3 toLocal = mat3(tangentW, sideW, normalW);
  vec3 camDirLocal = normalize(transpose(toLocal) * camDirW);
  float edgeMask = (uv.x - 0.5) * camDirLocal.y;
  edgeMask *= pow(abs(camDirLocal.y), 1.2);
  edgeMask = clamp(edgeMask, 0.0, 1.0);
  float centerMask = pow(1.0 - t, 0.5) * pow(t + 0.05, 0.33);
  centerMask = clamp(centerMask, 0.0, 1.0);
  float tilt = uGeometryThicknessStrength * edgeMask * centerMask;
  vec3 nXZ = normalize(normal * vec3(1.0, 0.0, 1.0));
  return posObj + nXZ * tilt;
}

void getBezierControlPoints(float discreteType, float height, float bend, out vec3 p1, out vec3 p2) {
  if (discreteType == 0.0) {
    p1 = vec3(0.0, height * 0.4, bend * 0.5);
    p2 = vec3(0.0, height * 0.75, bend * 0.7);
  } else if (discreteType == 1.0) {
    p1 = vec3(0.0, height * 0.35, bend * 0.6);
    p2 = vec3(0.0, height * 0.7, bend * 0.8);
  } else {
    p1 = vec3(0.0, height * 0.3, bend * 0.7);
    p2 = vec3(0.0, height * 0.65, bend * 1.0);
  }
}

float calculateLODPositionT(float shapeT, vec3 instanceOffset) {
  vec3 worldBasePos = (modelMatrix * vec4(instanceOffset, 1.0)).xyz;
  float dist = length(cameraPosition - worldBasePos);
  float lodWeight = smoothstep(uLODRange.x, uLODRange.y, dist);
  float totalSegments = uBladeSegments;
  float vertexRow = floor(shapeT * totalSegments + 0.5);
  float foldedRow = floor(vertexRow / 2.0) * 2.0;
  float positionT = mix(vertexRow, foldedRow, step(0.5, lodWeight)) / totalSegments;
  return positionT;
}

void main() {
  float shapeT = uv.y;
  float s = (uv.x - 0.5) * 2.0;
  float positionT = calculateLODPositionT(shapeT, instanceOffset);
  int ix = int(mod(instanceId, uTextureGrassSize.x));
  int iy = int(floor(instanceId / uTextureGrassSize.x));
  ivec2 texelCoord = ivec2(ix, iy);
  vec4 bladeParams = texelFetch(uTextureBladeParams, texelCoord, 0);
  vec4 clumpData = texelFetch(uTextureClumpData, texelCoord, 0);
  vec4 motionSeeds = texelFetch(uTextureMotionSeeds, texelCoord, 0);
  float height = bladeParams.x;
  float width = bladeParams.y;
  float bend = bladeParams.z;
  float bladeType = floor(bladeParams.w * 3.0);
  vec2 toCenter = clumpData.xy;
  float presence = clumpData.z;
  float clumpSeed01 = clumpData.w;
  float facingAngle01 = motionSeeds.x;
  float perBladeHash01 = motionSeeds.y;
  float windStrength = motionSeeds.z;
  float facingAngle = facingAngle01 * 3.14159265359 * 2.0;
  vec3 worldBasePos = (modelMatrix * vec4(instanceOffset, 1.0)).xyz;
  float dist = length(cameraPosition - worldBasePos);
  float windDistanceFalloff = 1.0;
  if (uWindDistanceRange.y > 0.0) {
    windDistanceFalloff = 1.0 - smoothstep(uWindDistanceRange.x, uWindDistanceRange.y, dist);
  }
  windStrength *= windDistanceFalloff;
  vec3 p0 = vec3(0.0, 0.0, 0.0);
  vec3 p3 = vec3(0.0, height, 0.0);
  vec3 p1, p2;
  getBezierControlPoints(bladeType, height, bend, p1, p2);
  applyWindPush(p1, p2, p3, windStrength, height);
  applyWindSway(p1, p2, p3, windStrength, height, perBladeHash01, positionT, instanceOffset.xz);
  vec3 spine = bezier3(p0, p1, p2, p3, positionT);
  vec3 tangent = normalize(bezier3Tangent(p0, p1, p2, p3, positionT));
  vec3 ref = vec3(0.0, 0.0, 1.0);
  vec3 side = normalize(cross(ref, tangent));
  vec3 normal = normalize(cross(side, tangent));
  float cullWeight = smoothstep(uCullParams.x, uCullParams.y, dist);
  float isCulled = step(1.0 - cullWeight, perBladeHash01);
  float shrinkGate = smoothstep(1.0 - cullWeight, 1.0 - cullWeight + 0.1, perBladeHash01);
  float densityCompensation = mix(1.0, uCullParams.z, cullWeight);
  float finalPresence = presence * (1.0 - isCulled) * (1.0 - shrinkGate);
  float widthFactor = (shapeT + uGeometryBaseWidth) * pow(1.0 - shapeT, uGeometryTipThin);
  vec3 lpos = spine + side * (width * densityCompensation) * widthFactor * s * finalPresence;
  lpos.xz = rotate2D(lpos.xz, facingAngle);
  tangent.xz = rotate2D(tangent.xz, facingAngle);
  side.xz = rotate2D(side.xz, facingAngle);
  tangent = normalize(tangent);
  side = normalize(side);
  normal = normalize(normal);
  float terrainHeight = getTerrainHeight(worldBasePos.xz);
  vec3 terrainNormal = getTerrainNormal(worldBasePos.xz);
  vec3 up = vec3(0.0, 1.0, 0.0);
  vec3 axis = cross(up, terrainNormal);
  float dotProd = clamp(dot(up, terrainNormal), -1.0, 1.0);
  float angle = acos(dotProd);
  if (length(axis) > 0.001) {
      axis = normalize(axis);
      lpos = rotateAxis(lpos, axis, angle);
      tangent = rotateAxis(tangent, axis, angle);
      side = rotateAxis(side, axis, angle);
      normal = rotateAxis(normal, axis, angle);
  }
  vec3 posObj = lpos + instanceOffset;
  posObj.y += terrainHeight;
  vec3 posW = (modelMatrix * vec4(posObj, 1.0)).xyz;
  vec3 posObjTilted = applyViewDependentTilt(posObj, posW, tangent, side, normal, uv, shapeT);
  vec3 posWTilted = (modelMatrix * vec4(posObjTilted, 1.0)).xyz;
  vN = -normal;
  vTangent = tangent;
  vSide = side;
  vToCenter = toCenter;
  vWorldPos = posWTilted;
  vUv = uv;
  vHeight = shapeT;
  vClumpSeed = clumpSeed01;
  vBladeSeed = perBladeHash01;
  vWindStrength = windStrength;
  vCullWeight = cullWeight;
  gl_Position = projectionMatrix * viewMatrix * vec4(posWTilted, 1.0);
}
`;

const grassFragmentShader = `
${utility}
${simplexNoise}

uniform vec3 uBaseColor;
uniform vec3 uTipColor;
uniform vec2 uBladeSeedRange;
uniform vec2 uClumpInternalRange;
uniform vec2 uClumpSeedRange;
uniform float uAOPower;
uniform vec3 uGroundColor;
uniform vec4 uNoiseParams;
uniform float uMidSoft;
uniform float uRimPos;
uniform float uRimSoft;
uniform vec3 uLightDirection;
uniform vec3 uLightColor;
uniform float uLightIntensity;
uniform float uLightBackStrength;
uniform vec3 uCullParams;
uniform int uDebugMode;

varying float vHeight;
varying vec2 vUv;
varying vec3 vN;
varying vec3 vTangent;
varying vec3 vSide;
varying vec2 vToCenter;
varying vec3 vWorldPos;
varying float vClumpSeed;
varying float vBladeSeed;
varying float vWindStrength;
varying float vCullWeight;

vec3 computeLightingNormal(
  vec3 geoNormal,
  vec2 toCenter,
  float t,
  vec3 worldPos
) {
  vec3 clumpNormal = normalize(vec3(toCenter.x, 0.7, toCenter.y));
  float heightMask = pow(1.0 - t, 0.7);
  float dist = length(cameraPosition - worldPos);
  float distMask = smoothstep(4.0, 12.0, dist);
  vec3 blendedNormal = normalize(
    mix(
      geoNormal,
      clumpNormal,
      heightMask * distMask
    )
  );
  float mixToGround = smoothstep(uCullParams.x, uCullParams.y, dist);
  vec3 groundNormal = vec3(0.0, 1.0, 0.0);
  return normalize(mix(blendedNormal, groundNormal, mixToGround));
}

void main() {
  vec3 T = normalize(vTangent);
  vec3 S = normalize(vSide);
  vec3 baseNormal = normalize(vN);
  float u = vUv.x - 0.5;
  float au = abs(u);
  float mid01 = smoothstep(-uMidSoft, uMidSoft, u);
  float rimMask = smoothstep(uRimPos, uRimPos + uRimSoft, au);
  float v01 = mix(mid01, 1.0 - mid01, rimMask);
  float ny = v01 * 2.0 - 1.0;
  float widthNormalStrength = 0.35;
  vec3 geoNormal = normalize(baseNormal + S * ny * widthNormalStrength);
  vec3 lightingNormal = computeLightingNormal(
    geoNormal,
    vToCenter,
    vHeight,
    vWorldPos
  );
  if (uDebugMode == 1) {
    gl_FragColor = vec4(vec3(vHeight, vBladeSeed, vClumpSeed), 1.0);
    return;
  }
  if (uDebugMode == 2) {
    gl_FragColor = vec4(vec3(vToCenter * 0.5 + 0.5, vClumpSeed), 1.0);
    return;
  }
  if (uDebugMode == 3) {
    gl_FragColor = vec4(vec3(vWindStrength, 0.25 + vCullWeight * 0.75, 1.0 - vCullWeight), 1.0);
    return;
  }
  if (uDebugMode == 4) {
    gl_FragColor = vec4(lightingNormal * 0.5 + 0.5, 1.0);
    return;
  }
  vec3 color = mix(uBaseColor, uTipColor, vHeight);
  float innerClump = smoothstep(0.0, 1.0, length(vToCenter));
  color *= mix(uClumpInternalRange.x, uClumpInternalRange.y, innerClump);
  color *= mix(uClumpSeedRange.x, uClumpSeedRange.y, vClumpSeed);
  color *= mix(uBladeSeedRange.x, uBladeSeedRange.y, vBladeSeed);
  float ao = mix(0.35, 1.0, clamp(pow(vHeight, uAOPower), 0.0, 1.0));
  color *= ao;
  float dist = length(cameraPosition - vWorldPos);
  float distFade = smoothstep(6.0, 14.0, dist);
  color = mix(color, vec3(dot(color, vec3(0.333))), distFade * 0.35);
  float mixToGroundColor = smoothstep(uCullParams.x, uCullParams.y, dist);
  color = mix(color, uGroundColor, mixToGroundColor * 0.5);
  vec3 Ng = normalize(baseNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uLightDirection);
  vec3 N = lightingNormal;
  float backNdL = clamp(dot(-N, L), 0.0, 1.0);
  float NdV = dot(Ng, V);
  float viewGrazing = smoothstep(0.0, 0.6, 1.0 - NdV);
  float thickness = pow(1.0 - vHeight, 1.3);
  float backLight = backNdL * viewGrazing * thickness;
  vec3 trans = uLightColor * uLightIntensity * backLight * uLightBackStrength;
  color += trans;
  float noise = remap(
    simplexNoise2d(vUv * uNoiseParams.xy + vec2(vBladeSeed, vClumpSeed)),
    vec2(-1.0, 1.0),
    uNoiseParams.zw
  );
  color *= noise;
  float ndl = clamp(dot(N, normalize(-L)), 0.0, 1.0);
  vec3 lit = color * (0.28 + ndl * 0.92) * uLightColor * uLightIntensity;
  gl_FragColor = vec4(lit, 1.0);
}
`;

const grassVertexMainStart = grassVertexShader.indexOf("void main() {");
const grassVertexMainEnd = grassVertexShader.lastIndexOf("}");
const grassVertexPrelude = grassVertexShader.slice(0, grassVertexMainStart);
const grassVertexBody = `
vec3 transformed = vec3(position);
${grassVertexShader
  .slice(grassVertexMainStart + "void main() {".length, grassVertexMainEnd)
  .replace(
    "gl_Position = projectionMatrix * viewMatrix * vec4(posWTilted, 1.0);",
    "transformed = posObjTilted;",
  )}
`;
const grassFragmentPrelude = grassFragmentShader.slice(
  0,
  grassFragmentShader.indexOf("void main() {"),
);
const grassPbrColorChunk = `
{
  vec3 T = normalize(vTangent);
  vec3 S = normalize(vSide);
  vec3 baseNormal = normalize(vN);
  float u = vUv.x - 0.5;
  float au = abs(u);
  float mid01 = smoothstep(-uMidSoft, uMidSoft, u);
  float rimMask = smoothstep(uRimPos, uRimPos + uRimSoft, au);
  float v01 = mix(mid01, 1.0 - mid01, rimMask);
  float ny = v01 * 2.0 - 1.0;
  float widthNormalStrength = 0.35;
  vec3 geoNormal = normalize(baseNormal + S * ny * widthNormalStrength);
  vec3 lightingNormal = computeLightingNormal(
    geoNormal,
    vToCenter,
    vHeight,
    vWorldPos
  );
  vec3 color = mix(uBaseColor, uTipColor, vHeight);
  float innerClump = smoothstep(0.0, 1.0, length(vToCenter));
  color *= mix(uClumpInternalRange.x, uClumpInternalRange.y, innerClump);
  color *= mix(uClumpSeedRange.x, uClumpSeedRange.y, vClumpSeed);
  color *= mix(uBladeSeedRange.x, uBladeSeedRange.y, vBladeSeed);
  float ao = mix(0.35, 1.0, clamp(pow(vHeight, uAOPower), 0.0, 1.0));
  color *= ao;
  float dist = length(cameraPosition - vWorldPos);
  float distFade = smoothstep(6.0, 14.0, dist);
  color = mix(color, vec3(dot(color, vec3(0.333))), distFade * 0.35);
  float mixToGroundColor = smoothstep(uCullParams.x, uCullParams.y, dist);
  color = mix(color, uGroundColor, mixToGroundColor * 0.5);
  vec3 Ng = normalize(baseNormal);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uLightDirection);
  vec3 N = lightingNormal;
  float backNdL = clamp(dot(-N, L), 0.0, 1.0);
  float NdV = dot(Ng, V);
  float viewGrazing = smoothstep(0.0, 0.6, 1.0 - NdV);
  float thickness = pow(1.0 - vHeight, 1.3);
  float backLight = backNdL * viewGrazing * thickness;
  vec3 trans = uLightColor * backLight * uLightBackStrength;
  color += trans;
  float noise = remap(
    simplexNoise2d(vUv * uNoiseParams.xy + vec2(vBladeSeed, vClumpSeed)),
    vec2(-1.0, 1.0),
    uNoiseParams.zw
  );
  color *= noise;
  diffuseColor.rgb = color;
}
`;
const grassPbrNormalChunk = `
{
  vec3 T = normalize(vTangent);
  vec3 S = normalize(vSide);
  vec3 baseNormal = normalize(vN);
  float u = vUv.x - 0.5;
  float au = abs(u);
  float mid01 = smoothstep(-uMidSoft, uMidSoft, u);
  float rimMask = smoothstep(uRimPos, uRimPos + uRimSoft, au);
  float v01 = mix(mid01, 1.0 - mid01, rimMask);
  float ny = v01 * 2.0 - 1.0;
  float widthNormalStrength = 0.35;
  vec3 geoNormal = normalize(baseNormal + S * ny * widthNormalStrength);
  vec3 lightingNormal = computeLightingNormal(
    geoNormal,
    vToCenter,
    vHeight,
    vWorldPos
  );
  normal = normalize((viewMatrix * vec4(lightingNormal, 0.0)).xyz);
}
`;
const grassDebugOpaqueChunk = `
if (uDebugMode == 1) {
  gl_FragColor = vec4(vec3(vHeight, vBladeSeed, vClumpSeed), 1.0);
  return;
}
if (uDebugMode == 2) {
  gl_FragColor = vec4(vec3(vToCenter * 0.5 + 0.5, vClumpSeed), 1.0);
  return;
}
if (uDebugMode == 3) {
  gl_FragColor = vec4(vec3(vWindStrength, 0.25 + vCullWeight * 0.75, 1.0 - vCullWeight), 1.0);
  return;
}
if (uDebugMode == 4) {
  gl_FragColor = vec4(normal * 0.5 + 0.5, 1.0);
  return;
}
#include <opaque_fragment>
`;

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function createGrassGeometry(gridSize = DEFAULT_GRID_SIZE, patchSize = DEFAULT_PATCH_SIZE) {
  const grassBlades = gridSize * gridSize;
  const bladeGeometry = new THREE.PlaneGeometry(1, 1, 1, BLADE_SEGMENTS);
  bladeGeometry.translate(0, 1 / 2, 0);
  const instancedGeometry = new THREE.InstancedBufferGeometry();
  instancedGeometry.setAttribute("position", bladeGeometry.attributes.position);
  instancedGeometry.setAttribute("normal", bladeGeometry.attributes.normal);
  instancedGeometry.setAttribute("uv", bladeGeometry.attributes.uv);
  instancedGeometry.setIndex(bladeGeometry.index);
  const offsets = new Float32Array(grassBlades * 3);
  const instanceIds = new Float32Array(grassBlades);
  let i = 0;
  let idIdx = 0;
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const id = x * gridSize + z;
      if (id >= grassBlades) break;
      const fx = x / gridSize - 0.5;
      const fz = z / gridSize - 0.5;
      const seed = (x * 7919 + z * 7919) * 0.0001;
      const jitterX = (seededRandom(seed) - 0.5) * 0.2;
      const jitterZ = (seededRandom(seed + 1.0) - 0.5) * 0.2;
      const px = fx * patchSize + jitterX;
      const pz = fz * patchSize + jitterZ;
      offsets[i++] = px;
      offsets[i++] = 0;
      offsets[i++] = pz;
      instanceIds[idIdx++] = id;
    }
  }
  instancedGeometry.setAttribute("instanceOffset", new THREE.InstancedBufferAttribute(offsets, 3));
  instancedGeometry.setAttribute("instanceId", new THREE.InstancedBufferAttribute(instanceIds, 1));
  bladeGeometry.dispose();
  return instancedGeometry;
}

export function createPositionTexture(gridSize = DEFAULT_GRID_SIZE, patchSize = DEFAULT_PATCH_SIZE) {
  const data = new Float32Array(gridSize * gridSize * 4);
  let idx = 0;
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const fx = x / gridSize - 0.5;
      const fz = z / gridSize - 0.5;
      const seed = (x * 7919 + z * 7919) * 0.0001;
      const jitterX = (seededRandom(seed) - 0.5) * 0.2;
      const jitterZ = (seededRandom(seed + 1.0) - 0.5) * 0.2;
      const px = fx * patchSize + jitterX;
      const pz = fz * patchSize + jitterZ;
      data[idx++] = px;
      data[idx++] = 0;
      data[idx++] = pz;
      data[idx++] = 0;
    }
  }
  const texture = new THREE.DataTexture(data, gridSize, gridSize, THREE.RGBAFormat, THREE.FloatType);
  texture.needsUpdate = true;
  return texture;
}

function createFullscreenQuadScene(material) {
  const scene = new THREE.Scene();
  const geometry = new THREE.PlaneGeometry(2, 2);
  scene.add(new THREE.Mesh(geometry, material));
  return scene;
}

export function createGpuComputedGrassSystem(renderer, {
  gridSize = DEFAULT_GRID_SIZE,
  patchSize = DEFAULT_PATCH_SIZE,
  lightDirection = new THREE.Vector3(-0.45, -0.8, -0.32).normalize(),
  lightColor = new THREE.Color(1, 0.94, 0.82),
  lightIntensity = 2.0,
  terrain = { amplitude: 2.5, frequency: 0.1, seed: 0.0, color: "#1a3310" },
} = {}) {
  const positionTexture = createPositionTexture(gridSize, patchSize);
  const mrt = new THREE.WebGLRenderTarget(gridSize, gridSize, {
    count: 3,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depthBuffer: false,
    stencilBuffer: false,
  });
  const windDir = new THREE.Vector2(1, 0).normalize();
  const computeMaterial = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
    fragmentShader: grassComputeShader,
    uniforms: {
      uResolution: { value: new THREE.Vector2(gridSize, gridSize) },
      uPositions: { value: positionTexture },
      uBladeHeightMin: { value: 0.4 },
      uBladeHeightMax: { value: 0.8 },
      uBladeWidthMin: { value: 0.01 },
      uBladeWidthMax: { value: 0.05 },
      uBendAmountMin: { value: 0.2 },
      uBendAmountMax: { value: 0.6 },
      uClumpSize: { value: 0.8 },
      uClumpRadius: { value: 1.5 },
      uCenterYaw: { value: 1.0 },
      uBladeYaw: { value: 1.2 },
      uClumpYaw: { value: 0.5 },
      uBladeRandomness: { value: new THREE.Vector3(0.3, 0.3, 0.2) },
      uTypeTrendScale: { value: 0.1 },
      uWindTime: { value: 0 },
      uWindScale: { value: 0.25 },
      uWindSpeed: { value: 0.6 },
      uWindDir: { value: windDir },
      uWindFacing: { value: 0.6 },
      uWindStrength: { value: 0.35 },
    },
  });
  const computeScene = createFullscreenQuadScene(computeMaterial);
  const computeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometry = createGrassGeometry(gridSize, patchSize);
  const groundColor = new THREE.Color(terrain.color);
  const materialUniforms = {
    uTextureBladeParams: { value: mrt.textures[0] },
    uTextureClumpData: { value: mrt.textures[1] },
    uTextureMotionSeeds: { value: mrt.textures[2] },
    uTextureGrassSize: { value: new THREE.Vector2(gridSize, gridSize) },
    uGeometryThicknessStrength: { value: 0.02 },
    uGeometryBaseWidth: { value: 0.35 },
    uGeometryTipThin: { value: 0.9 },
    uBladeSegments: { value: BLADE_SEGMENTS },
    uWindTime: { value: 0 },
    uWindDir: { value: windDir },
    uWindSwayFreqMin: { value: 0.4 },
    uWindSwayFreqMax: { value: 1.5 },
    uWindSwayStrength: { value: 0.1 },
    uWindDistanceRange: { value: new THREE.Vector2(10, 30) },
    uBaseColor: { value: new THREE.Color("#000000") },
    uTipColor: { value: new THREE.Color("#3e8d2f") },
    uBladeSeedRange: { value: new THREE.Vector2(0.95, 1.03) },
    uClumpInternalRange: { value: new THREE.Vector2(0.95, 1.05) },
    uClumpSeedRange: { value: new THREE.Vector2(0.9, 1.1) },
    uAOPower: { value: 5.0 },
    uGroundColor: { value: groundColor },
    uNoiseParams: { value: new THREE.Vector4(5.0, 10.0, 0.7, 1.0) },
    uMidSoft: { value: 0.25 },
    uRimPos: { value: 0.42 },
    uRimSoft: { value: 0.03 },
    uLightDirection: { value: lightDirection },
    uLightColor: { value: lightColor },
    uLightIntensity: { value: lightIntensity },
    uLightBackStrength: { value: 0.2 },
    uLODRange: { value: new THREE.Vector2(5, 15) },
    uCullParams: { value: new THREE.Vector3(15, 30, 1.5) },
    uTerrainAmp: { value: terrain.amplitude },
    uTerrainFreq: { value: terrain.frequency },
    uTerrainSeed: { value: terrain.seed },
    uDebugMode: { value: 0 },
  };
  const material = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    roughness: 0.3,
    metalness: 0.5,
    envMapIntensity: 0.5,
  });
  material.uniforms = materialUniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, materialUniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${grassVertexPrelude}`)
      .replace("#include <begin_vertex>", grassVertexBody);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${grassFragmentPrelude}`)
      .replace("#include <map_fragment>", `#include <map_fragment>\n${grassPbrColorChunk}`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n${grassPbrNormalChunk}`)
      .replace("#include <opaque_fragment>", grassDebugOpaqueChunk);
  };
  material.customProgramCacheKey = () => "gpu-computed-grass-pbr-v1";
  const mesh = new THREE.InstancedMesh(geometry, material, gridSize * gridSize);
  mesh.frustumCulled = false;

  function compute() {
    const currentRenderTarget = renderer.getRenderTarget();
    renderer.setRenderTarget(mrt);
    renderer.render(computeScene, computeCamera);
    renderer.setRenderTarget(currentRenderTarget);
  }
  compute();

  return {
    object: mesh,
    material,
    computeMaterial,
    setDebugMode(mode) {
      material.uniforms.uDebugMode.value = gpuComputedGrassDebugModes.get(mode) ?? 0;
    },
    setLight({ direction, color, intensity } = {}) {
      if (direction) material.uniforms.uLightDirection.value.copy(direction);
      if (color) material.uniforms.uLightColor.value.copy(color);
      if (typeof intensity === "number") {
        material.uniforms.uLightIntensity.value = intensity;
      }
    },
    update({ elapsed }) {
      material.uniforms.uWindTime.value = elapsed;
      computeMaterial.uniforms.uWindTime.value = elapsed;
      compute();
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      computeMaterial.dispose();
      positionTexture.dispose();
      mrt.dispose();
      computeScene.traverse((child) => {
        child.geometry?.dispose?.();
      });
    },
  };
}

export function createGpuGrassTerrainMaterial({
  color = "#1a3310",
  amplitude = 2.5,
  frequency = 0.1,
  seed = 0,
} = {}) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTerrainAmp: { value: amplitude },
      uTerrainFreq: { value: frequency },
      uTerrainSeed: { value: seed },
    },
    vertexShader: `
      ${fractal}
      ${terrainMath}
      varying vec3 vNormalW;
      void main() {
        vec3 pos = position;
        vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        float h = getTerrainHeight(worldPos.xz);
        pos.z += h;
        vNormalW = getTerrainNormal(worldPos.xz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormalW;
      void main() {
        float shade = 0.45 + 0.55 * clamp(dot(normalize(vNormalW), normalize(vec3(0.35, 0.8, 0.25))), 0.0, 1.0);
        gl_FragColor = vec4(uColor * shade, 1.0);
      }
    `,
    side: THREE.DoubleSide,
  });
}
