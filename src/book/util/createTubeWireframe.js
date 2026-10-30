import * as THREE from "three";

const DEFAULT_OPTIONS = {
  thickness: 0.005,
  radiusSegments: 4,
};

export default function createTubeWireframe(geometry, options = {}) {
  const { thickness, radiusSegments } = { ...DEFAULT_OPTIONS, ...options };
  const position = geometry.getAttribute("position");
  const index = geometry.getIndex();
  const edges = new Set();
  const positions = [];
  const normals = [];
  const indices = [];
  const keyFor = (vertex) =>
    [position.getX(vertex), position.getY(vertex), position.getZ(vertex)]
      .map((value) => value.toFixed(6))
      .join(",");

  const addEdge = (a, b) => {
    const [low, high] = [keyFor(a), keyFor(b)].sort();
    const key = `${low}:${high}`;
    if (!edges.has(key)) {
      edges.add(key);
      appendTube(a, b);
    }
  };

  const appendTube = (a, b) => {
    const start = new THREE.Vector3().fromBufferAttribute(position, a);
    const end = new THREE.Vector3().fromBufferAttribute(position, b);
    const direction = end.clone().sub(start);
    const length = direction.length();
    if (length === 0) return;
    direction.multiplyScalar(1 / length);

    const reference =
      Math.abs(direction.y) < 0.9
        ? new THREE.Vector3(0, 1, 0)
        : new THREE.Vector3(1, 0, 0);
    const axisA = new THREE.Vector3()
      .crossVectors(direction, reference)
      .normalize();
    const axisB = new THREE.Vector3()
      .crossVectors(direction, axisA)
      .normalize();
    const baseIndex = positions.length / 3;

    for (const point of [start, end]) {
      for (let segment = 0; segment < radiusSegments; segment++) {
        const angle = (segment / radiusSegments) * Math.PI * 2;
        const nx = axisA.x * Math.cos(angle) + axisB.x * Math.sin(angle);
        const ny = axisA.y * Math.cos(angle) + axisB.y * Math.sin(angle);
        const nz = axisA.z * Math.cos(angle) + axisB.z * Math.sin(angle);
        positions.push(
          point.x + nx * thickness,
          point.y + ny * thickness,
          point.z + nz * thickness,
        );
        normals.push(nx, ny, nz);
      }
    }

    for (let segment = 0; segment < radiusSegments; segment++) {
      const next = (segment + 1) % radiusSegments;
      const startA = baseIndex + segment;
      const startB = baseIndex + next;
      const endA = baseIndex + radiusSegments + segment;
      const endB = baseIndex + radiusSegments + next;
      indices.push(startA, startB, endA, startB, endB, endA);
    }
  };

  const count = index ? index.count : position.count;
  const vertexAt = (i) => (index ? index.getX(i) : i);
  for (let i = 0; i + 2 < count; i += 3) {
    const a = vertexAt(i);
    const b = vertexAt(i + 1);
    const c = vertexAt(i + 2);
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }

  const result = new THREE.BufferGeometry();
  result.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3),
  );
  result.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  result.setIndex(indices);
  return result;
}
