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

  renderer.setClearColor("black", 1);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 500);
  camera.position.set(3, 3, -5);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller cleanly via module instance hook
  const controls = new OrbitControls(camera, context.canvas);

  const scene = new THREE.Scene();

  const geometry = new THREE.TorusGeometry(1, 0.5, 32, 64);

  const loader = new THREE.TextureLoader();
  const map = loader.load("src/demos/brick-diffuse.jpg");
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(2, 1).multiplyScalar(2);

  const normalMap = loader.load("src/demos/brick-normal.jpg");
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.copy(map.repeat);

  // Setup a material
  const normalStrength = 0.5;
  const material = new THREE.MeshStandardMaterial({
    roughness: 0.85,
    metalness: 0.5,
    normalScale: new THREE.Vector2(1, 1).multiplyScalar(normalStrength),
    normalMap,
    map,
  });

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const lightGroup = new THREE.Group();
  const light = new THREE.PointLight("white", 2);
  light.position.set(2, 2, 0);
  lightGroup.add(light);
  scene.add(lightGroup);

  scene.add(new THREE.PointLightHelper(light, 0.15));

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
      mesh.rotation.y = time * 0.15;
      lightGroup.rotation.y = time * 0.5;
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
