// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");
const glslify = require("glslify");

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl"
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  const geometry = new THREE.SphereGeometry(1, 32, 32);

  // Setup a material
  const material = new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      color: { value: new THREE.Color("pink") },
      pointColor: { value: new THREE.Color("tomato") }
    },
    vertexShader: /*glsl*/ `
    varying vec3 vPosition;
    varying vec2 vUv;
    void main () {
      vUv = uv;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: glslify(/*glsl*/ `
    uniform vec3 color;
    uniform vec3 pointColor;
    uniform float time;

    varying vec3 vPosition;
    varying vec2 vUv;
    
    #pragma glslify: noise = require('glsl-noise/simplex/3d');

    void main () {
      float gridSize = 10.0;
      vec2 noiseInput = vUv;
      noiseInput.x *= 2.0;

      vec2 pos = fract(noiseInput * gridSize);
      float inside = length(pos - 0.5);

      vec2 grid = floor(noiseInput * gridSize);
      float n = noise(vec3(grid, time * 0.5));
      inside = step(0.25 + (n * 0.25), inside);
      vec3 fragColor = mix(color, pointColor, inside);
      
      gl_FragColor = vec4(fragColor, 1.0);
    }
    `)
  });

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time }) {
      material.uniforms.time.value = time;
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };
};

canvasSketch(sketch, settings);
