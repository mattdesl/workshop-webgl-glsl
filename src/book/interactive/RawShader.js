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
    params.material
      ? code
      : ('const code = `' + code + '`;'),
    ';',
    params.material
      ? `if (typeof material === 'undefined') throw new Error('Must specify a "material" variable');
        return { material };`
      : `return { code };`,
    '})();'
  ].join('\n'));
}

const sketch = (props) => {
  const { context, canvas } = props;
  const { params, evaluateResult } = props.data || {};
  const { geometryType, gridSize = 10, vertex, material: isMaterialMode } = params;
  
  const renderer = new THREE.WebGLRenderer({ context });
  renderer.setClearColor('#fff', 1);
  renderer.sortObjects = false;
  renderer.debug.checkShaderErrors = true;

  let camera, controls;
  if (geometryType === 'fullscreen') {
    camera = new THREE.OrthographicCamera(-1, 1, -1, 1, -100, 100);
  } else {
    camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    if (vertex || isMaterialMode) camera.position.set(0, 0, 4);
    else camera.position.set(2, 2, 2);
    camera.lookAt(new THREE.Vector3());

    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
  }

  const scene = new THREE.Scene();
  let geometry;
  if (geometryType === 'fullscreen') {
    geometry = new THREE.PlaneGeometry(2, 2);
  } else if (geometryType === 'cylinder') {
    geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16, 16);
  } else if (geometryType === 'plane') {
    geometry = new THREE.PlaneGeometry(1, 1, 1, 1);
  } else if (geometryType === 'torus') {
    geometry = new THREE.TorusGeometry(1, 0.5 / 2, 16, 16);
  } else if (geometryType === 'box') {
    geometry = new THREE.BoxGeometry(1, 1, 1);
  } else {
    geometry = new THREE.SphereGeometry(1, 16, 8);
  }
  const material = new THREE.RawShaderMaterial({
    uniforms: {
      resolution: { value: new THREE.Vector2() },
      stretch: { value: 1 },
      color: { value: new THREE.Color() },
      time: { value: 0 },
      opacity: { value: 1 }
    },
    side: THREE.DoubleSide,
    transparent: true,
    fragmentShader: `
      precision highp float;
      void main () {
        gl_FragColor = vec4(vec3(0.0), 1.0);
      }
    `,
    vertexShader: `
      precision highp float;
      attribute vec3 position;
      attribute vec2 uv;
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      varying vec2 vUv;
      void main () {
        vUv = uv;
        vec3 transformed = position.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
      }
    `,
    wireframe: Boolean(vertex)
  });

  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const getShaderError = (log, source) => {
    if (!source) return log;
    if (/^ERROR:\s+(\d+):(\d+):(.*)/.test(log)) {
      const errors = log.split(/(?=ERROR:)/);
      const errLog = errors[0];
      const match = /^ERROR:\s+(\d+):(\d+):(.*)/.exec(errLog.trim());
      if (match && match.length > 0) {
        let [ col, line, msg ] = match.slice(1);
        msg = msg.trim();
        col = parseInt(col, 10);
        line = parseInt(line, 10) - 1;
        if (isFinite(col) && isFinite(line)) {
          const lines = source.split('\n').map((line, index) => {
            return { line, index };
          });
          const lineSrc = [ lines[line] ].map(({ line, index }) => {
            return `${line}`;
          }).join('\n');
          return msg + ' on line ' + lineSrc;
        }
      }
    }
    return log;
  };

  let time = 0;

  const result = {
    onCodeUpdate (props) {
      const { evaluateResult, params } = props.data || {};
      this.compileError = null;
      let newMaterial;
      if (!isMaterialMode && evaluateResult && evaluateResult.code) {
        newMaterial = material.clone();
        if (vertex) newMaterial.vertexShader = evaluateResult.code.trim();
        else newMaterial.fragmentShader = evaluateResult.code.trim();
        mesh.material = newMaterial;
      } else if (isMaterialMode && evaluateResult && evaluateResult.material) {
        newMaterial = evaluateResult.material;
      }
  
      if (newMaterial) {
        const oldMaterial = mesh.material;
        mesh.material = newMaterial;
        newMaterial.needsUpdate = true;
        if (newMaterial.program) {
          newMaterial.program.diagnostics = undefined;
        }
  
        this.render(props);
        if (newMaterial.program.diagnostics && !newMaterial.program.diagnostics.runnable) {
          const { vertexShader, fragmentShader } = newMaterial.program.diagnostics;
          let log = `Error compiling shader - see DevTools for details`;
          let shader;
          if (vertexShader && vertexShader.log) {
            shader = renderer.getContext().getShaderSource(newMaterial.program.vertexShader);
            // shader = vertexShader.prefix + newMaterial.vertexShader;
            log = vertexShader.log;
          } else if (fragmentShader && fragmentShader.log) {
            // shader = fragmentShader.prefix + newMaterial.fragmentShader;
            shader = renderer.getContext().getShaderSource(newMaterial.program.fragmentShader);
            log = fragmentShader.log;
          }
  
          const errMessage = getShaderError(log, shader);
          mesh.material = oldMaterial;
          this.compileError = new Error(errMessage);
        } else {
          // program success, dispose old material
          if (oldMaterial && oldMaterial !== mesh.material) {
            oldMaterial.dispose();
          }
        }
      } else if (isMaterialMode) {
        // mesh.material.visible = false;
      }
    },
    resize (props) {
      renderer.setSize(props.viewportWidth, props.viewportHeight);
      renderer.setPixelRatio(props.pixelRatio);
      if (geometryType !== 'fullscreen') {
        camera.aspect = props.width / props.height;
        camera.updateProjectionMatrix();
      }
    },
    render (props) {
      const { data = {} } = props;
      const { evaluateResult, params } = data;
      const { stretch, opacity, color } = params;

      if (!isMaterialMode) {
        mesh.material.uniforms.stretch.value = stretch;
        mesh.material.uniforms.opacity.value = opacity;
        mesh.material.uniforms.color.value.set(color);
        mesh.material.uniforms.resolution.value.set(props.canvasWidth, props.canvasHeight);
        mesh.material.uniforms.time.value = time;
      }
      time += props.deltaTime;
      mesh.visible = Boolean(mesh.material);
      if (controls) controls.update();
      renderer.render(scene, camera);
    },
    unload (props) {
      if (controls) controls.dispose();
      renderer.dispose();
    }
  };
  result.onCodeUpdate(props);
  return result;
}

module.exports = (props = {}) => {
  const { vertex = false, material = false, geometryType = 'sphere' } = props;
  const params = {
    vertex,
    material,
    geometryType,
    @UI.Slider({ variable: true, visible: vertex && !material, label: 'stretch', min: 0, max: Math.PI, step: 0.01 })
    stretch: Math.PI,
    @UI.Color({ variable: true, visible: !vertex && !material, label: 'color' })
    color: vertex ? 'black' : 'pink',
    @UI.Slider({ variable: true, visible: !vertex && !material, label: 'opacity', min: 0, max: 1, step: 0.01 })
    opacity: 1
  };
  return <InteractiveComponent
    sketch={sketch}
    settings={settings}
    code={props.code}
    evaluate={evaluate}
    params={params}
    showCode
    showParams={!material && geometryType !== 'fullscreen'}
    glsl={!material}
    showCanvas
    size='full'
  />;
};
