/** @jsx h */

import { h } from "preact";
import IndicesComponent from "../interactive/Indices";
import VerticesComponent from "../interactive/Vertices";
import NoiseGridComponent from "../interactive/NoiseGrid";
import CubeVisualizerComponent from "../interactive/CubeVisualizer";
import WavesComponent from "../interactive/Waves";
import SceneComponent from "../interactive/Scene";
import MeshComponent from "../interactive/Mesh";
import RawShader from "../interactive/RawShader";

export const ShaderFullscreen = props => (
  <RawShader
    {...props}
    geometryType={"fullscreen"}
    code={`precision highp float;

uniform vec2 resolution;
uniform float time;
out vec4 fragColor;

void main () {
  // Normalized pixel coordinates (from 0 to 1)
  vec2 uv = gl_FragCoord.xy / resolution;

  // Time varying pixel color
  vec3 col = 0.5 + 0.5 * cos(time + uv.xyx + vec3(0.0, 2.0, 4.0));

  // Output to screen
  fragColor = vec4(col,1.0);
}`}
  />
);

export const ShaderVaryings = props => (
  <RawShader
    {...props}
    geometryType={"box"}
    material
    code={`const vertexShader = ` + "`" + `
  out vec2 vUv;
  void main () {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
` + "`" + `;
const fragmentShader = ` + "`" + `
  in vec2 vUv;
  uniform vec3 color;
  out vec4 fragColor;
  void main () {
    float d = vUv.y;
    fragColor = vec4(color * d, 1.0);
  }
` + "`" + `;
const material = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  vertexShader,
  fragmentShader,
  uniforms: { color: { value: new THREE.Color('tomato') } }
});`}
  />
);

export const ShaderMaterial = props => (
  <RawShader
    {...props}
    geometryType={"torus"}
    material
    code={`const vertexShader = ` + "`" + `
  void main () {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
` + "`" + `;
const fragmentShader = ` + "`" + `
  uniform vec3 color;
  out vec4 fragColor;
  void main () {
    fragColor = vec4(color, 1.0);
  }
` + "`" + `;
const material = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  vertexShader,
  fragmentShader,
  uniforms: { color: { value: new THREE.Color('red') } }
});`}
  />
);

export const RawShaderMaterial = props => (
  <RawShader
    {...props}
    geometryType={"torus"}
    material
    code={`const vertexShader = ` + "`" + `
  precision highp float;
  in vec3 position;
  uniform mat4 projectionMatrix;
  uniform mat4 modelViewMatrix;
  void main () {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
` + "`" + `;
const fragmentShader = ` + "`" + `
  precision highp float;
  out vec4 fragColor;
  uniform vec3 color;
  void main () {
    fragColor = vec4(color, 1.0);
  }
` + "`" + `;
const material = new THREE.RawShaderMaterial({
  glslVersion: THREE.GLSL3,
  vertexShader,
  fragmentShader,
  uniforms: { color: { value: new THREE.Color('red') } }
});`}
  />
);

export const VertexShader = props => (
  <RawShader
    {...props}
    geometryType={"cylinder"}
    vertex
    code={`precision highp float;

// Geometry data from each vertex
in vec3 position;

// JS data from ThreeJS camera + transforms
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

// JS data from this particular demo
uniform float stretch;

void main () {
  vec3 transformed = position.xyz;

  // Here we scale X and Z of the geometry by some modifier
  transformed.xz *= sin(position.y + stretch);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}`}
  />
);

export const FragmentShader = props => (
  <RawShader
    {...props}
    geometryType={"plane"}
    vertex={false}
    code={`precision highp float;

out vec4 fragColor;
uniform vec3 color;
uniform float opacity;

void main () {
  fragColor = vec4(color, opacity);
}`}
  />
);

export const SineWave = props => (
  <WavesComponent
    {...props}
    code={`y = Math.sin(x * frequency + phase) * amplitude`}
  />
);
export const Noise1D = props => (
  <WavesComponent
    {...props}
    functionName="noise1D"
    code={`y = noise1D(x * frequency + phase) * amplitude`}
  />
);
export const Noise2D = props => (
  <NoiseGridComponent
    {...props}
    code={`y = noise2D(
  x * frequency,
  z * frequency
) * amplitude;`}
  />
);

