const THREE = require('three');
const Tube = require('./lib/Tube');

const tmpAxis = new THREE.Vector3();
const modes = [
  'triangle',
  'quad',
  'cross-hatch',
  'diagonal0',
  'diagonal1',
  'horizontal',
  'vertical',
  'diagonal0-horizontal',
  'diagonal1-horizontal',
  'diagonal0-vertical',
  'diagonal1-vertical'
];

module.exports = createTubeWireframeGeometry;
module.exports.modes = modes;

function createTubeWireframeGeometry (geometry, opt = {}) {
  const {
    mode = 'triangle',
    filter = () => true,
    buffer = false
  } = opt;

  const cells = gatherCells(geometry, mode, filter);

  const allEdges = cells.map(cell => {
    return cell.map((current, i) => {
      const next = cell[(i + 1) % cell.length];
      return [ current, next ];
    });
  }).reduce((a, b) => a.concat(b), []);

  const edges = dedupeEdges(allEdges);

  let offset = 0;
  const mesh = {
    index: [],
    position: [],
    basePosition: [],
    normal: [],
    uv: []
  };

  edges.forEach(([ a, b ]) => {
    const start = geometry.vertices[a];
    const end = geometry.vertices[b];
    const tube = createDynamicTube(start, end, opt);
    const position = tube.getAttribute('position');
    const normal = tube.getAttribute('normal');
    const uv = tube.getAttribute('uv');
    const basePosition = tube.getAttribute('basePosition');
    const indices = tube.getIndex();
    const vertexCount = position.count;

    for (let i = 0; i < vertexCount; i++) {
      pushVertex(mesh.position, position, i);
      pushVertex(mesh.normal, normal, i);
      pushVertex(mesh.uv, uv, i);
      pushVertex(mesh.basePosition, basePosition, i);
    }
    for (let i = 0; i < indices.array.length; i++) {
      const k = indices.array[i] + offset;
      mesh.index.push(k);
    }
    offset += vertexCount;

    tube.dispose();
  });

  const outGeometry = new THREE.BufferGeometry();
  outGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(mesh.position), 3));
  outGeometry.addAttribute('normal', new THREE.BufferAttribute(new Float32Array(mesh.normal), 3));
  outGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(mesh.uv), 2));
  outGeometry.addAttribute('basePosition', new THREE.BufferAttribute(new Float32Array(mesh.basePosition), 3));
  const UintArray = mesh.index.length > 65535 ? Uint32Array : Uint16Array;
  outGeometry.setIndex(new THREE.BufferAttribute(new UintArray(mesh.index), 1));
  if (buffer) return outGeometry;
  else return new THREE.Geometry().fromBufferGeometry(outGeometry);
}

function pushVertex (array, attribute, index) {
  for (let i = 0; i < attribute.itemSize; i++) {
    const v = attribute.array[index * attribute.itemSize + i];
    array.push(v);
  }
}

function gatherCells (geometry, mode, filter) {
  if (mode === 'triangle') {
    return geometry.faces.filter((face, i) => {
      return filter(i, mode);
    }).map(face => {
      return [ face.a, face.b, face.c ];
    });
  }

  const cells = [];
  for (let i = 0; i < geometry.faces.length; i += 2) {
    const f0 = geometry.faces[i];
    const f1 = geometry.faces[i + 1];
    if (!filter(i, mode)) {
      continue;
    }
    if (mode === 'cross-hatch') {
      cells.push([ f0.a, f1.b ]);
      cells.push([ f0.b, f1.c ]);
    } else if (mode === 'diagonal0') {
      cells.push([ f0.a, f1.b ]);
    } else if (mode === 'diagonal1') {
      cells.push([ f0.b, f1.c ]);
    } else if (mode === 'diagonal0-vertical') {
      cells.push([ f0.a, f1.b ]);
      cells.push([ f1.b, f1.c ]);
      cells.push([ f0.a, f0.b ]);
    } else if (mode === 'diagonal1-vertical') {
      cells.push([ f0.b, f1.c ]);
      cells.push([ f1.b, f1.c ]);
      cells.push([ f0.a, f0.b ]);
    } else if (mode === 'diagonal0-horizontal') {
      cells.push([ f0.a, f1.b ]);
      cells.push([ f1.a, f1.b ]);
      cells.push([ f0.a, f0.c ]);
    } else if (mode === 'diagonal1-horizontal') {
      cells.push([ f0.b, f1.c ]);
      cells.push([ f1.a, f1.b ]);
      cells.push([ f0.a, f0.c ]);
    } else if (mode === 'quad') {
      cells.push([ f1.a, f1.b ]);
      cells.push([ f0.a, f0.c ]);
      cells.push([ f1.b, f1.c ]);
      cells.push([ f0.a, f0.b ]);
    } else if (mode === 'horizontal') {
      cells.push([ f1.a, f1.b ]);
      cells.push([ f0.a, f0.c ]);
    } else if (mode === 'vertical') {
      cells.push([ f1.b, f1.c ]);
      cells.push([ f0.a, f0.b ]);
    }
  }
  return cells;
}

function dedupeEdges (edges) {
  const map = {};
  const out = [];

  edges.forEach(edge => {
    const sorted = edge.slice();
    sorted.sort((a, b) => a - b);
    const key = sorted.join(':');
    if (!(key in map)) {
      map[key] = true;
      out.push(edge);
    }
  });

  return out;
}

function createDynamicTube (start, end, opt = {}) {
  const {
    matrix,
    lengthSegments = 1,
    radiusSegments = 4,
    thickness = 1,
    openEnded = false
  } = opt;

  const direction = end.clone().sub(start);

  const dist = direction.length();
  const length = dist;
  const geometry = new Tube(start, end, thickness, thickness, length, radiusSegments, lengthSegments, openEnded);
  geometry.translate(0, length / 2, 0);

  const object = new THREE.Object3D();
  object.position.copy(start);
  quatFromDir(direction.clone().normalize(), object.quaternion);
  if (matrix) object.applyMatrix(matrix);
  object.updateMatrix();
  geometry.applyMatrix(object.matrix);
  return geometry;
}

function quatFromDir (dir, quaternion = new THREE.Quaternion()) {
  // dir is assumed to be normalized
  if (dir.y > 0.99999) {
    quaternion.set(0, 0, 0, 1);
  } else if (dir.y < -0.99999) {
    quaternion.set(1, 0, 0, 0);
  } else {
    tmpAxis.set(dir.z, 0, -dir.x).normalize();
    const radians = Math.acos(dir.y);
    quaternion.setFromAxisAngle(tmpAxis, radians);
  }
  return quaternion;
}



