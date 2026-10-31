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
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller via native ESM
  const controls = new OrbitControls(camera, context.canvas);

  const scene = new THREE.Scene();

  const geometry = new THREE.SphereGeometry(1, 64, 32);
  const baseGeometry = new THREE.IcosahedronGeometry(1, 1);

  const material = new THREE.MeshBasicMaterial({
    color: "tomato",
  });

  // Setup a mesh with geometry + material
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const circleGeometry = new THREE.CircleGeometry(1, 32);

  // Extract vector coordinates safely from modern BufferGeometry Float32 attributes instead of raw vertices
  const posAttr = baseGeometry.attributes.position;
  const tempVertex = new THREE.Vector3();

  for (let i = 0; i < posAttr.count; i++) {
    tempVertex.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));

    const vertexMaterial = new THREE.MeshBasicMaterial({
      color: "white",
      side: THREE.DoubleSide,
    });
    const vertexMesh = new THREE.Mesh(circleGeometry, vertexMaterial);
    vertexMesh.position.copy(tempVertex).multiplyScalar(1);
    vertexMesh.scale.setScalar(0.1);
    scene.add(vertexMesh);
    vertexMesh.lookAt(new THREE.Vector3());
  }

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
    },
  };
};

canvasSketch(sketch, settings);
