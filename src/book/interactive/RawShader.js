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
 * Resolve GLSL input or a Three.js material created in restricted JavaScript.
 *
 * @param {string} code User-entered GLSL or JavaScript material code.
 * @param {Record<string, unknown>} params Shader editor mode.
 * @returns {{ code: string } | { material: THREE.ShaderMaterial | THREE.RawShaderMaterial }}
 *   Parsed shader data.
 */
const evaluate = (code, params) => {
  if (!params.material) return { code };

  const { material } = executeSafeJavaScript(code, { THREE: safeThree, Math: safeMath });
  if (!(material instanceof THREE.ShaderMaterial) && !(material instanceof THREE.RawShaderMaterial)) {
    throw new Error("You need to define a Three.js ShaderMaterial or RawShaderMaterial");
  }
  return { material };
}

const sketch = (props) => {
  const { context, canvas } = props;
  const { params, evaluateResult } = props.data || {};
  const { geometryType, gridSize = 10, vertex, material: isMaterialMode } = params;
  
  const renderer = new THREE.WebGLRenderer({ context });
  renderer.setClearColor('#fff', 1);
  renderer.sortObjects = false;
  renderer.debug.checkShaderErrors = true;
  let shaderCompileError = null;
  renderer.debug.onShaderError = (gl, program, vertexShader, fragmentShader) => {
    const shaders = [vertexShader, fragmentShader];
    const failedShader = shaders.find(shader => shader && !gl.getShaderParameter(shader, gl.COMPILE_STATUS));
    const log = failedShader
      ? gl.getShaderInfoLog(failedShader)
      : gl.getProgramInfoLog(program);
    const source = failedShader ? gl.getShaderSource(failedShader) : '';
    shaderCompileError = new Error(getShaderError(log || 'Shader program failed to link', source));
  };

  let camera, controls;
  if (geometryType === 'fullscreen') {
    camera = new THREE.OrthographicCamera(-1, 1, -1, 1, -100, 100);
  } else {
    camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
    if (vertex || isMaterialMode) camera.position.set(0, 0, 4);
    else camera.position.set(2, 2, 2);
    camera.lookAt(new THREE.Vector3());

    controls = new OrbitControls(camera, canvas);
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
    glslVersion: THREE.GLSL3,
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
      out vec4 fragColor;
      void main () {
        fragColor = vec4(vec3(0.0), 1.0);
      }
    `,
    vertexShader: `
      precision highp float;
      in vec3 position;
      in vec2 uv;
      uniform mat4 projectionMatrix;
      uniform mat4 modelViewMatrix;
      out vec2 vUv;
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
      const { evaluateResult } = props.data || {};
      this.compileError = null;
      let newMaterial;
      if (!isMaterialMode && evaluateResult && evaluateResult.code) {
        newMaterial = material.clone();
        if (vertex) newMaterial.vertexShader = evaluateResult.code.trim();
        else newMaterial.fragmentShader = evaluateResult.code.trim();
      } else if (isMaterialMode && evaluateResult && evaluateResult.material) {
        newMaterial = evaluateResult.material;
      }
  
      if (newMaterial) {
        const oldMaterial = mesh.material;
        mesh.material = newMaterial;
        newMaterial.needsUpdate = true;
        shaderCompileError = null;
        this.render(props);
        if (shaderCompileError) {
          mesh.material = oldMaterial;
          this.compileError = shaderCompileError;
          if (newMaterial !== oldMaterial) newMaterial.dispose();
        } else {
          if (oldMaterial && oldMaterial !== newMaterial) {
            oldMaterial.dispose();
          }
        }
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
      const { params } = data;
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
class ParamsConfig {
  constructor(props) {
    const { vertex = false, material = false, geometryType = 'sphere' } = props;
    this.vertex = vertex;
    this.material = material;
    this.geometryType = geometryType;
    
    // Set initial instance values
    this.stretch = Math.PI;
    this.color = vertex ? 'black' : 'pink';
    this.opacity = 1;
  }

  @UI.Slider({ variable: true, visible: function() { return this.vertex && !this.material; }, label: 'stretch', min: 0, max: Math.PI, step: 0.01 })
  stretch;

  @UI.Color({ variable: true, visible: function() { return !this.vertex && !this.material; }, label: 'color' })
  color;

  @UI.Slider({ variable: true, visible: function() { return !this.vertex && !this.material; }, label: 'opacity', min: 0, max: 1, step: 0.01 })
  opacity;
}

export default (props = {}) => {
  const { material = false, geometryType = 'sphere' } = props;
  const params = new ParamsConfig(props);

  return (
    <InteractiveComponent
      sketch={sketch}
      settings={settings}
      code={props.code}
      evaluate={evaluate}
      evaluateOnParamsChange={false}
      params={params}
      showCode
      showParams={!material && geometryType !== 'fullscreen'}
      glsl={!material}
      showCanvas
      size='full'
    />
  );
};
