/** @jsx h */
import * as THREE from 'three';
import { h } from 'preact';
import Random from 'canvas-sketch-util/random';
import { linspace, lerp } from 'canvas-sketch-util/math';
import InteractiveComponent from './InteractiveComponent';
import createCartesianGrid from './createCartesianGrid';
import UI from '../util/UI';
import { compileSafeJavaScript, safeMath, safeThree } from './safeJavaScript';

const settings = {
  context: 'webgl2',
  attributes: { antialias: true }
};

const RANDOM_KEY = 'DrawCode--Waves--NoiseGrid';
window[Symbol.for(RANDOM_KEY)] = Random.createRandom();

/**
 * Compile safe JavaScript for the plane or sphere visualizer.
 *
 * @param {string} code User-entered JavaScript statements.
 * @param {Record<string, unknown>} params Visualizer controls.
 * @returns {((x: number, z: number) => number) | ((position: THREE.Vector3) => void)}
 *   A height function or a sphere displacement function.
 */
const evaluate = (code, params) => {
  const execute = compileSafeJavaScript(code);
  const random = window[Symbol.for(RANDOM_KEY)];
  /** @type {Record<string, unknown>} */
  const noiseBindings = {};
  ["noise1D", "noise2D", "noise3D", "noise4D"].forEach((name) => {
    noiseBindings[name] = random[name].bind(random);
  });
  const values = {
    frequency: params.frequency,
    amplitude: params.amplitude,
    time: params.timeValue ?? 0,
    Math: safeMath,
    THREE: safeThree,
    ...noiseBindings,
  };

  if (params.sphere) {
    return (position) => {
      execute({ ...values, position });
    };
  }
  return (x, z) => {
    const { y } = execute({ ...values, x, z, y: 0 });
    if (typeof y !== 'number') throw new Error('The example must set y to a number');
    return y;
  };
};

const sketch = (props) => {
  const { data = {} } = props;
  const { subdivisions, sphere } = data.params;

  const grid = createCartesianGrid({
    ...props,
    showSubdivisions: false
  });

  // CRITICAL FIX: Instantiate an empty modern BufferGeometry instead of the deprecated Geometry class
  const mainMesh = new THREE.Mesh(
    new THREE.BufferGeometry(),
    new THREE.MeshBasicMaterial({
      color: 'black',
      wireframe: true
    })
  );
  grid.vertexGroup.add(mainMesh);

  let originalPositions = null;

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
      
      // CRITICAL FIX: Cache initial position attributes inside a custom array layout instead of raw vertices
      const posAttr = newGeo.attributes.position;
      originalPositions = new Float32Array(posAttr.count * 3);
      originalPositions.set(posAttr.array);

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

      updateGeo(subdivisions);

      if (evaluateResult && typeof evaluateResult === 'function' && originalPositions) {
        const posAttr = mainMesh.geometry.attributes.position;
        const positions = posAttr.array;
        const tempV = new THREE.Vector3();

        for (let i = 0; i < posAttr.count; i++) {
          const idx = i * 3;
          tempV.set(originalPositions[idx], originalPositions[idx + 1], originalPositions[idx + 2]);

          if (sphere) {
            evaluateResult(tempV);
            positions[idx] = tempV.x;
            positions[idx + 1] = tempV.y;
            positions[idx + 2] = tempV.z;
          } else {
            let yVal = evaluateResult(tempV.x, tempV.z);
            if (typeof yVal === 'number' && isFinite(yVal)) {
              positions[idx + 1] = yVal; // Mutates height index directly inside the Float32 array
            } else {
              throw new Error('Return value is not a finite number');
            }
          }
        }
        // CRITICAL FIX: Forces modern Three.js GPU buffers to synchronize with updated coordinates
        posAttr.needsUpdate = true;
      }
      
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
class ParamsConfig {
  constructor(props) {
    const { sphere = false, time = false } = props;
    this.sphere = sphere;
    this.time = time;

    // Set initial instance values
    this.rotation = 0;
    this.subdivisions = 25;
    this.frequency = 0.9;
    this.amplitude = 0.25;
    this.timeValue = -5.0; // Avoid naming collision with the boolean 'time' property
  }

  @UI.Slider({ visible: true, min: -1, max: 1, step: 0.01 })
  rotation;

  @UI.Slider({ visible: false, min: 2, max: 25, step: 1 })
  subdivisions;

  @UI.Slider({ variable: true, min: 0.0001, max: 4, step: 0.01 })
  frequency;

  @UI.Slider({ variable: true, min: -5, max: 5, step: 0.01 })
  amplitude;

  @UI.Slider({ variable: true, label: "Time", visible: function() { return this.time; }, min: -5, max: 5, step: 0.01 })
  timeValue; 
}

export default (props) => {
  const params = new ParamsConfig(props);

  return (
    <InteractiveComponent
      sketch={sketch}
      settings={settings}
      params={params}
      code={props.code}
      evaluate={evaluate}
      showParams
      showCanvas
      showCode
      thirdPartyKeywords={['noise1D', 'noise2D', 'noise3D', 'noise4D']}
      size={params.sphere ? 'medium' : 'small'}
    />
  );
};
