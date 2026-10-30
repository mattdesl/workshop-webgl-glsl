import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import canvasSketch from "canvas-sketch";

const settings = {
  animate: true,
  context: "webgl2",
};

const sketch = ({ context }) => {
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  renderer.setClearColor("#000", 1);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(4, 4, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller via clean native ES Module imports
  const controls = new OrbitControls(camera, context.canvas);

  const scene = new THREE.Scene();

  const geometry = new THREE.SphereGeometry(1, 32, 16);

  const loader = new THREE.TextureLoader();
  const earthMap = loader.load("src/demos/earth.jpg");
  const moonMap = loader.load("src/demos/moon.jpg");

  // Setup a material
  const material = new THREE.MeshStandardMaterial({
    map: earthMap,
    metalness: 0,
    roughness: 1,
  });

  const group = new THREE.Group();

  // Setup a mesh with geometry + material
  const earth = new THREE.Mesh(geometry, material);
  group.add(earth);

  const moonMaterial = new THREE.MeshStandardMaterial({
    map: moonMap,
    metalness: 0,
    roughness: 1,
  });

  const moonAnchor = new THREE.Group();
  const moon = new THREE.Mesh(geometry, moonMaterial);
  moonAnchor.add(moon);
  moon.position.x = -2;
  moon.position.y = 0.5;
  mesh.scale.setScalar(0.25);

  group.add(moonAnchor);

  // Updated PointLight instantiation signature for standard compliance in modern Three.js
  const light = new THREE.PointLight("white", 1);
  light.position.set(2, 2, 2);
  scene.add(light);

  scene.add(new THREE.PointLightHelper(light, 0.15));

  scene.add(group);

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
      group.rotation.y = time * 0.2;

      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
