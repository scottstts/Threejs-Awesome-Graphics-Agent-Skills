import * as THREE from "three";

const fullscreenVertexShader = `
  precision highp float;
  in vec3 position;
  out vec2 vUv;

  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export function createCloudMaterial({
  localWeatherTexture,
  shapeTexture,
  shapeDetailTexture,
  turbulenceTexture,
  stbnTexture,
}) {
  const uniforms = {
    uBackground: { value: null },
    uSceneDepth: { value: null },
    uLocalWeather: { value: localWeatherTexture },
    uShape: { value: shapeTexture },
    uShapeDetail: { value: shapeDetailTexture },
    uTurbulence: { value: turbulenceTexture },
    uStbn: { value: stbnTexture },
    uTime: { value: 0 },
    uFrame: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uCameraPosition: { value: new THREE.Vector3() },
    uInverseProjection: { value: new THREE.Matrix4() },
    uCameraWorld: { value: new THREE.Matrix4() },
    uSunDirection: {
      value: new THREE.Vector3(-0.92, 0.055, -0.39).normalize(),
    },
    uCoverage: { value: 0.4 },
    uDebugMode: { value: 0 },
  };

  return new THREE.RawShaderMaterial({
    name: "WeatherVolumeCloudMaterial",
    glslVersion: THREE.GLSL3,
    uniforms,
    vertexShader: fullscreenVertexShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    fragmentShader: `
      precision highp float;
      precision highp sampler3D;

      uniform sampler2D uBackground;
      uniform sampler2D uSceneDepth;
      uniform sampler2D uLocalWeather;
      uniform sampler3D uShape;
      uniform sampler3D uShapeDetail;
      uniform sampler2D uTurbulence;
      uniform sampler3D uStbn;
      uniform float uTime;
      uniform int uFrame;
      uniform vec2 uResolution;
      uniform vec3 uCameraPosition;
      uniform mat4 uInverseProjection;
      uniform mat4 uCameraWorld;
      uniform vec3 uSunDirection;
      uniform float uCoverage;
      uniform int uDebugMode;

      in vec2 vUv;
      out vec4 outputColor;

      const float LOW_MIN = 0.75;
      const float LOW_MAX = 1.40;
      const float MIDDLE_MIN = 1.00;
      const float MIDDLE_MAX = 2.20;
      const float HIGH_MIN = 7.50;
      const float HIGH_MAX = 8.00;
      const float PLANET_RADIUS = 6360.0;
      const int PRIMARY_STEPS = 320;
      const int LIGHT_STEPS = 5;
      const float PI = 3.141592653589793;

      float saturate(float value) {
        return clamp(value, 0.0, 1.0);
      }

      vec4 saturate4(vec4 value) {
        return clamp(value, vec4(0.0), vec4(1.0));
      }

      vec4 remapClamped(
        vec4 value,
        vec4 minimumValue,
        vec4 maximumValue
      ) {
        vec4 span = maximumValue - minimumValue;
        vec4 magnitude = max(abs(span), vec4(1e-5));
        vec4 safeSpan = mix(
          -magnitude,
          magnitude,
          greaterThanEqual(span, vec4(0.0))
        );
        return saturate4(
          (value - minimumValue) / safeSpan
        );
      }

      float remapClamped(
        float value,
        float minimumValue,
        float maximumValue
      ) {
        return saturate(
          (value - minimumValue) /
          max(maximumValue - minimumValue, 1e-5)
        );
      }

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

      vec2 raySphere(
        vec3 origin,
        vec3 direction,
        float radius
      ) {
        float originDirection = dot(origin, direction);
        float discriminant =
          originDirection * originDirection -
          dot(origin, origin) +
          radius * radius;
        if (discriminant < 0.0) {
          return vec2(1e8, -1e8);
        }
        float root = sqrt(discriminant);
        return vec2(
          -originDirection - root,
          -originDirection + root
        );
      }

      float altitude(vec3 position) {
        return length(
          position - vec3(0.0, -PLANET_RADIUS, 0.0)
        ) - PLANET_RADIUS;
      }

      vec3 localToReferenceEcef(vec3 position) {
        const vec3 east = vec3(0.0, 1.0, 0.0);
        const vec3 up = vec3(
          0.39073113,
          0.0,
          0.92050485
        );
        const vec3 forward = vec3(
          0.92050485,
          0.0,
          -0.39073113
        );
        return (
          east * position.x +
          up * position.y +
          forward * position.z
        );
      }

      vec3 absoluteEcef(vec3 position) {
        return vec3(
          2499.43037338,
          0.0,
          5848.87359567
        ) + localToReferenceEcef(position);
      }

      vec2 cubeSphereUv(vec3 position) {
        vec3 normal = normalize(position);
        vec3 largest = abs(normal);
        vec3 cube = normal /
          max(largest.x, max(largest.y, largest.z));
        vec2 face;
        if (
          largest.y > largest.x &&
          largest.y > largest.z
        ) {
          face = cube.y > 0.0
            ? vec2(-normal.x, normal.z)
            : normal.xz;
        } else if (
          largest.x > largest.y &&
          largest.x > largest.z
        ) {
          face = cube.x > 0.0
            ? normal.yz
            : vec2(-normal.y, normal.z);
        } else {
          face = cube.z > 0.0
            ? normal.xy
            : vec2(normal.x, -normal.y);
        }

        vec2 squared = face * face;
        float q =
          dot(squared, vec2(-2.0, 2.0)) - 3.0;
        float q2 = q * q;
        vec2 uv;
        uv.x = sqrt(
          1.5 +
          squared.x -
          squared.y -
          0.5 * sqrt(-24.0 * squared.x + q2)
        ) * (face.x > 0.0 ? 1.0 : -1.0);
        uv.y = sqrt(6.0 / (3.0 - uv.x * uv.x)) * face.y;
        return uv * 0.5 + 0.5;
      }

      vec2 weatherCoordinate(vec3 position) {
        return cubeSphereUv(absoluteEcef(position)) * 100.0 +
          vec2(uTime * 0.001, 0.0);
      }

      vec4 sampleWeather(vec3 position) {
        return texture(uLocalWeather, weatherCoordinate(position));
      }

      vec4 heightFractions(float height) {
        return vec4(
          remapClamped(height, LOW_MIN, LOW_MAX),
          remapClamped(height, MIDDLE_MIN, MIDDLE_MAX),
          remapClamped(height, HIGH_MIN, HIGH_MAX),
          0.0
        );
      }

      vec4 activeLayers(float height) {
        return vec4(
          step(LOW_MIN, height) * step(height, LOW_MAX),
          step(MIDDLE_MIN, height) * step(height, MIDDLE_MAX),
          step(HIGH_MIN, height) * step(height, HIGH_MAX),
          0.0
        );
      }

      vec4 weatherDensity(
        vec4 weather,
        vec4 heightFraction
      ) {
        vec4 biased = pow(
          max(heightFraction, vec4(0.0)),
          vec4(0.35)
        );
        vec4 rounded =
          vec4(1.0) -
          pow(clamp(biased * 2.0 - 1.0, -1.0, 1.0), vec4(2.0));
        vec4 filterWidth = vec4(0.6, 0.6, 0.5, 0.6);
        vec4 factor = vec4(1.0) - uCoverage * rounded;
        return remapClamped(
          mix(weather, vec4(1.0), filterWidth),
          factor,
          factor + filterWidth
        );
      }

      vec4 sampleDensity(
        vec3 position,
        out vec4 weather,
        out float baseShape,
        out float detailShape
      ) {
        float height = altitude(position);
        vec4 layerMask = activeLayers(height);
        if (dot(layerMask, vec4(1.0)) == 0.0) {
          weather = vec4(0.0);
          baseShape = 0.0;
          detailShape = 0.0;
          return vec4(0.0);
        }

        vec4 fraction = heightFractions(height);
        weather = sampleWeather(position);
        vec4 density = weatherDensity(weather, fraction) * layerMask;

        vec2 weatherUv = weatherCoordinate(position);
        vec3 turbulence =
          (texture(uTurbulence, weatherUv * 20.0).rgb * 2.0 - 1.0) *
          0.35 *
          dot(
            density,
            remapClamped(
              fraction,
              vec4(0.3),
              vec4(0.0)
            )
          );
        vec3 evolution = vec3(0.0, -uTime * 0.02, 0.0);
        vec3 shapePosition = absoluteEcef(
          position + evolution + turbulence
        ) * 0.3;
        baseShape = texture(uShape, shapePosition).r;
        vec4 shapeAmount = vec4(1.0, 1.0, 0.4, 0.0);
        density = remapClamped(
          density,
          (vec4(1.0) - baseShape) * shapeAmount,
          vec4(1.0)
        );

        detailShape = texture(
          uShapeDetail,
          absoluteEcef(position + turbulence) * 6.0
        ).r;
        vec4 modifier = mix(
          vec4(pow(detailShape, 6.0)),
          vec4(1.0 - detailShape),
          remapClamped(fraction, vec4(0.2), vec4(0.4))
        );
        modifier *= vec4(1.0, 1.0, 0.0, 0.0);
        density = remapClamped(
          density * 2.0,
          modifier * 0.5,
          vec4(1.0)
        );

        vec4 profile = fraction * 0.75 + 0.25;
        vec4 densityScale = vec4(0.2, 0.2, 0.003, 0.0);
        return saturate4(
          density * densityScale * profile * layerMask
        );
      }

      float totalDensity(vec3 position) {
        vec4 weather;
        float baseShape;
        float detailShape;
        return dot(
          sampleDensity(
            position,
            weather,
            baseShape,
            detailShape
          ),
          vec4(1.0)
        );
      }

      float henyeyGreenstein(float cosine, float g) {
        float g2 = g * g;
        return (1.0 - g2) /
          (
            4.0 * PI *
            pow(
              max(1.0 + g2 - 2.0 * g * cosine, 1e-4),
              1.5
            )
          );
      }

      float cloudPhase(float cosine) {
        return mix(
          henyeyGreenstein(cosine, 0.7),
          henyeyGreenstein(cosine, -0.2),
          0.5
        );
      }

      float sunOpticalDepth(vec3 position) {
        float opticalDepth = 0.0;
        float stepLength = 0.11;
        vec3 samplePosition = position;
        for (int index = 0; index < LIGHT_STEPS; index += 1) {
          samplePosition += uSunDirection * stepLength;
          opticalDepth +=
            totalDensity(samplePosition) *
            stepLength *
            8.0;
          stepLength *= 2.0;
        }
        return opticalDepth;
      }

      void main() {
        vec3 background = texture(uBackground, vUv).rgb;
        vec3 rayDirection = worldRay(vUv);
        vec3 rayOrigin = uCameraPosition;

        vec3 planetRelative =
          rayOrigin - vec3(0.0, -PLANET_RADIUS, 0.0);
        vec2 outerHit = raySphere(
          planetRelative,
          rayDirection,
          PLANET_RADIUS + HIGH_MAX
        );
        vec2 innerHit = raySphere(
          planetRelative,
          rayDirection,
          PLANET_RADIUS + LOW_MIN
        );
        float cameraAltitude =
          length(planetRelative) - PLANET_RADIUS;
        float nearDistance;
        if (cameraAltitude < LOW_MIN) {
          nearDistance = max(innerHit.y, 0.0);
        } else if (cameraAltitude <= HIGH_MAX) {
          nearDistance = 0.0;
        } else {
          nearDistance = max(outerHit.x, 0.0);
        }
        float farDistance = min(
          outerHit.y,
          nearDistance + 200.0
        );

        float sceneDepth = texture(uSceneDepth, vUv).r;
        if (sceneDepth < 0.999999) {
          vec3 scenePosition =
            reconstructWorld(vUv, sceneDepth);
          farDistance = min(
            farDistance,
            length(scenePosition - rayOrigin)
          );
        }

        if (farDistance <= nearDistance) {
          outputColor = vec4(background, 1.0);
          return;
        }

        float segmentLength = farDistance - nearDistance;
        float stepLength = max(
          segmentLength / float(PRIMARY_STEPS),
          0.05
        );
        ivec3 noiseSize = textureSize(uStbn, 0);
        vec3 noiseCoordinate = vec3(
          gl_FragCoord.xy / vec2(noiseSize.xy),
          float(uFrame % noiseSize.z) / float(noiseSize.z)
        );
        float jitter = texture(uStbn, noiseCoordinate).r;
        float distanceAlongRay =
          nearDistance + stepLength * jitter;
        float transmittance = 1.0;
        vec3 radiance = vec3(0.0);
        vec3 densityAccumulation = vec3(0.0);
        vec3 weatherAccumulation = vec3(0.0);
        float baseAccumulation = 0.0;
        float detailAccumulation = 0.0;
        float lightingAccumulation = 0.0;
        float cosine = dot(rayDirection, uSunDirection);
        float phase = cloudPhase(cosine);

        for (int index = 0; index < PRIMARY_STEPS; index += 1) {
          if (
            distanceAlongRay >= farDistance ||
            transmittance < 0.01
          ) {
            break;
          }

          vec3 position =
            rayOrigin + rayDirection * distanceAlongRay;
          float height = altitude(position);
          bool insideOccupiedBand =
            (
              height >= LOW_MIN &&
              height <= MIDDLE_MAX
            ) ||
            (
              height >= HIGH_MIN &&
              height <= HIGH_MAX
            );
          if (!insideOccupiedBand) {
            distanceAlongRay += max(stepLength, 0.25);
            continue;
          }

          vec4 weather;
          float baseShape;
          float detailShape;
          vec4 layers = sampleDensity(
            position,
            weather,
            baseShape,
            detailShape
          );
          float density = dot(layers, vec4(1.0));
          if (density > 1e-4) {
            float opticalDepth = sunOpticalDepth(position);
            float sunTransmittance =
              exp(-opticalDepth * 1.25);
            float heightLight = smoothstep(
              LOW_MIN,
              HIGH_MAX,
              height
            );
            vec3 skyIrradiance = mix(
              vec3(0.28, 0.35, 0.46),
              vec3(0.64, 0.72, 0.82),
              heightLight
            );
            vec3 sunIrradiance =
              vec3(1.0, 0.88, 0.72) *
              sunTransmittance *
              (0.4 + phase * 8.0);
            float powder =
              1.0 - 0.8 * exp(-density * 150.0);
            vec3 source =
              (skyIrradiance * 0.48 + sunIrradiance) *
              powder;
            float extinction = density * 8.0;
            float stepTransmittance =
              exp(-extinction * stepLength);
            vec3 integrated =
              source *
              (1.0 - stepTransmittance) /
              max(extinction, 1e-5);
            radiance +=
              transmittance * integrated * density * 8.0;
            transmittance *= stepTransmittance;

            densityAccumulation += layers.rgb * stepLength * 6.0;
            weatherAccumulation += weather.rgb * density * stepLength;
            baseAccumulation += baseShape * density * stepLength;
            detailAccumulation += detailShape * density * stepLength;
            lightingAccumulation +=
              dot(source, vec3(0.2126, 0.7152, 0.0722)) *
              density *
              stepLength;
          }
          distanceAlongRay += stepLength;
        }

        vec3 color = background * transmittance + radiance;
        if (uDebugMode == 1) {
          color = clamp(weatherAccumulation * 10.0, 0.0, 1.0);
        } else if (uDebugMode == 2) {
          color = vec3(saturate(baseAccumulation * 8.0));
        } else if (uDebugMode == 3) {
          color = vec3(saturate(detailAccumulation * 8.0));
        } else if (uDebugMode == 4) {
          color = clamp(densityAccumulation, 0.0, 1.0);
        } else if (uDebugMode == 5) {
          color = vec3(transmittance);
        } else if (uDebugMode == 6) {
          color = vec3(saturate(lightingAccumulation * 6.0));
        }
        outputColor = vec4(color, 1.0);
      }
    `,
  });
}

export function createResolveMaterial() {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      uCurrent: { value: null },
      uHistory: { value: null },
      uHistoryValid: { value: 0 },
      uCurrentTexel: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: fullscreenVertexShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uCurrent;
      uniform sampler2D uHistory;
      uniform int uHistoryValid;
      uniform vec2 uCurrentTexel;
      in vec2 vUv;
      out vec4 outputColor;

      void main() {
        vec3 current = texture(uCurrent, vUv).rgb;
        vec3 minimumColor = current;
        vec3 maximumColor = current;
        for (int x = -1; x <= 1; x += 1) {
          for (int y = -1; y <= 1; y += 1) {
            vec3 neighbor = texture(
              uCurrent,
              vUv + vec2(float(x), float(y)) * uCurrentTexel
            ).rgb;
            minimumColor = min(minimumColor, neighbor);
            maximumColor = max(maximumColor, neighbor);
          }
        }
        vec3 history = texture(uHistory, vUv).rgb;
        vec3 clipped = clamp(history, minimumColor, maximumColor);
        vec3 resolved = uHistoryValid == 1
          ? mix(current, clipped, 0.55)
          : current;
        outputColor = vec4(resolved, 1.0);
      }
    `,
  });
}

