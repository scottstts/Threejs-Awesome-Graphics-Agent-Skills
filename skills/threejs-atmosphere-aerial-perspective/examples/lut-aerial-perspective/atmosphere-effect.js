import * as THREE from "three";

export const ATMOSPHERE_TEXTURE_LAYOUT = Object.freeze({
  transmittance: { width: 256, height: 64 },
  scattering: { width: 256, height: 128, depth: 32 },
  irradiance: { width: 64, height: 16 },
});

export const EARTH_ATMOSPHERE_KM = Object.freeze({
  bottomRadius: 6360,
  topRadius: 6420,
  solarIrradiance: [1.474, 1.8504, 1.91198],
  rayleighScattering: [0.005802, 0.013558, 0.0331],
  mieScattering: [0.003996, 0.003996, 0.003996],
  miePhaseG: 0.8,
  sunAngularRadius: 0.004675,
  minimumSunCosine: Math.cos(THREE.MathUtils.degToRad(120)),
});

const fullscreenVertexShader = `
  precision highp float;
  in vec3 position;
  out vec2 vUv;

  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const atmosphereFunctions = `
  const float PI = 3.141592653589793;
  const int TRANSMITTANCE_TEXTURE_WIDTH = 256;
  const int TRANSMITTANCE_TEXTURE_HEIGHT = 64;
  const int SCATTERING_TEXTURE_R_SIZE = 32;
  const int SCATTERING_TEXTURE_MU_SIZE = 128;
  const int SCATTERING_TEXTURE_MU_S_SIZE = 32;
  const int SCATTERING_TEXTURE_NU_SIZE = 8;
  const int IRRADIANCE_TEXTURE_WIDTH = 64;
  const int IRRADIANCE_TEXTURE_HEIGHT = 16;

  float clampCosine(float value) {
    return clamp(value, -1.0, 1.0);
  }

  float safeSqrt(float value) {
    return sqrt(max(value, 0.0));
  }

  float distanceToTop(float radius, float cosine) {
    float discriminant =
      radius * radius * (cosine * cosine - 1.0) +
      uTopRadius * uTopRadius;
    return max(-radius * cosine + safeSqrt(discriminant), 0.0);
  }

  bool rayIntersectsGround(float radius, float cosine) {
    return cosine < 0.0 &&
      radius * radius * (cosine * cosine - 1.0) +
      uBottomRadius * uBottomRadius >= 0.0;
  }

  float textureCoord(float value, int size) {
    float scale = float(size);
    return 0.5 / scale + value * (1.0 - 1.0 / scale);
  }

  vec2 transmittanceUv(float radius, float cosine) {
    float H = sqrt(
      uTopRadius * uTopRadius - uBottomRadius * uBottomRadius
    );
    float rho = safeSqrt(
      radius * radius - uBottomRadius * uBottomRadius
    );
    float distance = distanceToTop(radius, cosine);
    float minimumDistance = uTopRadius - radius;
    float maximumDistance = rho + H;
    float xMu = (distance - minimumDistance) /
      max(maximumDistance - minimumDistance, 1e-5);
    float xRadius = rho / H;
    return vec2(
      textureCoord(xMu, TRANSMITTANCE_TEXTURE_WIDTH),
      textureCoord(xRadius, TRANSMITTANCE_TEXTURE_HEIGHT)
    );
  }

  vec3 transmittanceToTop(float radius, float cosine) {
    return texture(
      uTransmittanceTexture,
      transmittanceUv(radius, cosine)
    ).rgb;
  }

  vec3 segmentTransmittance(
    float radius,
    float cosine,
    float distance,
    bool intersectsGround
  ) {
    float destinationRadius = clamp(
      sqrt(
        distance * distance +
        2.0 * radius * cosine * distance +
        radius * radius
      ),
      uBottomRadius,
      uTopRadius
    );
    float destinationCosine = clampCosine(
      (radius * cosine + distance) / destinationRadius
    );
    if (intersectsGround) {
      return min(
        transmittanceToTop(destinationRadius, -destinationCosine) /
          max(transmittanceToTop(radius, -cosine), vec3(1e-6)),
        vec3(1.0)
      );
    }
    return min(
      transmittanceToTop(radius, cosine) /
        max(
          transmittanceToTop(destinationRadius, destinationCosine),
          vec3(1e-6)
        ),
      vec3(1.0)
    );
  }

  vec3 transmittanceToSun(float radius, float sunCosine) {
    float sinHorizon = uBottomRadius / radius;
    float cosHorizon = -safeSqrt(1.0 - sinHorizon * sinHorizon);
    return transmittanceToTop(radius, sunCosine) * smoothstep(
      -sinHorizon * uSunAngularRadius,
      sinHorizon * uSunAngularRadius,
      sunCosine - cosHorizon
    );
  }

  float rayleighPhase(float cosine) {
    return 3.0 / (16.0 * PI) * (1.0 + cosine * cosine);
  }

  float miePhase(float cosine) {
    float g2 = uMiePhaseG * uMiePhaseG;
    float scale =
      3.0 / (8.0 * PI) *
      (1.0 - g2) / (2.0 + g2);
    return scale * (1.0 + cosine * cosine) /
      pow(
        max(1.0 + g2 - 2.0 * uMiePhaseG * cosine, 1e-4),
        1.5
      );
  }

  vec4 scatteringUvwz(
    float radius,
    float viewCosine,
    float sunCosine,
    float viewSunCosine,
    bool intersectsGround
  ) {
    float H = sqrt(
      uTopRadius * uTopRadius - uBottomRadius * uBottomRadius
    );
    float rho = safeSqrt(
      radius * radius - uBottomRadius * uBottomRadius
    );
    float uRadius = textureCoord(
      rho / H,
      SCATTERING_TEXTURE_R_SIZE
    );
    float radiusCosine = radius * viewCosine;
    float discriminant =
      radiusCosine * radiusCosine -
      radius * radius +
      uBottomRadius * uBottomRadius;
    float uView;
    if (intersectsGround) {
      float distance =
        -radiusCosine - safeSqrt(discriminant);
      float minimumDistance = radius - uBottomRadius;
      float maximumDistance = rho;
      float normalizedDistance =
        maximumDistance == minimumDistance
          ? 0.0
          : (distance - minimumDistance) /
            (maximumDistance - minimumDistance);
      uView = 0.5 - 0.5 * textureCoord(
        normalizedDistance,
        SCATTERING_TEXTURE_MU_SIZE / 2
      );
    } else {
      float distance =
        -radiusCosine + safeSqrt(discriminant + H * H);
      float minimumDistance = uTopRadius - radius;
      float maximumDistance = rho + H;
      uView = 0.5 + 0.5 * textureCoord(
        (distance - minimumDistance) /
          max(maximumDistance - minimumDistance, 1e-5),
        SCATTERING_TEXTURE_MU_SIZE / 2
      );
    }

    float distance = distanceToTop(uBottomRadius, sunCosine);
    float minimumDistance = uTopRadius - uBottomRadius;
    float maximumDistance = H;
    float a = (distance - minimumDistance) /
      (maximumDistance - minimumDistance);
    float referenceDistance =
      distanceToTop(uBottomRadius, uMinimumSunCosine);
    float referenceA = (referenceDistance - minimumDistance) /
      (maximumDistance - minimumDistance);
    float uSun = textureCoord(
      max(1.0 - a / referenceA, 0.0) / (1.0 + a),
      SCATTERING_TEXTURE_MU_S_SIZE
    );
    float uNu = (viewSunCosine + 1.0) * 0.5;
    return vec4(uNu, uSun, uView, uRadius);
  }

  vec3 extrapolatedMie(vec4 combined) {
    if (combined.r < 1e-5) {
      return vec3(0.0);
    }
    return combined.rgb *
      combined.a / combined.r *
      (uRayleighScattering.r / uMieScattering.r) *
      (uMieScattering / uRayleighScattering);
  }

  vec3 combinedScattering(
    float radius,
    float viewCosine,
    float sunCosine,
    float viewSunCosine,
    bool intersectsGround,
    out vec3 singleMie
  ) {
    vec4 uvwz = scatteringUvwz(
      radius,
      viewCosine,
      sunCosine,
      viewSunCosine,
      intersectsGround
    );
    float textureX =
      uvwz.x * float(SCATTERING_TEXTURE_NU_SIZE - 1);
    float slice = floor(textureX);
    float fraction = textureX - slice;
    vec3 uvw0 = vec3(
      (slice + uvwz.y) / float(SCATTERING_TEXTURE_NU_SIZE),
      uvwz.z,
      uvwz.w
    );
    vec3 uvw1 = vec3(
      (slice + 1.0 + uvwz.y) /
        float(SCATTERING_TEXTURE_NU_SIZE),
      uvwz.z,
      uvwz.w
    );
    vec4 combined = mix(
      texture(uScatteringTexture, uvw0),
      texture(uScatteringTexture, uvw1),
      fraction
    );
    singleMie = extrapolatedMie(combined);
    return combined.rgb;
  }

  vec3 skyRadiance(
    vec3 camera,
    vec3 viewRay,
    out vec3 transmittance
  ) {
    float radius = length(camera);
    float radiusCosine = dot(camera, viewRay);
    float entryDistance =
      -radiusCosine -
      safeSqrt(
        radiusCosine * radiusCosine -
        radius * radius +
        uTopRadius * uTopRadius
      );
    if (entryDistance > 0.0) {
      camera += viewRay * entryDistance;
      radius = uTopRadius;
      radiusCosine += entryDistance;
    } else if (radius > uTopRadius) {
      transmittance = vec3(1.0);
      return vec3(0.0);
    }

    float viewCosine = radiusCosine / radius;
    float sunCosine = dot(camera, uSunDirection) / radius;
    float viewSunCosine = dot(viewRay, uSunDirection);
    bool intersectsGround =
      rayIntersectsGround(radius, viewCosine);
    transmittance = intersectsGround
      ? vec3(0.0)
      : transmittanceToTop(radius, viewCosine);

    vec3 singleMie;
    vec3 scattering = combinedScattering(
      radius,
      viewCosine,
      sunCosine,
      viewSunCosine,
      intersectsGround,
      singleMie
    );
    return (
      scattering * rayleighPhase(viewSunCosine) +
      singleMie * miePhase(viewSunCosine)
    ) * uSkyRadianceToLuminance;
  }

  bool segmentOutsideAtmosphere(
    vec3 camera,
    vec3 point,
    float radius
  ) {
    if (
      radius < uTopRadius ||
      length(point) < uTopRadius
    ) {
      return false;
    }
    vec3 ray = point - camera;
    float t = -clamp(
      dot(camera, ray) / dot(ray, ray),
      0.0,
      1.0
    );
    return length(camera + t * ray) > uTopRadius;
  }

  vec3 radianceToPoint(
    vec3 camera,
    vec3 point,
    out vec3 transmittance
  ) {
    float radius = length(camera);
    if (segmentOutsideAtmosphere(camera, point, radius)) {
      transmittance = vec3(1.0);
      return vec3(0.0);
    }

    vec3 viewRay = normalize(point - camera);
    float radiusCosine = dot(camera, viewRay);
    float entryDistance =
      -radiusCosine -
      safeSqrt(
        radiusCosine * radiusCosine -
        radius * radius +
        uTopRadius * uTopRadius
      );
    if (entryDistance > 0.0) {
      camera += viewRay * entryDistance;
      radius = uTopRadius;
      radiusCosine += entryDistance;
    }

    float viewCosine = radiusCosine / radius;
    float sunCosine = dot(camera, uSunDirection) / radius;
    float viewSunCosine = dot(viewRay, uSunDirection);
    float distance = length(point - camera);
    bool intersectsGround =
      rayIntersectsGround(radius, viewCosine);
    if (!intersectsGround) {
      float horizonCosine = -safeSqrt(
        1.0 -
        uBottomRadius / radius *
        (uBottomRadius / radius)
      );
      viewCosine = max(viewCosine, horizonCosine + 0.004);
    }

    transmittance = segmentTransmittance(
      radius,
      viewCosine,
      distance,
      intersectsGround
    );

    vec3 singleMie;
    vec3 scattering = combinedScattering(
      radius,
      viewCosine,
      sunCosine,
      viewSunCosine,
      intersectsGround,
      singleMie
    );

    float destinationRadius = clamp(
      sqrt(
        distance * distance +
        2.0 * radius * viewCosine * distance +
        radius * radius
      ),
      uBottomRadius,
      uTopRadius
    );
    float destinationViewCosine =
      (radius * viewCosine + distance) /
      destinationRadius;
    float destinationSunCosine =
      (radius * sunCosine +
        distance * viewSunCosine) /
      destinationRadius;
    vec3 destinationMie;
    vec3 destinationScattering = combinedScattering(
      destinationRadius,
      destinationViewCosine,
      destinationSunCosine,
      viewSunCosine,
      intersectsGround,
      destinationMie
    );
    scattering -= transmittance * destinationScattering;
    singleMie -= transmittance * destinationMie;
    singleMie = extrapolatedMie(
      vec4(scattering, singleMie.r)
    );
    singleMie *= smoothstep(0.0, 0.01, sunCosine);

    return (
      scattering * rayleighPhase(viewSunCosine) +
      singleMie * miePhase(viewSunCosine)
    ) * uSkyRadianceToLuminance;
  }

  vec3 solarRadiance() {
    return (
      uSolarIrradiance /
      (PI * uSunAngularRadius * uSunAngularRadius)
    ) * uSunRadianceToLuminance;
  }
