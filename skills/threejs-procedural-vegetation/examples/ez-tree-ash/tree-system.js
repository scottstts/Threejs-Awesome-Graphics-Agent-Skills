import * as THREE from "three";

class SeededRandom {
  constructor(seed) {
    this.w = (123456789 + seed) | 0;
    this.z = (987654321 - seed) | 0;
  }

  value(max = 1, min = 0) {
    this.z = (36969 * (this.z & 65535) + (this.z >> 16)) | 0;
    this.w = (18000 * (this.w & 65535) + (this.w >> 16)) | 0;
    const normalized =
      (((this.z << 16) + (this.w & 65535)) >>> 0) / 4294967296;
    return min + (max - min) * normalized;
  }

  shuffledIndices(count) {
    const values = Array.from({ length: count }, (_, index) => index);
    for (let index = count - 1; index > 0; index -= 1) {
      const swap = Math.floor(this.value() * (index + 1));
      [values[index], values[swap]] = [values[swap], values[index]];
    }
    return values;
  }
}

function createBranchBuffers() {
  return {
    positions: [],
    normals: [],
    uvs: [],
    levels: [],
    continuation: [],
    indices: [],
  };
}

function createLeafBuffers() {
  return {
    positions: [],
    normals: [],
    uvs: [],
    levels: [],
    indices: [],
    origins: [],
  };
}

function pushBranchVertex(
  buffers,
  position,
  normal,
  uv,
  level,
  continuation,
) {
  const index = buffers.positions.length / 3;
  buffers.positions.push(position.x, position.y, position.z);
  buffers.normals.push(normal.x, normal.y, normal.z);
  buffers.uvs.push(uv.x, uv.y);
  buffers.levels.push(level);
  buffers.continuation.push(continuation ? 1 : 0);
  return index;
}

function pushLeafVertex(buffers, position, normal, uv, level) {
  const index = buffers.positions.length / 3;
  buffers.positions.push(position.x, position.y, position.z);
  buffers.normals.push(normal.x, normal.y, normal.z);
  buffers.uvs.push(uv.x, uv.y);
  buffers.levels.push(level);
  return index;
}

function interpolateSection(sections, normalizedDistance) {
  const scaled = normalizedDistance * (sections.length - 1);
  const indexA = Math.min(Math.floor(scaled), sections.length - 1);
  const indexB = Math.min(indexA + 1, sections.length - 1);
  const alpha = scaled - indexA;
  const sectionA = sections[indexA];
  const sectionB = sections[indexB];
  const qA = new THREE.Quaternion().setFromEuler(sectionA.orientation);
  const qB = new THREE.Quaternion().setFromEuler(sectionB.orientation);

  return {
    origin: new THREE.Vector3().lerpVectors(
      sectionA.origin,
      sectionB.origin,
      alpha,
    ),
    radius: THREE.MathUtils.lerp(sectionA.radius, sectionB.radius, alpha),
    orientation: new THREE.Euler().setFromQuaternion(qB.slerp(qA, alpha)),
  };
}

