/** @jsx h */
const { h } = require("preact");
const Random = require("canvas-sketch-util/random");
const { linspace, lerp } = require("canvas-sketch-util/math");
const InteractiveComponent = require("./InteractiveComponent");
const createCartesianGrid = require("./createCartesianGrid");
const UI = require("../util/UI");

const settings = {
  animate: false,
  context: "webgl",
  attributes: { antialias: true }
};

const evaluate = (code, params) => {
  /* eslint no-eval: 0 */
  return eval(
    [
      `;(function () {`,
      code,
      ";",
      `if (typeof vertices === 'undefined') {
      if (typeof position !== 'undefined' && typeof color !== 'undefined') {
        var vertices = [ { position, color } ];
      }
      }`,
      `if (typeof vertices === 'undefined') throw new Error("You need to define a 'vertices' array");`,
      `if (!Array.isArray(vertices)) throw new Error("'vertices' should be an array");`,
      `return { vertices };`,
      "})();"
    ].join("\n")
  );
};

const sketch = props => {
  const { params } = props.data || {};
  const { gridSize = 10 } = params;

  const grid = createCartesianGrid({
    ...props,
    gridSize
  });

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  let vertices = [];

  return {
    resize(props) {
      grid.resize(props);
    },
    render(props) {
      const { params, evaluateResult } = props.data || {};
      const { perspective, rotation } = params;

      vertices.forEach(v => {
        grid.vertexGroup.remove(v);
      });

      if (evaluateResult && evaluateResult.vertices) {
        vertices = evaluateResult.vertices
          .map(v => {
            if (!v) {
              console.error(
                `Format for vertices should be { position, color }`
              );
              return null;
            }
            const vertex = new THREE.Mesh(
              geometry,
              new THREE.MeshBasicMaterial({
                color: new THREE.Color(v.color || "black"),
                transparent: true,
                depthTest: false,
                depthWrite: false
              })
            );
            const vpos = v.position;
            if (Array.isArray(vpos)) {
              vertex.position.fromArray(vpos);
            } else if (vpos && "x" in vpos && "y" in vpos && "z" in vpos) {
              vertex.position.copy(vpos);
            }
            vertex.scale.setScalar(0.5 * grid.cellSize);
            grid.vertexGroup.add(vertex);
            return vertex;
          })
          .filter(Boolean);
      }

      grid.scene.rotation.y = rotation * Math.PI;
      grid.render({
        ...props,
        perspective
      });
    },
    unload(props) {
      grid.unload(props);
    }
  };
};

module.exports = props => {
  const params = {
    @UI.Slider({ visible: false, min: 0, max: 1, step: 0.01 })
    perspective: 1,
    @UI.Slider({ visible: true, min: -1, max: 1, step: 0.01 })
    rotation: 0
  };
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
