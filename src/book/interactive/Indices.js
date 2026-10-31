/** @jsx h */
import { h } from "preact";
import * as THREE from "three";
import InteractiveComponent from "./InteractiveComponent";
import { executeSafeJavaScript } from "./safeJavaScript";
import createCartesianGrid from "./createCartesianGrid";
import UI from "../util/UI";
import createLine3D from "../util/createLine3D";
import quaternionFromDirection from "../util/quaternionFromDirection";
import {
  addBarycentricCoordinates,
  unindexBufferGeometry,
} from "../util/wireGeomUtil";
import THREEDOMText from "../util/THREEDOMText";
import deepEqual from "fast-deep-equal";

const settings = {
  animate: false,
  context: "webgl2",
  attributes: { antialias: true },
};

/**
 * @typedef {Object} IndicesResult
 * @property {unknown[]} vertices
 * @property {unknown} [indices]
 */

/**
 * Interprets the editor's JavaScript and validates its vertex data.
 *
 * @param {string} code User-provided JavaScript text.
 * @param {Record<string, unknown>} _params Unused component parameters.
 * @returns {IndicesResult} The validated vertex and optional index data.
 */
const evaluate = (code, _params) => {
  const data = executeSafeJavaScript(code);
  const { vertices, indices } = data;
  if (typeof vertices === "undefined") {
    throw new Error("You need to define a 'vertices' array");
  }
  if (!Array.isArray(vertices)) {
    throw new Error("'vertices' should be an array");
  }
  if (typeof indices === "undefined") return { vertices };
  return { indices, vertices };
};


