/** @jsx h */
import * as THREE from 'three';
import { h } from 'preact';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import Random from 'canvas-sketch-util/random';
import { linspace, lerp } from 'canvas-sketch-util/math';
import InteractiveComponent from './InteractiveComponent';
import createCartesianGrid from './createCartesianGrid';
import UI from '../util/UI';
import { executeSafeJavaScript, safeMath, safeThree } from './safeJavaScript';

const settings = {
  animate: true,
  context: 'webgl2',
  attributes: { antialias: true }
};

/**
 * Build a Three.js mesh by interpreting the editor's restricted JavaScript.
 *
 * @param {string} code User-provided JavaScript statements.
 * @param {Record<string, unknown>} _params Unused component parameters.
 * @returns {{ mesh: THREE.Mesh }} A configured mesh.
 */
const evaluate = (code, _params) => {
  const { mesh } = executeSafeJavaScript(code, { THREE: safeThree, Math: safeMath });
  if (!(mesh instanceof THREE.Mesh)) {
    throw new Error("You need to define a Three.js 'mesh'");
  }
  return { mesh };
};

const sketch = (props) => {
  const { params } = props.data || {};
  const { context } = props;

  const renderer = new THREE.WebGLRenderer({ context });
  renderer.setClearColor('#fff', 1);
  renderer.sortObjects = true;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  camera.position.set(2, 2, 2);
  camera.lookAt(new THREE.Vector3());

  const controls = new OrbitControls(camera, context.canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  const scene = new THREE.Scene();

  const light = new THREE.PointLight('white', 8, 20);
  light.position.set(2, 2, 2);
  // Match the softer falloff used by the original workshop's Three.js version.
  light.decay = 1;
  scene.add(light);
  
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
      const { evaluateResult } = props.data || {};

      clearGroup();
      
      if (evaluateResult && evaluateResult.mesh) {
        group.add(evaluateResult.mesh);
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
// ... (keep all your existing settings, evaluate, and sketch code above this point exactly the same)

// 1. Define the parameters class configuration outside the component
class ParamsConfig {
  @UI.Slider({ visible: false, min: 0, max: 1, step: 0.01 })
  perspective = 1;

  @UI.Slider({ visible: false, min: -1, max: 1, step: 0.01 })
  rotation = 0;
}

// 2. Instantiate and pass the parameters structure cleanly within the export
export default (props) => {
  const params = new ParamsConfig();

  return (
    <InteractiveComponent
      sketch={sketch}
      settings={settings}
      code={props.code}
      evaluate={evaluate}
      params={params}
      showCode
      showCanvas
    />
  );
};
