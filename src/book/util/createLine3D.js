const buffer = require('three-buffer-vertex-data');
const { clamp } = require('canvas-sketch-util/math');
const defined = require('defined');
const fragmentShader = require('../shaders/line-screen-space.frag');
const vertexShader = require('../shaders/line-screen-space.vert');
const getDistance = require('euclidean-distance');

const getPolylineDistance = (path) => {
  return path.reduce((sum, item, i, list) => {
    const newDistance = i === 0 ? 0 : item.position.distanceTo(list[i - 1].position);
    return sum + newDistance;
  }, 0);
};

class LineGeometry extends THREE.BufferGeometry {
  constructor (path) {
    super();
    if (path) this.update(path);
    this.pathData = (path || []).slice();
  }

  push (data) {
    this.pathData.push(data);
    this.update(this.pathData);
  }

  clear () {
    this.update([]);
  }

  update (data = [], props = {}) {
    this.pathData = data.slice();
    let path = this.pathData.map(p => p.position.toArray());

    // each pair has a mirrored direction
    const direction = duplicate(path.map(x => 1), true);

    // now get the positional data for each vertex
    const positions = duplicate(path);
    const previous = duplicate(path.map(relative(-1)));
    const next = duplicate(path.map(relative(+1)));
    const indexUint16 = path.length >= 2 ? createIndices(path.length - 1) : new Uint16Array(0);

    // these are just for special effects
    const distances = [];
    // const alphas = [];
    let totalDistance = 0;
    path.forEach((p, i, list) => {
      const pathData = data[i];

      // This is like resolution.x = 0 ... 1 space
      var lineAlpha = list.length <= 1 ? 1 : (i / (list.length - 1));
      // This is the world-space distance from the first point
      totalDistance += i > 0 ? getDistance(p, list[i - 1]) : 0;
      var dist = [ lineAlpha, defined(pathData.distance, totalDistance) ];
      // Note: each vertex is duplicated!
      distances.push(dist, dist);

      // const color = pathData.color ? pathData.color.toArray() : DEFAULT_COLOR;
      // colors.push(color, color);
    });

    // now update the buffers with float/short data
    buffer.index(this, indexUint16);
    buffer.attr(this, 'position', positions, 3);
    buffer.attr(this, 'previousPosition', previous, 3);
    buffer.attr(this, 'nextPosition', next, 3);
    buffer.attr(this, 'direction', direction, 1);
    buffer.attr(this, 'distances', distances, 2);
  }
}

function relative (offset) {
  return (point, index, list) => {
    index = clamp(index + offset, 0, list.length - 1);
    return list[index];
  };
}

function duplicate (nestedArray, mirror) {
  var out = [];
  nestedArray.forEach(x => {
    let x1 = mirror ? -x : x;
    out.push(x1, x);
  });
  return out;
}

// counter-clockwise indices but prepared for duplicate vertices
function createIndices (length) {
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

module.exports = (opt = {}) => {
  const geometry = new LineGeometry();
  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthTest: false,
    depthWrite: false,
    extensions: {
      derivatives: true
    },
    transparent: true,
    // blending: THREE.AdditiveBlending,
    uniforms: {
      thickness: { value: defined(opt.thickness, 1) },
      aspect: { value: 1 },
      time: { value: 0 },
      totalDistance: { value: 1 },
      dashDistance: { value: defined(opt.dashDistance, 1) },
      dashRepeat: { value: defined(opt.dashRepeat, 10) },
      dash: { value: Boolean(opt.dash), type: 'b' },
      opacity: { value: defined(opt.opacity, 1) },
      color: { value: new THREE.Color(opt.color || 'white') }
    }
  });
  material.precision = 'highp';
  const object = new THREE.Mesh(geometry, material);
  object.frustumCulled = false;
  return {
    object,
    geometry,
    material,
    dispose () {
      geometry.dispose();
    },
    resize ({ width, height }) {
      material.uniforms.aspect.value = width / height;
    },
    tick (props) {
      material.uniforms.time.value = props.time;
    },
    update (path, props) {
      geometry.update(path, props);
      material.uniforms.totalDistance.value = getPolylineDistance(path);
    }
  };
};
