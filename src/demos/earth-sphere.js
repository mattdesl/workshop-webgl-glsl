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
  camera.position.set(4, 4, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  const geometry = new THREE.SphereGeometry(1, 32, 16);

  // Setup a loader for textures
  const loader = new THREE.TextureLoader();
  const earthMap = loader.load("src/demos/earth.jpg");
  const moonMap = loader.load("src/demos/moon.jpg");

  // Setup a material
  const material = new THREE.MeshBasicMaterial({
    map: earthMap
  });

  // Setup a mesh with geometry + material
  const earth = new THREE.Mesh(geometry, material);
  scene.add(earth);

  const moonMaterial = new THREE.MeshBasicMaterial({
    map: moonMap
  });

  const moonAnchor = new THREE.Group();
  const moon = new THREE.Mesh(geometry, moonMaterial);
  moonAnchor.add(moon);
  moon.position.x = -2;
  moon.position.y = 0.5;
  moon.scale.setScalar(0.25);

  scene.add(moonAnchor);

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
    render({ time, deltaTime }) {
      earth.rotation.y = time * 0.15;
      moon.rotation.y = time * 0.1;
      moonAnchor.rotation.y = time * 0.2;

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
