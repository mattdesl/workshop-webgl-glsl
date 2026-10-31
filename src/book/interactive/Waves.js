/** @jsx h */
import * as THREE from 'three';
import { h } from 'preact';
import defined from 'defined';
import Random from 'canvas-sketch-util/random';
import { linspace, lerp } from 'canvas-sketch-util/math';
import InteractiveComponent from './InteractiveComponent';
import createCartesianGrid from './createCartesianGrid';
import UI from '../util/UI';
import createLine3D from '../util/createLine3D';
import { compileSafeJavaScript, safeMath } from './safeJavaScript';

const settings = {
  context: 'webgl2',
  attributes: { antialias: true }
};

const RANDOM_KEY = 'DrawCode--Waves--Random';
window[Symbol.for(RANDOM_KEY)] = Random.createRandom();

/**
 * Compile safe JavaScript for the wave visualizer.
 *
 * @param {string} code User-entered JavaScript statements.
 * @param {Record<string, unknown>} params Wave controls and optional noise name.
 * @returns {(x: number) => number} Function evaluated for each wave coordinate.
 */
const evaluate = (code, params) => {
  const execute = compileSafeJavaScript(code);
  const functionName = params.functionName;
  /** @type {Record<string, unknown>} */
  const noiseBinding = {};
  if (functionName) {
    if (!["noise1D", "noise2D", "noise3D", "noise4D"].includes(functionName)) {
      throw new Error(`Unsupported noise function '${functionName}'`);
    }
    const random = window[Symbol.for(RANDOM_KEY)];
    noiseBinding[functionName] = random[functionName].bind(random);
  }

  return (x) => {
    const { y } = execute({
      x,
      y: 0,
      frequency: params.frequency,
      phase: params.phase,
      amplitude: params.amplitude,
      Math: safeMath,
      ...noiseBinding,
    });
    if (typeof y !== 'number') throw new Error('The example must set y to a number');
    return y;
  };
};

const sketch = (props) => {
  const { data = {} } = props;

  const grid = createCartesianGrid({
    ...props,
    dimensions: 2,
    gridSubdivisions: 13,
  });

  const line = createLine3D({
    transparent: true,
    thickness: 0.02,
    color: '#4B87FF'
  });
  grid.vertexGroup.add(line.object);
  
  const subdivisions = 300;
  const update = (fn) => {
    const path = linspace(subdivisions, true).map(t => {
      const x = t * 2 - 1;
      let y;
      if (typeof fn === 'function') {
        const newY = fn(x);
        if (typeof newY === 'number') {
          y = newY;
        } else {
          throw new Error('Function must return a number');
        }
      } else {
        throw new Error('Does not return a function');
      }
      return {
        position: new THREE.Vector3(x, y, 0)
      };
    });
    line.update(path);
  };

  let lastEval;
  const canvas = props.canvas;
  const randomize = () => {
    window[Symbol.for(RANDOM_KEY)].permuteNoise();
  };
  const clicked = (ev) => {
    ev.preventDefault();
    randomize();
    props.render();
  };

  if (props.data.params.functionName) {
    canvas.style.cursor = 'pointer';
    canvas.addEventListener('click', clicked);
  }

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
      lastEval = evaluateResult;
      update(evaluateResult);
      grid.render({
        ...props,
        perspective: 0
      });
    },
    unload (props) {
      canvas.removeEventListener('click', clicked);
      grid.unload(props);
    }
  };
};

// Extracted parameter template supporting standard class decorators
class WavesParams {
  @UI.Slider({ variable: true, min: -15, max: 15, step: 0.01 })
  frequency = 1;

  @UI.Slider({ variable: true, min: -5, max: 5, step: 0.01 })
  amplitude = 1;

  @UI.Slider({ variable: true, min: -5, max: 5, step: 0.01 })
  phase = 0;

  constructor(props) {
    this.functionName = props.functionName;
    this.noiseGrid = Boolean(props.noiseGrid);
  }
}

export default (props) => {
  const params = new WavesParams(props);

  return (
    <InteractiveComponent
      sketch={sketch}
      settings={settings}
      params={params}
      code={props.code}
      evaluate={evaluate}
      showCode
      showParams
      showCanvas
      thirdPartyKeywords={['noise1D','noise2D','noise3D','noise4D']}
      size='medium'
    />
  );
};
