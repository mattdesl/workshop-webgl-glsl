/** @jsx h */
const { h } = require('preact');
const Random = require('canvas-sketch-util/random');
const { linspace, lerp } = require('canvas-sketch-util/math');
const InteractiveComponent = require('./InteractiveComponent');
const createCartesianGrid = require('./createCartesianGrid');
const UI = require('../util/UI');

const settings = {
  animate: true,
  context: 'webgl',
  attributes: { antialias: true }
};

const evaluate = (code, params) => {
  /* eslint no-eval: 0 */
  return eval([
    `;(function () {`,
    code,
    ';',
    `return { scene };`,
    '})();'
  ].join('\n'));
}

const sketch = (props) => {
  const { params } = props.data || {};
  const {} = params;
  const { context } = props;

  const renderer = new THREE.WebGLRenderer({ context });
  renderer.setClearColor('#fff', 1);
  renderer.sortObjects = true;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  camera.position.set(15, 15, 15);
  camera.lookAt(new THREE.Vector3());

  const controls = new THREE.OrbitControls(camera, context.canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  const scene = new THREE.Scene();

  const grid = new THREE.GridHelper(10, 10);
  scene.add(grid);
  
  const group = new THREE.Group();
  scene.add(group);

  const clearGroup = () => {
    group.traverse(child => {
      if (child.geometry && !child.geometry.__disposed) {
        child.geometry.dispose();
        child.geometry.__disposed = true;
      }
    });
    for (let i = group.children.length - 1; i >= 0; i--) {
      group.remove(group.children[i]);
    }
  };

  return {
    resize (props) {
      renderer.setSize(props.viewportWidth, props.viewportHeight);
      renderer.setPixelRatio(props.pixelRatio);
      camera.aspect = props.width / props.height;
      camera.updateProjectionMatrix();
    },
    onCodeUpdate (props) {
      const { evaluateResult, params } = props.data || {};

      clearGroup();
      
      if (evaluateResult && evaluateResult.scene) {
        group.add(evaluateResult.scene);
      }
    },
    render (props) {
      const { params } = props.data || {};
      const { rotation = 0 } = params;

      scene.rotation.y = rotation * Math.PI;

      controls.update();
      renderer.render(scene, camera);
    },
    unload (props) {
      controls.dispose();
      renderer.dispose();
    }
  };
}

module.exports = (props) => {
  const params = {
    @UI.Slider({ visible: false, min: 0, max: 1, step: 0.01 })
    perspective: 1,
    @UI.Slider({ visible: false, min: -1, max: 1, step: 0.01 })
    rotation: 0,
  };
  return <InteractiveComponent
    sketch={sketch}
    settings={settings}
    code={props.code}
    evaluate={evaluate}
    params={params}
    showCode
    showCanvas
    size='medium'
  />;
};
