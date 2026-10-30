import { h } from "preact";
import CartesianCoordinates from "./interactive/CartesianCoordinates";
import Coordinates2D from "./interactive/Coordinates2D";
import ThreeGeomMat from "./interactive/ThreeGeomMat";
import ThreeJSDemo from "./interactive/ThreeJSDemo";
import {
  Faces,
  FragmentShader,
  Geometry,
  Indices,
  Mesh,
  Noise1D,
  Noise2D,
  Noise3D,
  Noise3DSphere,
  Position,
  RawShaderMaterial,
  Rotation,
  Scale,
  Scene,
  ShaderFullscreen,
  ShaderMaterial,
  ShaderVaryings,
  SineWave,
  THREEVectorAndColor,
  VertexShader,
  Vertices,
} from "./pages/InteractiveComponents";

const pageDemos = {
  "coordinates-2d": Coordinates2D,
  "cartesian-coordinates-2d": () => h(CartesianCoordinates, { dimensions: 2 }),
  "cartesian-coordinates-3d": () =>
    h(CartesianCoordinates, { dimensions: 3, perspective: 0 }),
  faces: Faces,
  "fragment-shader": FragmentShader,
  geometry: Geometry,
  indices: Indices,
  "noise-1d": Noise1D,
  "noise-2d": Noise2D,
  "noise-3d": Noise3D,
  "noise-3d-sphere": Noise3DSphere,
  position: Position,
  rotation: Rotation,
  scale: Scale,
  "fullscreen-shader": ShaderFullscreen,
  "threejs-demo": ThreeJSDemo,
  "threejs-geometry": () => h(ThreeGeomMat, { material: false }),
  "threejs-material": () => h(ThreeGeomMat, { material: true }),
  mesh: Mesh,
  "raw-shader-material": RawShaderMaterial,
  scene: Scene,
  "shader-material": ShaderMaterial,
  "shader-varyings": ShaderVaryings,
  "threejs-vector-and-color": THREEVectorAndColor,
  "vertex-shader": VertexShader,
  vertices: Vertices,
  "sine-wave": SineWave,
};

export default pageDemos;
