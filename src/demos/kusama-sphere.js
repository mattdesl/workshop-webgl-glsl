// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const Poisson = require("poisson-disk-sampling");
const { linspace } = require("canvas-sketch-util/math");
const Random = require("canvas-sketch-util/random");
const vertexShader = require("./kusama-sphere.vert");
const fragmentShader = require("./kusama-sphere.frag");
const canvasSketch = require("canvas-sketch");
const pack = require("./pack-sphere");

const settings = {
  // Make the loop animated
  animate: true,
  // Get a WebGL canvas rather than 2D
  context: "webgl",
  // Turn on MSAA
  attributes: { antialias: true }
};

const sketch = ({ context }) => {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas
  });

  // WebGL background color
  renderer.setClearColor("#000", 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  const geometry = new THREE.IcosahedronGeometry(1, 3);
  // const geometry = new THREE.SphereGeometry(1, 64, 32);

  const meshes = pack({
    dimensions: 3,
    maxRadius: 0.5,
    minRadius: 0.05,
    bounds: 1,
    maxCount: 10
  }).map(p => {
    const mesh = createMesh();
    mesh.position.fromArray(p.position);
    mesh.scale.multiplyScalar(p.radius);
    mesh.quaternion.fromArray(Random.quaternion());
    scene.add(mesh);
    return mesh;
  });

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time }) {
      meshes.forEach(mesh => {
        mesh.material.uniforms.time.value = time;
      });
      controls.update();
      renderer.render(scene, camera);
    },
    // Dispose of events & renderer for cleaner hot-reloading
    unload() {
      controls.dispose();
      renderer.dispose();
    }
  };

  function createMesh() {
    const pointsOnSphere = (num = 100, r = 1) => {
      const points = [];
      if (num <= 0) return points;
      let a = 4 * Math.PI * (Math.pow(r, 2) / num);
      let d = Math.sqrt(a);
      let mTheta = Math.round(Math.PI / d);
      let dTheta = Math.PI / mTheta;
      let dPhi = a / dTheta;
      if (isNaN(mTheta) || dPhi === 0) return points;
      for (let m = 0; m < mTheta; m++) {
        let theta = (Math.PI * (m + 0.5)) / mTheta;
        let mPhi = Math.round((2 * Math.PI * Math.sin(theta)) / dPhi);
        // mPhi = Math.max(mPhi, 4);
        for (let n = 0; n < mPhi; n++) {
          let phi = (2 * Math.PI * n) / mPhi;
          let x = r * Math.sin(theta) * Math.cos(phi);
          let y = r * Math.sin(theta) * Math.sin(phi);
          let z = r * Math.cos(theta);
          points.push([x, y, z]);
        }
      }
      return points;
    };

    const detail = 1;
    const icosphere = new THREE.IcosahedronGeometry(1, detail);

    const randomPoints = icosphere.vertices.map((vertex, i) => {
      const { x, y, z } = vertex;
      return new THREE.Vector4(x, y, z, Random.range(0, 2));
    });

    // const randomPoints = pointsOnSphere(icosphere.vertices.length).map(
    //   point => {
    //     const [x, y, z] = point;
    //     return new THREE.Vector4(x, y, z, Random.range(0, 2));
    //   }
    // );

    // const randomPoints = linspace(Math.sqrt(5) * 50, false)
    //   .map((t, i) => {
    //     const phi = Math.acos(t * 2 - 1);
    //     const goldenRatio = (Math.sqrt(5) + 1) / 2;
    //     const theta = Math.PI * (Math.sqrt(5) + 1) * 1 * i;
    //     const x = Math.cos(theta) * Math.sin(phi);
    //     const y = Math.sin(theta) * Math.sin(phi);
    //     const z = Math.cos(phi);

    //     // const [x, y, z] = Random.onSphere();
    //     return new THREE.Vector4(x, y, z, Random.range(1, 1));
    //   })
    //   .slice(1);

    const pointScale = 0.1;

    // Setup a material
    const material = new THREE.ShaderMaterial({
      defines: {
        POINT_COUNT: String(randomPoints.length)
      },
      extensions: {
        derivatives: true
      },
      uniforms: {
        timeOffset: { value: Random.range(-1, 1) },
        noiseRotation: {
          value: new THREE.Matrix4().makeRotationFromQuaternion(
            new THREE.Quaternion().fromArray(Random.quaternion())
          )
        },
        time: { value: 0 },
        pointScale: { value: pointScale },
        randomPoints: { value: randomPoints }
      },
      vertexShader,
      fragmentShader
    });
    return new THREE.Mesh(geometry, material);
  }
};

canvasSketch(sketch, settings);
