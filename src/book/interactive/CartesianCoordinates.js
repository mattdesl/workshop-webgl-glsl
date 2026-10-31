/** @jsx h */
import { h } from "preact";
import * as THREE from "three";
import defined from "defined";
import InteractiveComponent from "./InteractiveComponent";
import createCartesianGrid from "./createCartesianGrid";
import UI from "../util/UI";

const settings = {
  context: "webgl2",
  attributes: { antialias: true },
};

const sketch = (props) => {
  const { data = {} } = props;
  const { dimensions, showSubdivisions } = data.params;

  const grid = createCartesianGrid({
    ...props,
    showSubdivisions,
    dimensions,
  });

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const vertex = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: "black",
      transparent: true,
    }),
  );
  vertex.scale.setScalar(grid.cellSize / 2);
  grid.vertexGroup.add(vertex);

  return {
    resize(props) {
      grid.resize(props);
    },
    render(props) {
      const { data = {} } = props;
      const { x, y, z, perspective } = data.params;
      vertex.position.set(x, y, z);

      grid.render({
        ...props,
        perspective,
      });
    },
    unload(props) {
      grid.unload(props);
    },
  };
};

// 1. Structure the parameter configurations using a dedicated outside class blueprint
class ParamsConfig {
  constructor(props) {
    const { showSubdivisions = true, dimensions = 2 } = props;

    // Assign structural fields and instance evaluation references
    this.showSubdivisions = showSubdivisions;
    this.dimensions = dimensions;
    this.perspective = defined(props.perspective, dimensions > 2 ? 1 : 0);
    this.x = -0.25;
    this.y = -0.5;
    this.z = 0.75;
  }

  @UI.Slider({
    visible: function () {
      return this.dimensions > 2;
    },
    min: 0,
    max: 1,
    step: 0.001,
    decimals: 2,
  })
  perspective;

  @UI.Slider({ min: -1, max: 1, step: 0.01 })
  x;

  @UI.Slider({ min: -1, max: 1, step: 0.01 })
  y;

  @UI.Slider({
    visible: function () {
      return this.dimensions > 2;
    },
    min: -1,
    max: 1,
    step: 0.01,
  })
  z;
}

// 2. Export the component and instantiate the class layout cleanly
export default (props) => {
  const params = new ParamsConfig(props);

  return (
    <InteractiveComponent
      sketch={sketch}
      settings={settings}
      params={params}
      showParams
      showCanvas
      size="small"
    />
  );
};
