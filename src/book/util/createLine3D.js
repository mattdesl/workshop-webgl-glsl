import * as THREE from "three";
import { clamp } from "canvas-sketch-util/math";
import defined from "defined";
import fragmentShader from "../shaders/line-screen-space.frag";
import vertexShader from "../shaders/line-screen-space.vert";
import getDistance from "euclidean-distance";

const getPolylineDistance = (path) => {
  return path.reduce((sum, item, i, list) => {
    const newDistance =
      i === 0 ? 0 : item.position.distanceTo(list[i - 1].position);
    return sum + newDistance;
  }, 0);
};

const setGeometryAttribute = (geometry, name, values, itemSize) => {
  const array = new Float32Array(values.flat(Infinity));
  const attribute = geometry.getAttribute(name);

  if (
    !attribute ||
    attribute.itemSize !== itemSize ||
    attribute.array.length !== array.length
  ) {
    geometry.setAttribute(name, new THREE.BufferAttribute(array, itemSize));
  } else {
    attribute.array.set(array);
    attribute.needsUpdate = true;
  }
};

const setGeometryIndex = (geometry, indices) => {
  const attribute = geometry.getIndex();

  if (
    !attribute ||
    attribute.array.length !== indices.length ||
    attribute.array.constructor !== indices.constructor
  ) {
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  } else {
    attribute.array.set(indices);
    attribute.needsUpdate = true;
  }
};

class LineGeometry extends THREE.BufferGeometry {
  constructor(path) {
    super();
    if (path) this.update(path);
    this.pathData = (path || []).slice();
  }

  push(data) {
    this.pathData.push(data);
    this.update(this.pathData);
  }

  clear() {
    this.update([]);
  }

  update(data = [], props = {}) {
    this.pathData = data.slice();
    let path = this.pathData.map((p) => p.position.toArray());

    // each pair has a mirrored direction
    const direction = duplicate(
      path.map((x) => 1),
      true,
    );

    // now get the positional data for each vertex
    const positions = duplicate(path);
    const previous = duplicate(path.map(relative(-1)));
    const next = duplicate(path.map(relative(+1)));
    const indexUint16 =
      path.length >= 2 ? createIndices(path.length - 1) : new Uint16Array(0);

    // these are just for special effects
    const distances = [];
    let totalDistance = 0;
    path.forEach((p, i, list) => {
      const pathData = data[i];

      var lineAlpha = list.length <= 1 ? 1 : i / (list.length - 1);
      totalDistance += i > 0 ? getDistance(p, list[i - 1]) : 0;
      var dist = [lineAlpha, defined(pathData.distance, totalDistance)];
      distances.push(dist, dist);
    });

    setGeometryIndex(this, indexUint16);
    setGeometryAttribute(this, "position", positions, 3);
    setGeometryAttribute(this, "previousPosition", previous, 3);
    setGeometryAttribute(this, "nextPosition", next, 3);
    setGeometryAttribute(this, "direction", direction, 1);
    setGeometryAttribute(this, "distances", distances, 2);
  }
}

function relative(offset) {
  return (point, index, list) => {
    index = clamp(index + offset, 0, list.length - 1);
    return list[index];
  };
}

function duplicate(nestedArray, mirror) {
  var out = [];
  nestedArray.forEach((x) => {
    let x1 = mirror ? -x : x;
    out.push(x1, x);
  });
  return out;
}

function createIndices(length) {
  let indices = new Uint16Array(length * 6);
  let c = 0;
  let index = 0;
  for (let j = 0; j < length; j++) {
    let i = index;
    indices[c++] = i + 0;
    indices[c++] = i + 1;
    indices[c++] = i + 2;
    indices[c++] = i + 2;
    indices[c++] = i + 1;
    indices[c++] = i + 3;
    index += 2;
  }
  return indices;
}

// Modern ES Default Export instead of module.exports
export default (opt = {}) => {
  const geometry = new LineGeometry();
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
    transparent: true,
    uniforms: {
      thickness: { value: defined(opt.thickness, 1) },
      aspect: { value: 1 },
      time: { value: 0 },
      totalDistance: { value: 1 },
      dashDistance: { value: defined(opt.dashDistance, 1) },
      dashRepeat: { value: defined(opt.dashRepeat, 10) },
      dash: { value: Boolean(opt.dash), type: "b" },
      opacity: { value: defined(opt.opacity, 1) },
      color: { value: new THREE.Color(opt.color || "white") },
    },
  });
  material.precision = "highp";
  const object = new THREE.Mesh(geometry, material);
  object.frustumCulled = false;
  return {
    object,
    geometry,
    material,
    dispose() {
      geometry.dispose();
    },
    resize({ width, height }) {
      material.uniforms.aspect.value = width / height;
    },
    tick(props) {
      material.uniforms.time.value = props.time;
    },
    update(path, props) {
      geometry.update(path, props);
      material.uniforms.totalDistance.value = getPolylineDistance(path);
    },
  };
};