export const Noise3D = props => (
  <NoiseGridComponent
    {...props}
    time
    code={`y = noise3D(
  x * frequency,
  z * frequency,
  time
) * amplitude;`}
  />
);

export const Noise3DSphere = props => (
  <NoiseGridComponent
    {...props}
    sphere
    code={`const n = noise3D(
  position.x * frequency,
  position.y * frequency,
  position.z * frequency
) * amplitude;
const normal = position.clone().normalize();
normal.multiplyScalar(n);
position.add(normal);`}
  />
);

export const Scene = props => {
  return (
    <SceneComponent
      {...props}
      code={`const scene = new THREE.Scene();

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshBasicMaterial({ color: 'red' })
);
cube.position.set(0, 0, 0);
scene.add(cube);

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1, 16, 16),
  new THREE.MeshBasicMaterial({ color: 'blue' })
);
sphere.position.set(-3, 0, 2);
scene.add(sphere);`}
    />
  );
};

export const Position = props => {
  return (
    <CubeVisualizerComponent
      {...props}
      code={`mesh.position.x = X;
mesh.position.y = Y;
mesh.position.z = Z;`}
    />
  );
};

export const Rotation = props => {
  return (
    <CubeVisualizerComponent
      {...props}
      extent={Math.PI}
      defaultScale={0.5}
      code={`mesh.rotation.x = X;
mesh.rotation.y = Y;
mesh.rotation.z = Z;`}
    />
  );
};

export const Scale = props => {
  return (
    <CubeVisualizerComponent
      {...props}
      minExtent={0.01}
      maxExtent={1}
      defaultScale={1}
      defaultValue={0.5}
      code={`mesh.scale.x = X;
mesh.scale.y = Y;
mesh.scale.z = Z;`}
    />
  );
};

export const Mesh = props => {
  return (
    <MeshComponent
      {...props}
      code={`// Create a geometric structure
const geometry = new THREE.SphereGeometry(0.5, 32, 16);

// And define a surface material
const material = new THREE.MeshPhongMaterial({
  color: 'red',
  flatShading: true
});

// Build a mesh from the geometry and material
const mesh = new THREE.Mesh(geometry, material);`}
    />
  );
};

export const Faces = props => {
  return (
    <IndicesComponent
      {...props}
      fill
      code={`const vertices = [
  { position: [ -0.5, -0.5, 0 ] },
  { position: [ -0.5, 0.5, 0 ] },
  { position: [ 0.5, 0.5, 0 ] }
];

const indices = [0, 1, 2];
// Try reversing the winding order:
// indices.reverse();`}
    />
  );
};

export const Geometry = props => {
  return (
    <IndicesComponent
      {...props}
      fill
      code={`const vertices = [
  { position: [ -0.5, -0.5, 0 ] },
  { position: [ -0.5, 0.5, 0 ] },
  { position: [ 0.5, 0.5, 0 ] },
  { position: [ 0.5, -0.5, 0 ] }
];

const indices = [0, 1, 2, 2, 3, 0];
// Try reversing the winding order:
// indices.reverse();`}
    />
  );
};

export const THREEVectorAndColor = props => {
  return (
    <VerticesComponent
      code={`const color = new THREE.Color('green');
// Set the color by hue, saturation, and lightness:
// color.setHSL(0.3, 0.8, 0.4);

const position = new THREE.Vector3(0.25, 0.25, 0);
// position.setScalar(0.25);
// position.fromArray([0.25, 0.25, 0]);

const vertices = [{ position, color }];`}
    />
  );
};

export const Vertices = props => {
  return (
    <VerticesComponent
      {...props}
      code={`const vertices = [
  { position: [0, 0, 0.5], color: 'blue' }
];`}
    />
  );
};

export const Indices = props => {
  return (
    <IndicesComponent
      {...props}
      code={`const vertices = [
  { position: [ -0.5, -0.5, 0 ] },
  { position: [ -0.5, 0.5, 0 ] },
  { position: [ 0.5, 0.5, 0 ] }
];`}
    />
  );
};
