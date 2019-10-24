/** @jsx h */
const { h } = require('preact');
const defined = require('defined');
const Random = require('canvas-sketch-util/random');
const Color = require('canvas-sketch-util/color');
const { linspace, lerp } = require('canvas-sketch-util/math');
const InteractiveComponent = require('./InteractiveComponent');
const createCartesianGrid = require('./createCartesianGrid');
const UI = require('../util/UI');
const createLine3D = require('../util/createLine3D');
const { addBarycentricCoordinates, unindexBufferGeometry } = require('../util/wireGeomUtil');
const chromotome = require('chromotome');

const settings = {
  animate: false,
  context: 'webgl',
  attributes: { antialias: true }
};

const evaluate = (code, params) => {
  /* eslint no-eval: 0 */
  const str = [
    `;(function (params) {`,
    `const { X, Y, Z } = params;`,
    `const mesh = new window.THREE.Object3D();
    mesh.scale.setScalar(params.defaultScale);
    `,
    code,
    ';',
    `return mesh;`,
    `})(${JSON.stringify({
      X: params.X,
      Y: params.Y,
      Z: params.Z,
      defaultScale: params.defaultScale
    })})`
  ].join('\n');
  return eval(str);
};

const sketch = (props) => {
  const { context } = props;
  const { params } = props.data || {};
  const { fill } = params;

  const grid = createCartesianGrid({
    ...props,
    showSubdivisions: false
  });

  const box = new THREE.BoxGeometry(1, 1, 1);
  const palettes = chromotome.getAll()
      .filter(c => c.colors.length >= 6)
      .map(c => c.colors);

  const mesh = new THREE.Mesh(
    box,
    new THREE.MeshBasicMaterial()
  );
  grid.vertexGroup.add(mesh);

  const recolor = () => {
    const colors = Random.pick(palettes);
    const materials = colors.map(color => new THREE.MeshBasicMaterial({
      transparent: true,
      color
    }));
    mesh.material = materials;
    props.render();
  };
  recolor();
  context.canvas.style.cursor = 'pointer';
  context.canvas.addEventListener('click', recolor);

  return {
    reset () {
      recolor();
    },
    unload () {
      context.canvas.removeEventListener('click', recolor);
    },
    resize (props) {
      grid.resize(props);
    },
    render (props) {
      const { params, evaluateResult } = props.data || {};
      const { rotation, perspective = 1 } = params;

      if (evaluateResult) {
        mesh.matrixAutoUpdate = false;
        evaluateResult.updateMatrix();
        mesh.matrix.identity();
        mesh.applyMatrix(evaluateResult.matrix);
        mesh.updateMatrixWorld(true);
        mesh.matrixAutoUpdate = true;
      }

      grid.group.rotation.y = rotation * Math.PI / 2;
      grid.render({
        ...props,
        perspective
      });
    },
    unload (props) {
      grid.unload(props);
    }
  };
}

module.exports = (props) => {
  const {
    defaultScale = 0.25,
    extent = 1,
    defaultValue = 0
  } = props;

  const minExtent = defined(props.minExtent, -extent, -1);
  const maxExtent = defined(props.maxExtent, extent, 1);

  const params = {
    @UI.Slider({ visible: false, min: -1, max: 1, step: 0.01 })
    rotation: 0,
    defaultScale,
    @UI.Slider({ variable: true, min: minExtent, max: maxExtent, step: 0.01 })
    X: defaultValue,
    @UI.Slider({ variable: true, min: minExtent, max: maxExtent, step: 0.01 })
    Y: defaultValue,
    @UI.Slider({ variable: true, min: minExtent, max: maxExtent, step: 0.01 })
    Z: defaultValue
  };
  return <InteractiveComponent
    sketch={sketch}
    settings={settings}
    code={props.code}
    evaluate={evaluate}
    params={params}
    showParams
    showCode
    showCanvas
    size='small'
  />;
};