const sketch = (props) => {
  const { params } = props.data || {};
  const { fill } = params;

  const grid = createCartesianGrid({
    ...props,
    showSubdivisions: false,
  });

  const vertGeometry = new THREE.SphereGeometry(1, 64, 64);
  const coneGeometry = new THREE.ConeGeometry(0.5, 1, 16, 8);
  const fillGeometry = new THREE.BufferGeometry();
  const fillMaterial = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: {
      wire: { value: false, type: "b" },
      wireThickness: { value: 3 },
      front: { value: new THREE.Color() },
      back: { value: new THREE.Color() },
    },
    vertexShader: `
      in vec3 barycentric;
      out vec3 vBarycentric;
      void main () {
        vBarycentric = barycentric;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 front;
      uniform vec3 back;
      uniform bool wire;
      uniform float wireThickness;
      in vec3 vBarycentric;
      out vec4 fragColor;

      float aastep (float threshold, float dist) {
        float afwidth = fwidth(dist) * 0.5;
        return smoothstep(threshold - afwidth, threshold + afwidth, dist);
      }

      float computeScreenSpaceWireframe (vec3 barycentric, float lineWidth) {
        vec3 dist = fwidth(barycentric);
        vec3 smoothed = smoothstep(dist * ((lineWidth * 0.5) - 0.5), dist * ((lineWidth * 0.5) + 0.5), barycentric);
        return 1.0 - min(min(smoothed.x, smoothed.y), smoothed.z);
      }
      
      void main () {
        float d = min(min(vBarycentric.x, vBarycentric.y), vBarycentric.z);

        float edge = 1.0 - aastep(0.01, d);
        //float edge = computeScreenSpaceWireframe(vBarycentric, wireThickness);

        fragColor = vec4(gl_FrontFacing ? front : back, 1.0);
        if (wire) fragColor.rgb = mix(fragColor.rgb, vec3(0.0), edge);
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
  if (fill) grid.vertexGroup.add(fillMesh);

  let vertices = [];
  let arrowCaps = [];
  let lines = [];
  let texts = [];
  let oldResult = {};
  let wasEvalError = undefined;

  return {
    resize(props) {
      grid.resize(props);
      lines.forEach((line) => line.resize(props));
    },
    evalDidChange(props) {
      const { canvas, width, height } = props;
      const { evaluateResult, params } = props.data || {};
      const { fill, wireframe, perspective, rotation, front, back } = params;

      clear();
      if (evaluateResult && evaluateResult.vertices) {
        for (let i = 0; i < evaluateResult.vertices.length; i++) {
          const v = evaluateResult.vertices[i];
          const vertex = new THREE.Mesh(
            vertGeometry,
            new THREE.MeshBasicMaterial({
              color: v.color || "black",
              transparent: true,
              depthTest: false,
              depthWrite: false,
            }),
          );
          if (Array.isArray(v.position)) {
            vertex.position.fromArray(v.position);
          }
          vertex.scale.setScalar(0.4 * grid.cellSize);
          vertices.push(vertex);

          const text = THREEDOMText(canvas, grid.camera);
          canvas.parentElement.appendChild(text.element);
          text.vertex = vertex;
          text.index = i;
          texts.push(text);
        }
      }

      if (evaluateResult && evaluateResult.indices) {
        let faces = [];
        for (let i = 0; i < evaluateResult.indices.length / 3; i++) {
          const face = [];
          for (let j = 0; j < 3; j++) {
            const index = i * 3 + j;
            if (index < evaluateResult.indices.length) {
              face.push(evaluateResult.indices[index]);
            }
          }
          faces.push(face);
        }

        if (fill) {
          if (
            evaluateResult &&
            evaluateResult.indices &&
            evaluateResult.vertices
          ) {
            const fillFaces = faces
              .filter((f) => f.length === 3)
              .reduce((a, b) => a.concat(b), []);
            const indices = new Uint16Array(fillFaces);
            const positions = evaluateResult.vertices.map(
              (p) => p.position || [0, 0, 0],
            );
            const positionArray = flatten(positions, Float32Array);
            const indexBuf = new THREE.BufferAttribute(indices, 1);
            const posBuf = new THREE.BufferAttribute(positionArray, 3);
            fillGeometry.setAttribute("position", posBuf);
            fillGeometry.setIndex(indexBuf);
            unindexBufferGeometry(fillGeometry);
            addBarycentricCoordinates(fillGeometry, false);
            fillMesh.visible = true;
          }
        }

        faces.forEach((face) => {
          if (fill && face.length >= 3) return;

          const length = face.length >= 3 ? face.length : face.length - 1;
          for (let i = 0; i < length; i++) {
            const nextIndex = (i + 1) % face.length;

            const a = face[i] || 0;
            const b = face[nextIndex] || 0;
            const isDash = i + 1 > face.length - 1;

            const line = createLine3D({
              dash: isDash,
              color: isDash ? "hsl(0, 0%, 75%)" : "#4B87FF",
              thickness: grid.gridLineWidth * 1,
            });
            line.update([vertices[a], vertices[b]]);
            lines.push(line);
          }

          for (let i = 0; i < face.length - 1; i++) {
            const a = face[i] || 0;
            const b = face[(i + 1) % face.length] || 0;
            const V0 = vertices[a].position;
            const V1 = vertices[b].position;
            const cone = new THREE.Mesh(
              coneGeometry,
              new THREE.MeshBasicMaterial({
                color: "#4B87FF",
                transparent: true,
                // depthTest: false,
                // depthWrite: false
              }),
            );
            cone.position.copy(V1);
            cone.scale.setScalar(1 * grid.cellSize);
            const dir = V1.clone().sub(V0).normalize();
            cone.position.addScaledVector(dir, -0.85 * grid.cellSize);
            quaternionFromDirection(dir, cone.quaternion);
            arrowCaps.push(cone);
          }
        });
      }

      lines.forEach((line) => grid.vertexGroup.add(line.object));
      vertices.forEach((v) => grid.vertexGroup.add(v));
      arrowCaps.forEach((cap) => grid.vertexGroup.add(cap));
    },
    onRuntimeError() {
      oldResult = {};
      wasEvalError = undefined;
    },
    render(props) {
      const { canvas, width, height } = props;
      const { evaluateResult, evaluateError, params } = props.data || {};
      const { fill, wireframe, perspective, rotation, front, back } = params;

      fillMaterial.uniforms.front.value.setStyle(front);
      fillMaterial.uniforms.back.value.setStyle(back);
      fillMaterial.uniforms.wire.value = Boolean(wireframe);

      const isEvalError = Boolean(evaluateError);
      const didChange =
        !deepEqual(oldResult, evaluateResult) || wasEvalError != isEvalError;
      if (didChange) {
        this.evalDidChange(props);
        wasEvalError = isEvalError;
        oldResult = evaluateResult;
      }

      grid.group.rotation.y = (rotation * Math.PI) / 2;
      grid.render({
        ...props,
        perspective,
      });

      texts.forEach((text) => {
        text.update({
          ...props,
          object: text.vertex,
          color: "white",
          // position: new THREE.Vector3(0.1, 0, 0.05),
          // offset: [ 10, 5 ],
          fontSize: 1,
          scale: 0.75,
          text: text.index,
        });
      });
    },
    unload(props) {
      clear();
      grid.unload(props);
    },
  };

  function clear() {
    fillMesh.visible = false;
    texts.forEach((t) => {
      t.dispose();
    });
    vertices.forEach((v) => {
      grid.vertexGroup.remove(v);
    });
    vertices.length = 0;
    arrowCaps.forEach((v) => {
      grid.vertexGroup.remove(v);
    });
    arrowCaps.length = 0;
    lines.forEach((line) => {
      line.dispose();
      grid.vertexGroup.remove(line.object);
    });
    lines.length = 0;
  }
};
// 1. Define the parameters layout cleanly outside the component scope
class ParamsConfig {
  constructor(fill) {
    this.fill = fill;

    // Assign fallback default values to fields
    this.perspective = 1;
    this.rotation = 0;
    this.front = "#4B87FF";
    this.back = "#FF5FD2";
    this.wireframe = true;
  }

  @UI.Slider({ visible: false, min: 0, max: 1, step: 0.01 })
  perspective;

  @UI.Slider({ min: -1, max: 1, step: 0.01 })
  rotation;

  @UI.Color({
    visible: function () {
      return this.fill;
    },
    label: "Front Face Color",
  })
  front;

  @UI.Color({
    visible: function () {
      return this.fill;
    },
    label: "Back Face Color",
  })
  back;

  @UI.Checkbox({
    visible: function () {
      return this.fill;
    },
  })
  wireframe;
}

// 2. Export the interactive component wrapper safely
export default (props) => {
  const fill = Boolean(props.fill);
  const params = new ParamsConfig(fill);

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
    />
  );
};

function flatten(array, ArrayType = Float32Array) {
  const output = [];
  for (let i = 0; i < array.length; i++) {
    if (Array.isArray(array[i])) {
      const vec = array[i];
      for (let j = 0; j < vec.length; j++) {
        output.push(vec[j]);
      }
    } else {
      output.push(array[i]);
    }
  }
  return new ArrayType(output);
}

function unindex({ cells, positions }) {
  const newPositions = [];
  cells.forEach((cell) => {
    const vertices = cell.map((i) => positions[i]);
    vertices.forEach((v) => newPositions.push(v));
  });
  return newPositions;
}
