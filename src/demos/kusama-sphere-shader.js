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

  // Setup camera controller safely from standard JSM modules
  const controls = new OrbitControls(camera, context.canvas);

  const scene = new THREE.Scene();

  const geometry = new THREE.SphereGeometry(1, 64, 32);
  const baseGeometry = new THREE.IcosahedronGeometry(1, 1);

  // Extract vector points safely from modern BufferGeometry Float32 array attributes
  const points = [];
  const posAttr = baseGeometry.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    points.push(
      new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)),
    );
  }

  // Setup a material
  const material = new THREE.ShaderMaterial({
    defines: {
      POINT_COUNT: points.length,
    },
    uniforms: {
      color: { value: new THREE.Color("tomato") },
      pointColor: { value: new THREE.Color("white") },
      points: { value: points },
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
    `,
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
    },
  };
};

canvasSketch(sketch, settings);
