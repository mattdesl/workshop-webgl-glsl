// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const canvasSketch = require("canvas-sketch");

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
  const geometry = new THREE.SphereGeometry(1, 64, 32);
  const baseGeometry = new THREE.IcosahedronGeometry(1, 1);

  // List of points we will pass to the shader
  const points = baseGeometry.vertices;

  // Setup a material
  const material = new THREE.ShaderMaterial({
    defines: {
      POINT_COUNT: points.length
    },
    uniforms: {
      color: { value: new THREE.Color("tomato") },
      pointColor: { value: new THREE.Color("white") },
      points: { value: points }
    },
    vertexShader: /*glsl*/ `
    varying vec3 vPosition;
    void main () {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    fragmentShader: /*glsl*/ `
    varying vec3 vPosition;
    uniform vec3 color;
    uniform vec3 pointColor;
    uniform vec3 points[POINT_COUNT];
    void main () {
      float dist = 1000.0;
      for (int i = 0; i < POINT_COUNT; i++) {
        vec3 point = points[i];
        float curDist = distance(vPosition, point);
        dist = min(curDist, dist);
      }

      float inside = dist < 0.1 ? 1.0 : 0.0;
      
      vec3 fragColor = mix(color, pointColor, inside);
      
      gl_FragColor = vec4(fragColor, 1.0);
    }
    `
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