`;

function createUniforms({
  transmittanceTexture,
  scatteringTexture,
  irradianceTexture,
  sunDirection = new THREE.Vector3(0.2, 0.08, -0.98).normalize(),
  planetCenter = new THREE.Vector3(0, -6360, 0),
  parameters = EARTH_ATMOSPHERE_KM,
}) {
  return {
    uSceneColor: { value: null },
    uSceneDepth: { value: null },
    uInverseProjection: { value: new THREE.Matrix4() },
    uCameraWorld: { value: new THREE.Matrix4() },
    uCameraPosition: { value: new THREE.Vector3() },
    uPlanetCenter: { value: planetCenter.clone() },
    uSunDirection: { value: sunDirection.clone().normalize() },
    uTransmittanceTexture: { value: transmittanceTexture },
    uScatteringTexture: { value: scatteringTexture },
    uIrradianceTexture: { value: irradianceTexture },
    uBottomRadius: { value: parameters.bottomRadius },
    uTopRadius: { value: parameters.topRadius },
    uSolarIrradiance: {
      value: new THREE.Vector3(...parameters.solarIrradiance),
    },
    uRayleighScattering: {
      value: new THREE.Vector3(...parameters.rayleighScattering),
    },
    uMieScattering: {
      value: new THREE.Vector3(...parameters.mieScattering),
    },
    uMiePhaseG: { value: parameters.miePhaseG },
    uSunAngularRadius: { value: parameters.sunAngularRadius },
    uMinimumSunCosine: { value: parameters.minimumSunCosine },
    uSkyRadianceToLuminance: {
      value: new THREE.Vector3(
        1.434022,
        0.889942,
        0.815059,
      ),
    },
    uSunRadianceToLuminance: {
      value: new THREE.Vector3(
        1.225784,
        0.872938,
        0.829539,
      ),
    },
    uExposure: { value: 2.2 },
    uOutputTransform: { value: 1 },
    uDebugMode: { value: 0 },
  };
}

export function createAtmosphereAerialPerspectiveMaterial(options) {
  const uniforms = createUniforms(options);
  return new THREE.RawShaderMaterial({
    name: "AtmosphereAerialPerspectiveMaterial",
    glslVersion: THREE.GLSL3,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms,
    vertexShader: fullscreenVertexShader,
    fragmentShader: `
      precision highp float;
      precision highp sampler3D;

      uniform sampler2D uSceneColor;
      uniform sampler2D uSceneDepth;
      uniform mat4 uInverseProjection;
      uniform mat4 uCameraWorld;
      uniform vec3 uCameraPosition;
      uniform vec3 uPlanetCenter;
      uniform vec3 uSunDirection;
      uniform sampler2D uTransmittanceTexture;
      uniform sampler3D uScatteringTexture;
      uniform sampler2D uIrradianceTexture;
      uniform float uBottomRadius;
      uniform float uTopRadius;
      uniform vec3 uSolarIrradiance;
      uniform vec3 uRayleighScattering;
      uniform vec3 uMieScattering;
      uniform float uMiePhaseG;
      uniform float uSunAngularRadius;
      uniform float uMinimumSunCosine;
      uniform vec3 uSkyRadianceToLuminance;
      uniform vec3 uSunRadianceToLuminance;
      uniform float uExposure;
      uniform int uOutputTransform;
      uniform int uDebugMode;

      in vec2 vUv;
      out vec4 outputColor;

      ${atmosphereFunctions}

      vec3 worldRay(vec2 uv) {
        vec4 view = uInverseProjection *
          vec4(uv * 2.0 - 1.0, 1.0, 1.0);
        return normalize(
          (uCameraWorld * vec4(view.xyz / view.w, 0.0)).xyz
        );
      }

      vec3 reconstructWorld(vec2 uv, float depth) {
        vec4 view = uInverseProjection *
          vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
        view /= view.w;
        return (uCameraWorld * view).xyz;
      }

      vec3 agxApprox(vec3 color) {
        color = max(color, vec3(0.0));
        color = color / (color + vec3(0.155));
        return pow(color, vec3(1.0 / 2.2));
      }

      void main() {
        float depth = texture(uSceneDepth, vUv).r;
        vec3 camera = uCameraPosition - uPlanetCenter;
        vec3 ray = worldRay(vUv);
        vec3 transmittance;
        vec3 radiance;

        if (depth >= 0.999999) {
          radiance = skyRadiance(camera, ray, transmittance);
          float sunCosine = dot(ray, uSunDirection);
          float sunDisc = smoothstep(
            cos(uSunAngularRadius * 1.35),
            cos(uSunAngularRadius * 0.70),
            sunCosine
          );
          radiance +=
            transmittance * solarRadiance() * sunDisc;
        } else {
          vec3 worldPosition = reconstructWorld(vUv, depth);
          vec3 point = worldPosition - uPlanetCenter;
          vec3 sceneRadiance = texture(uSceneColor, vUv).rgb;
          vec3 inscatter =
            radianceToPoint(camera, point, transmittance);
          radiance = sceneRadiance * transmittance + inscatter;
        }

        if (uDebugMode == 1) {
          outputColor = vec4(transmittance, 1.0);
          return;
        }
        if (uDebugMode == 2) {
          outputColor = vec4(
            agxApprox(max(radiance, vec3(0.0)) * 2.0),
            1.0
          );
          return;
        }
        if (uDebugMode == 3) {
          outputColor = vec4(
            depth >= 0.999999
              ? vec3(0.12, 0.32, 0.92)
              : vec3(1.0, 0.34, 0.05),
            1.0
          );
          return;
        }

        outputColor = uOutputTransform == 1
          ? vec4(agxApprox(radiance * uExposure), 1.0)
          : vec4(radiance, 1.0);
      }
    `,
  });
}

export function updateAtmosphereCamera(
  material,
  camera,
  { sceneColor, sceneDepth } = {},
) {
  const uniforms = material.uniforms;
  camera.updateMatrixWorld(true);
  uniforms.uInverseProjection.value.copy(
    camera.projectionMatrixInverse,
  );
  uniforms.uCameraWorld.value.copy(camera.matrixWorld);
  uniforms.uCameraPosition.value.setFromMatrixPosition(
    camera.matrixWorld,
  );
  if (sceneColor) uniforms.uSceneColor.value = sceneColor;
  if (sceneDepth) uniforms.uSceneDepth.value = sceneDepth;
}

export function setAtmosphereDebugMode(material, mode) {
  const modes = new Map([
    ["final", 0],
    ["transmittance", 1],
    ["inscatter", 2],
    ["depth-classification", 3],
  ]);
  material.uniforms.uDebugMode.value = modes.get(mode) ?? 0;
}