export function createCopyMaterial() {
  return new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      uTexture: { value: null },
      uCurrent: { value: null },
      uDebugHistory: { value: 0 },
      uExposure: { value: 1.15 },
    },
    vertexShader: fullscreenVertexShader,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    fragmentShader: `
      precision highp float;
      uniform sampler2D uTexture;
      uniform sampler2D uCurrent;
      uniform int uDebugHistory;
      uniform float uExposure;
      in vec2 vUv;
      out vec4 outputColor;

      vec3 toneMap(vec3 color) {
        color = max(color * uExposure, vec3(0.0));
        vec3 numerator =
          color * (2.51 * color + vec3(0.03));
        vec3 denominator =
          color * (2.43 * color + vec3(0.59)) +
          vec3(0.14);
        return pow(
          clamp(numerator / denominator, 0.0, 1.0),
          vec3(1.0 / 2.2)
        );
      }

      void main() {
        vec3 resolved = texture(uTexture, vUv).rgb;
        vec3 color = toneMap(resolved);
        if (uDebugHistory == 1) {
          vec3 current = texture(uCurrent, vUv).rgb;
          float difference = length(current - resolved);
          float rejected = smoothstep(0.001, 0.03, difference);
          float luma = dot(
            resolved,
            vec3(0.2126, 0.7152, 0.0722)
          );
          color = mix(
            vec3(luma * 0.55),
            vec3(1.0, 0.035, 0.01),
            rejected
          );
        }
        outputColor = vec4(color, 1.0);
      }
    `,
  });
}
