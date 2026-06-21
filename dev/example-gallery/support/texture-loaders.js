import * as THREE from "three";

async function loadBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.arrayBuffer();
}

export async function loadHalfFloatTexture2D(url, width, height) {
  const buffer = await loadBuffer(url);
  const expectedBytes = width * height * 4 * 2;
  if (buffer.byteLength !== expectedBytes) {
    throw new Error(
      `${url} has ${buffer.byteLength} bytes; expected ${expectedBytes}.`,
    );
  }
  const texture = new THREE.DataTexture(
    new Uint16Array(buffer),
    width,
    height,
    THREE.RGBAFormat,
    THREE.HalfFloatType,
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export async function loadHalfFloatTexture3D(
  url,
  width,
  height,
  depth,
) {
  const buffer = await loadBuffer(url);
  const expectedBytes = width * height * depth * 4 * 2;
  if (buffer.byteLength !== expectedBytes) {
    throw new Error(
      `${url} has ${buffer.byteLength} bytes; expected ${expectedBytes}.`,
    );
  }
  const texture = new THREE.Data3DTexture(
    new Uint16Array(buffer),
    width,
    height,
    depth,
  );
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.HalfFloatType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.wrapR = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export async function loadUint8Texture3D(
  url,
  width,
  height,
  depth,
) {
  const buffer = await loadBuffer(url);
  const expectedBytes = width * height * depth;
  if (buffer.byteLength !== expectedBytes) {
    throw new Error(
      `${url} has ${buffer.byteLength} bytes; expected ${expectedBytes}.`,
    );
  }
  const texture = new THREE.Data3DTexture(
    new Uint8Array(buffer),
    width,
    height,
    depth,
  );
  texture.format = THREE.RedFormat;
  texture.type = THREE.UnsignedByteType;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.wrapR = THREE.RepeatWrapping;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export async function loadTexture2D(url) {
  const texture = await new THREE.TextureLoader().loadAsync(url);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export async function loadAtmosphereTextures(baseUrl) {
  const [irradianceTexture, scatteringTexture, transmittanceTexture] =
    await Promise.all([
      loadHalfFloatTexture2D(`${baseUrl}/irradiance.bin`, 64, 16),
      loadHalfFloatTexture3D(`${baseUrl}/scattering.bin`, 256, 128, 32),
      loadHalfFloatTexture2D(`${baseUrl}/transmittance.bin`, 256, 64),
    ]);
  return {
    irradianceTexture,
    scatteringTexture,
    transmittanceTexture,
  };
}

export async function loadCloudTextures(baseUrl) {
  const [
    localWeatherTexture,
    shapeTexture,
    shapeDetailTexture,
    turbulenceTexture,
    stbnTexture,
  ] = await Promise.all([
    loadTexture2D(`${baseUrl}/local_weather.png`),
    loadUint8Texture3D(`${baseUrl}/shape.bin`, 128, 128, 128),
    loadUint8Texture3D(`${baseUrl}/shape_detail.bin`, 32, 32, 32),
    loadTexture2D(`${baseUrl}/turbulence.png`),
    loadUint8Texture3D(`${baseUrl}/stbn.bin`, 128, 128, 64),
  ]);
  return {
    localWeatherTexture,
    shapeTexture,
    shapeDetailTexture,
    turbulenceTexture,
    stbnTexture,
  };
}

export function disposeTextures(textures) {
  for (const texture of Object.values(textures)) {
    texture?.dispose?.();
  }
}
