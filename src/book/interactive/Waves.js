/** @jsx h */
const { h } = require('preact');
const defined = require('defined');
const Random = require('canvas-sketch-util/random');
const { linspace, lerp } = require('canvas-sketch-util/math');
const InteractiveComponent = require('./InteractiveComponent');
const createCartesianGrid = require('./createCartesianGrid');
const UI = require('../util/UI');
const createLine3D = require('../util/createLine3D');

const settings = {
  context: 'webgl',
  attributes: { antialias: true }
};

const RANDOM_KEY = 'DrawCode--Waves--Random'
window[Symbol.for(RANDOM_KEY)] = Random.createRandom();

const evaluate = (code, params) => {
  /* eslint no-eval: 0 */
  const functionName = params.functionName;
  const fnParams = [
    '{ frequency, phase, amplitude }',
    functionName
  ].filter(Boolean);
  const fnParamValues = [ JSON.stringify(params) ];
  if (functionName) {
    fnParamValues.push(
      `window[Symbol.for(RANDOM_KEY)].${functionName}`
    );
  }
  
  const str = [
    `;(function (${fnParams.join(', ')}) {`,
    `return (x, z) => {`,
      `let y = 0;`,
      `${code};`,
      `return y;`,
    '};',
    `})(${fnParamValues.join(', ')})`
  ].join('\n');
  return eval(str);
};

const sketch = (props) => {
  const { data = {} } = props;
  const { } = data.params;

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
      const { seed = 0 } = params;
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
  }
}

module.exports = (props) => {
  const {
  } = props;

  const control = {
    min: -1,
    max: 1,
    step: 0.01
  };

  // const seed = 0;
  // const random = Random.createRandom(seed);
  const params = {
    functionName: props.functionName,
    noiseGrid: Boolean(props.noiseGrid),
    @UI.Slider({ variable: true, min: -15, max: 15, step: 0.01 })
    frequency: 1,
    @UI.Slider({ variable: true, min: -5, max: 5, step: 0.01 })
    amplitude: 1,
    @UI.Slider({ variable: true, min: -5, max: 5, step: 0.01 })
    phase: 0,
  };

  return <InteractiveComponent
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
  />;
};
