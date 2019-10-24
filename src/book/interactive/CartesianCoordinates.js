/** @jsx h */
const { h } = require('preact');
const defined = require('defined');
const Random = require('canvas-sketch-util/random');
const { linspace, lerp } = require('canvas-sketch-util/math');
const InteractiveComponent = require('./InteractiveComponent');
const createCartesianGrid = require('./createCartesianGrid');
const UI = require('../util/UI');

const settings = {
  context: 'webgl',
  attributes: { antialias: true }
};

const sketch = (props) => {
  const { data = {} } = props;
  const { dimensions, showSubdivisions } = data.params;

  const grid = createCartesianGrid({
    ...props,
    showSubdivisions,
    dimensions
  });

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const vertex = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
    color: 'black',
    transparent: true
    // depthTest: false,
    // depthWrite: false
  }));
  vertex.scale.setScalar(grid.cellSize / 2);
  grid.vertexGroup.add(vertex);

  return {
    resize (props) {
      grid.resize(props);
    },
    render (props) {
      const { data = {} } = props;
      const { x, y, z, perspective } = data.params;
      vertex.position.set(x, y, z);
      
      grid.render({
        ...props,
        perspective
      });
    },
    unload (props) {
      grid.unload(props);
    }
  }
}

module.exports = (props) => {
  const {
    showSubdivisions = true,
    dimensions = 2
  } = props;

  const control = {
    min: -1,
    max: 1,
    step: 0.01
  };

  const params = {
    showSubdivisions,
    @UI.Slider({ visible: dimensions > 2, min: 0, max: 1, step: 0.001 })
    perspective: defined(props.perspective, dimensions > 2 ? 1 : 0),
    @UI.Slider(control)
    x: -0.25,
    @UI.Slider(control)
    y: -0.5,
    @UI.Slider({ ...control, visible: dimensions > 2 })
    z: 0.75,
    dimensions
  };

  return <InteractiveComponent
    sketch={sketch}
    settings={settings}
    params={params}
    showParams
    showCanvas
    size='small'
  />;
};
