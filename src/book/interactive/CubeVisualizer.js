/** @jsx h */
import { h } from 'preact';
import * as THREE from 'three';
import defined from 'defined';
import Random from 'canvas-sketch-util/random';
import InteractiveComponent from './InteractiveComponent';
import createCartesianGrid from './createCartesianGrid';
import UI from '../util/UI';
import { safeMath, safeThree, executeSafeJavaScript } from './safeJavaScript';
// import * as chromotome from 'chromotome';
import { getAll } from 'chromotome';

const settings = {
  animate: false,
  context: 'webgl2',
  attributes: { antialias: true }
};

/**
 * Apply the editor's JavaScript to the transform object and current controls.
 *
 * @param {string} code User-provided JavaScript statements.
 * @param {Record<string, unknown>} params Current X, Y, Z and scale values.
 * @returns {THREE.Object3D} Object carrying the requested transform.
 */
const evaluate = (code, params) => {
  const mesh = new THREE.Object3D();
  mesh.scale.setScalar(params.defaultScale);
  executeSafeJavaScript(code, {
    THREE: safeThree,
    Math: safeMath,
    mesh,
    X: params.X,
    Y: params.Y,
    Z: params.Z,
  });
  return mesh;
};

const sketch = (props) => {
  const { context } = props;
  const { params } = props.data || {};

  const grid = createCartesianGrid({
    ...props,
    showSubdivisions: false
  });

  const box = new THREE.BoxGeometry(1, 1, 1);
  
  // Safely extract from either namespace bundle hook or normalized internal standard properties
  // const chromotomeLib = chromotome.default || chromotome;
  // const palettes = chromotomeLib.getAll()
  const palettes = getAll()
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
    reset() {
      recolor();
    },
    unload() {
      context.canvas.removeEventListener('click', recolor);
      grid.unload(props);
    },
    resize(props) {
      grid.resize(props);
    },
    render(props) {
      const { params, evaluateResult } = props.data || {};
      const { rotation, perspective = 1 } = params;

      if (evaluateResult) {
        mesh.matrixAutoUpdate = false;
        evaluateResult.updateMatrix();
        mesh.matrix.identity();
        mesh.applyMatrix4(evaluateResult.matrix);
        mesh.updateMatrixWorld(true);
        mesh.matrixAutoUpdate = true;
      }

      grid.group.rotation.y = rotation * Math.PI / 2;
      grid.render({
        ...props,
        perspective
      });
    }
  };
};

class ParamsConfig {
  constructor(props) {
    const { defaultScale = 0.25, extent = 1, defaultValue = 0 } = props;

    this.minExtent = defined(props.minExtent, -extent, -1);
    this.maxExtent = defined(props.maxExtent, extent, 1);
    
    this.rotation = 0;
    this.defaultScale = defaultScale;
    this.X = defaultValue;
    this.Y = defaultValue;
    this.Z = defaultValue;
  }

  @UI.Slider({ visible: false, min: -1, max: 1, step: 0.01 })
  rotation;

  @UI.Slider({ variable: true, min: function() { return this.minExtent; }, max: function() { return this.maxExtent; }, step: 0.01 })
  X;

  @UI.Slider({ variable: true, min: function() { return this.minExtent; }, max: function() { return this.maxExtent; }, step: 0.01 })
  Y;

  @UI.Slider({ variable: true, min: function() { return this.minExtent; }, max: function() { return this.maxExtent; }, step: 0.01 })
  Z;
}

export default (props) => {
  const params = new ParamsConfig(props);

  return (
    <InteractiveComponent
      sketch={sketch}
      settings={settings}
      code={props.code}
      evaluate={evaluate}
      params={params}
      showParams
      showCode
      showCanvas
      size="small"
    />
  );
};