function buildGeometry(buffers, includeContinuation = false) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(buffers.positions, 3),
  );
  geometry.setAttribute(
    "normal",
    new THREE.Float32BufferAttribute(buffers.normals, 3),
  );
  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(buffers.uvs, 2),
  );
  geometry.setAttribute(
    "aLevel",
    new THREE.Float32BufferAttribute(buffers.levels, 1),
  );
  if (includeContinuation) {
    geometry.setAttribute(
      "aContinuation",
      new THREE.Float32BufferAttribute(buffers.continuation, 1),
    );
  }
  geometry.setIndex(buffers.indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

export function compileAshTree(preset) {
  const random = new SeededRandom(preset.seed);
  const branches = createBranchBuffers();
  const leaves = createLeafBuffers();
  const forceDirection = new THREE.Vector3(
    ...preset.branch.forceDirection,
  ).normalize();
  const jobs = [
    {
      origin: new THREE.Vector3(),
      orientation: new THREE.Euler(),
      length: preset.branch.length[0],
      radius: preset.branch.radius[0],
      level: 0,
      sectionCount: preset.branch.sections[0],
      segmentCount: preset.branch.segments[0],
      continuation: true,
    },
  ];

  const stats = {
    branchJobs: [0, 0, 0, 0],
    continuations: [0, 0, 0, 0],
    lateralChildren: [0, 0, 0, 0],
    leafCards: 0,
  };

  function emitLeaf(origin, orientation, level) {
    const size =
      preset.leaves.size *
      (1 +
        random.value(
          preset.leaves.sizeVariance,
          -preset.leaves.sizeVariance,
        ));
    leaves.origins.push(origin.x, origin.y, origin.z);

    for (const cardRotation of [0, Math.PI * 0.5]) {
      const base = leaves.positions.length / 3;
      const localVertices = [
        new THREE.Vector3(-size * 0.5, size, 0),
        new THREE.Vector3(-size * 0.5, 0, 0),
        new THREE.Vector3(size * 0.5, 0, 0),
        new THREE.Vector3(size * 0.5, size, 0),
      ];
      const uv = [
        new THREE.Vector2(0, 1),
        new THREE.Vector2(0, 0),
        new THREE.Vector2(1, 0),
        new THREE.Vector2(1, 1),
      ];
      const cardNormal = new THREE.Vector3(0, 0, 1)
        .applyEuler(orientation)
        .normalize();

      for (let vertexIndex = 0; vertexIndex < 4; vertexIndex += 1) {
        const vertex = localVertices[vertexIndex]
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), cardRotation)
          .applyEuler(orientation)
          .add(origin);
        const roundedNormal = cardNormal
          .clone()
          .add(vertex.clone().sub(origin))
          .normalize();
        pushLeafVertex(
          leaves,
          vertex,
          roundedNormal,
          uv[vertexIndex],
          level / preset.branchLevels,
        );
      }
      leaves.indices.push(
        base,
        base + 1,
        base + 2,
        base,
        base + 2,
        base + 3,
      );
      stats.leafCards += 1;
    }
  }

  function emitLeavesAlongFinalBranch(sections, level) {
    const count = preset.leaves.count;
    const radialOffset = random.value();
    const angularSlots = random.shuffledIndices(count);
    const step = (1 - preset.leaves.start) / count;

    for (let slot = 0; slot < count; slot += 1) {
      const along =
        preset.leaves.start + (slot + random.value()) * step;
      const parent = interpolateSection(sections, along);
      const azimuth =
        Math.PI *
        2 *
        (radialOffset +
          (angularSlots[slot] + random.value(0.5, -0.5)) / count);
      const tilt = THREE.MathUtils.degToRad(preset.leaves.angle);
      const localTilt = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        tilt,
      );
      const localAzimuth = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        azimuth,
      );
      const parentQuaternion = new THREE.Quaternion().setFromEuler(
        parent.orientation,
      );
      const orientation = new THREE.Euler().setFromQuaternion(
        parentQuaternion.multiply(localAzimuth.multiply(localTilt)),
      );
      emitLeaf(parent.origin, orientation, level);
    }
  }

  function enqueueLateralChildren(parentLevel, sections) {
    const level = parentLevel + 1;
    const count = preset.branch.children[parentLevel];
    const start = preset.branch.start[level];
    const radialOffset = random.value();
    const angularSlots = random.shuffledIndices(count);
    const step = (1 - start) / count;

    for (let slot = 0; slot < count; slot += 1) {
      const along = start + (slot + random.value()) * step;
      const parent = interpolateSection(sections, along);
      const azimuth =
        Math.PI *
        2 *
        (radialOffset +
          (angularSlots[slot] + random.value(0.5, -0.5)) / count);
      const emergence = THREE.MathUtils.degToRad(
        preset.branch.angle[level],
      );
      const localTilt = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        emergence,
      );
      const localAzimuth = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        azimuth,
      );
      const parentQuaternion = new THREE.Quaternion().setFromEuler(
        parent.orientation,
      );
      const orientation = new THREE.Euler().setFromQuaternion(
        parentQuaternion.multiply(localAzimuth.multiply(localTilt)),
      );
      jobs.push({
        origin: parent.origin,
        orientation,
        length: preset.branch.length[level],
        radius: preset.branch.radius[level] * parent.radius,
        level,
        sectionCount: preset.branch.sections[level],
        segmentCount: preset.branch.segments[level],
        continuation: false,
      });
      stats.lateralChildren[level] += 1;
    }
  }

  while (jobs.length > 0) {
    const branch = jobs.shift();
    stats.branchJobs[branch.level] += 1;
    if (branch.continuation) stats.continuations[branch.level] += 1;

    const indexOffset = branches.positions.length / 3;
    let orientation = branch.orientation.clone();
    let origin = branch.origin.clone();
    const sectionLength = branch.length / branch.sectionCount;
    const sections = [];
    const wrapsX = Math.max(
      1,
      Math.round(branch.radius * preset.bark.textureScaleX),
    );

    for (
      let sectionIndex = 0;
      sectionIndex <= branch.sectionCount;
      sectionIndex += 1
    ) {
      let sectionRadius =
        branch.radius *
        (1 -
          preset.branch.taper[branch.level] *
            (sectionIndex / branch.sectionCount));
      if (
        sectionIndex === branch.sectionCount &&
        branch.level === preset.branchLevels
      ) {
        sectionRadius = 0.001;
      }

      let firstVertex;
      let firstNormal;
      for (
        let radialIndex = 0;
        radialIndex < branch.segmentCount;
        radialIndex += 1
      ) {
        const angle =
          (Math.PI * 2 * radialIndex) / branch.segmentCount;
        const radial = new THREE.Vector3(
          Math.cos(angle),
          0,
          Math.sin(angle),
        );
        const vertex = radial
          .clone()
          .multiplyScalar(sectionRadius)
          .applyEuler(orientation)
          .add(origin);
        const normal = radial.clone().applyEuler(orientation).normalize();
        if (radialIndex === 0) {
          firstVertex = vertex.clone();
          firstNormal = normal.clone();
        }
        pushBranchVertex(
          branches,
          vertex,
          normal,
          new THREE.Vector2(
            (radialIndex / branch.segmentCount) * wrapsX,
            sectionIndex % 2 === 0 ? 0 : 1,
          ),
          branch.level / preset.branchLevels,
          branch.continuation,
        );
      }
      pushBranchVertex(
        branches,
        firstVertex,
        firstNormal,
        new THREE.Vector2(
          wrapsX,
          sectionIndex % 2 === 0 ? 0 : 1,
        ),
        branch.level / preset.branchLevels,
        branch.continuation,
      );

      sections.push({
        origin: origin.clone(),
        orientation: orientation.clone(),
        radius: sectionRadius,
      });

      origin.add(
        new THREE.Vector3(0, sectionLength, 0).applyEuler(orientation),
      );

      const safeRadius = Math.max(sectionRadius, 0.001);
      const gnarliness =
        Math.max(1, 1 / Math.sqrt(safeRadius)) *
        preset.branch.gnarliness[branch.level];
      orientation.x += random.value(gnarliness, -gnarliness);
      orientation.z += random.value(gnarliness, -gnarliness);

      const sectionQuaternion = new THREE.Quaternion().setFromEuler(
        orientation,
      );
      sectionQuaternion.multiply(
        new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          preset.branch.twist[branch.level],
        ),
      );
      const sectionUp = new THREE.Vector3(0, 1, 0).applyQuaternion(
        sectionQuaternion,
      );
      const forceAxis = new THREE.Vector3().crossVectors(
        sectionUp,
        forceDirection,
      );
      const sine = forceAxis.length();
      if (sine > 1e-6) {
        forceAxis.divideScalar(sine);
        const fullAngle = Math.atan2(
          sine,
          sectionUp.dot(forceDirection),
        );
        const step = preset.branch.forceStrength / safeRadius;
        sectionQuaternion.premultiply(
          new THREE.Quaternion().setFromAxisAngle(
            forceAxis,
            THREE.MathUtils.clamp(step, -fullAngle, fullAngle),
          ),
        );
      }
      orientation.setFromQuaternion(sectionQuaternion);
    }

    const ringSize = branch.segmentCount + 1;
    for (
      let sectionIndex = 0;
      sectionIndex < branch.sectionCount;
      sectionIndex += 1
    ) {
      for (
        let radialIndex = 0;
        radialIndex < branch.segmentCount;
        radialIndex += 1
      ) {
        const a = indexOffset + sectionIndex * ringSize + radialIndex;
        const b = a + 1;
        const c = a + ringSize;
        const d = b + ringSize;
        branches.indices.push(a, c, b, b, c, d);
      }
    }

    const finalSection = sections.at(-1);
    if (branch.level < preset.branchLevels) {
      const nextLevel = branch.level + 1;
      jobs.push({
        origin: finalSection.origin,
        orientation: finalSection.orientation,
        length: preset.branch.length[nextLevel],
        radius: finalSection.radius,
        level: nextLevel,
        sectionCount: branch.sectionCount,
        segmentCount: branch.segmentCount,
        continuation: true,
      });
      enqueueLateralChildren(branch.level, sections);
    } else {
      emitLeaf(
        finalSection.origin,
        finalSection.orientation,
        branch.level,
      );
      emitLeavesAlongFinalBranch(sections, branch.level);
    }
  }

  const leafOrigins = new THREE.BufferGeometry();
  leafOrigins.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(leaves.origins, 3),
  );

  return {
    branchGeometry: buildGeometry(branches, true),
    leafGeometry: buildGeometry(leaves),
    leafOrigins,
    stats,
  };
}
