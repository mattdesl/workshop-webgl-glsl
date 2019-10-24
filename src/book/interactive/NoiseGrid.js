/** @jsx h */
const { h } = require('preact');
const defined = require('defined');
const Random = require('canvas-sketch-util/random');
const { linspace, lerp } = require('canvas-sketch-util/math');
const InteractiveComponent = require('./InteractiveComponent');
const createCartesianGrid = require('./createCartesianGrid');
const createWireframe = require('three-tube-wireframe');
const UI = require('../util/UI');

const settings = {
  context: 'webgl',
  attributes: { antialias: true }
};

const RANDOM_KEY = 'DrawCode--Waves--NoiseGrid'
window[Symbol.for(RANDOM_KEY)] = Random.createRandom();

const evaluate = (code, params) => {
  /* eslint no-eval: 0 */
  const body = params.sphere
    ? [ `return (position) => {`,
      `${code};`,
    '};' ].join('\n')
    : [ `return (x, z) => {`,
        `let y = 0;`,
        `${code};`,
        `return y;`,
      '};' ].join('\n');
  const str = [
    `;(function ({ frequency, amplitude, time }, { noise1D, noise2D, noise3D, noise4D }) {`,
    body,
    `})(${JSON.stringify(params)}, window[Symbol.for(RANDOM_KEY)])`
  ].join('\n');
  return eval(str);
};

const sketch = (props) => {
  const { data = {} } = props;
  const { subdivisions, sphere } = data.params;

  const grid = createCartesianGrid({
    ...props,
    // gridSubdivisions: 13,
    showSubdivisions: false
    // visibleSubdivisions: [ 'z', 'w' ]
  });

  const mainMesh = new THREE.Mesh(
    new THREE.Geometry(),
    new THREE.MeshBasicMaterial({
      color: 'black',
      wireframe: true
    })
  );
  grid.vertexGroup.add(mainMesh);

  const updateGeo = (subdivisions) => {
    if (mainMesh.geometry.subdivisions !== subdivisions) {
      mainMesh.geometry.dispose();

      let newGeo;
      if (sphere) {
        newGeo = new THREE.SphereGeometry(1, subdivisions, subdivisions * 2);
      } else {
        newGeo = new THREE.PlaneGeometry(2, 2, subdivisions, subdivisions);
        newGeo.rotateX(Math.PI / 2);
      }
      
      newGeo.subdivisions = subdivisions;
      newGeo.originalPositions = newGeo.vertices.map(v => v.clone());
      mainMesh.geometry = newGeo;
    }
  };

  updateGeo(subdivisions);

  const randomize = () => window[Symbol.for(RANDOM_KEY)].permuteNoise();
  const canvas = props.canvas;
  const clicked = (ev) => {
    ev.preventDefault();
    randomize();
    props.render();
  };

  canvas.style.cursor = 'pointer';
  canvas.addEventListener('click', clicked);

  return {
    reset () {
      randomize();
    },
    resize (props) {
      grid.resize(props);
    },
    render (props) {
      const { data = {} } = props;
      const { evaluateResult, params } = data;
      const { subdivisions, rotation } = params;
      let y = 0;

      updateGeo(subdivisions);

      if (evaluateResult && typeof evaluateResult === 'function') {
        mainMesh.geometry.vertices.forEach((vertex, i) => {
          if (sphere) {
            vertex.copy(mainMesh.geometry.originalPositions[i]);
            evaluateResult(vertex);
          } else {
            let y = evaluateResult(vertex.x, vertex.z);
            if (typeof y === 'number' && isFinite(y)) {
              vertex.y = y;
            } else {
              throw new Error('Return value is not a finite number');
            }
          }
        });
        mainMesh.geometry.verticesNeedUpdate = true;
      }

      // vertex.position.set(X, y, Z);
      // arrow.position.copy(vertex.position);
      // arrow.position.y = 0;
      // arrow.line.material.depthTest = false;
      // arrow.cone.material.depthTest = false;
      // arrow.setDirection(
      //   new THREE.Vector3(0, y >= 0 ? 1 : -1, 0)
      // );
      // arrow.setLength(Math.abs(y) - grid.cellSize / 2, grid.cellSize * 1.25, grid.cellSize);
      
      grid.scene.rotation.y = rotation * Math.PI;
      grid.render({
        ...props,
        zoom: 1.5
      });
    },
    unload (props) {
      canvas.removeEventListener('click', clicked);
      grid.unload(props);
    }
  }
}

module.exports = (props) => {
  const {
    sphere = false,
    time = false
  } = props;

  const control = {
    min: -1,
    max: 1,
    step: 0.01
  };

  const params = {
    sphere,
    @UI.Slider({ visible: true, min: -1, max: 1, step: 0.01 })
    rotation: 0,
    @UI.Slider({ visible: false, min: 2, max: 25, step: 1 })
    subdivisions: 25,
    @UI.Slider({ variable: true, min: 0.0001, max: 4, step: 0.01 })
    frequency: 0.9,
    @UI.Slider({ variable: true, min: -5, max: 5, step: 0.01 })
    amplitude: 0.25,
    @UI.Slider({ variable: true, visible: time, min: -5, max: 5, step: 0.01 })
    time: 0.0,
  };

  return <InteractiveComponent
    sketch={sketch}
    settings={settings}
    params={params}
    code={props.code}
    evaluate={evaluate}
    showParams
    showCanvas
    showCode
    thirdPartyKeywords={['noise1D','noise2D','noise3D','noise4D']}
    size={params.sphere ? 'medium' : 'small'}
  />;
};
