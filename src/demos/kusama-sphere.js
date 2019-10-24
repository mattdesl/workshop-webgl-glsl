// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const risoColors = require("riso-colors").map(h => h.hex);
const paperColors = require("paper-colors").map(h => h.hex);
const Poisson = require("poisson-disk-sampling");
const { linspace } = require("canvas-sketch-util/math");
const Random = require("canvas-sketch-util/random");
const vertexShader = require("./kusama-sphere.vert");
const fragmentShader = require("./kusama-sphere.frag");
const canvasSketch = require("canvas-sketch");
const pack = require("./pack-sphere");

const settings = {
  dimensions: [2048, 2048],
  // scaleToView: true,
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

  const palette = Random.shuffle(Random.shuffle(risoColors).slice(0, 2));
  renderer.setClearColor(palette[0], 1);
  // renderer.setClearColor(palette.shift(), 1);

  // Setup a camera
  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  // Setup camera controller
  const controls = new THREE.OrbitControls(camera, context.canvas);

  // Setup your scene
  const scene = new THREE.Scene();

  // Setup a geometry
  // const geometry = new THREE.IcosahedronGeometry(1, 3);
  const geometry = new THREE.SphereGeometry(1, 64, 32);

  // const base = new THREE.IcosahedronGeometry(1, 1);
  // const base = new THREE.TetrahedronGeometry(1, 1);
  const base = new THREE.DodecahedronGeometry(1, 0);

  // const icosphere = ;
  // const icosphere = new THREE.IcosahedronGeometry(1, detail);

  const meshes = pack({
    dimensions: 3,
    maxRadius: 0.5,
    minRadius: 0.05,
    padding: 0.005,
    bounds: 1,
    maxCount: 10
  }).map((p, i, list) => {
    const mesh = createMesh();
    mesh.position.fromArray(p.position);
    mesh.scale.multiplyScalar(p.radius);
    mesh.quaternion.fromArray(Random.quaternion());
    mesh.rotationSpeed = Random.gaussian() * 0.075;
    scene.add(mesh);
    return mesh;
  });

  // draw each frame
  return {
    // Handle resize events here
    resize({
      pixelRatio,
      viewportWidth,
      viewportHeight,
      styleWidth,
      styleHeight
    }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    // Update & render your scene here
    render({ time, deltaTime }) {
      meshes.forEach(mesh => {
        mesh.material.uniforms.time.value = time;
        mesh.rotateOnWorldAxis(
          new THREE.Vector3(0, 1, 0),
          deltaTime * mesh.rotationSpeed
        );
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
    const randomPoints = base.vertices.map((vertex, i) => {
      // const quat = new THREE.Quaternion().fromArray(Random.quaternion());
      const { x, y, z } = vertex;
      //.clone().applyQuaternion(quat);
      return new THREE.Vector4(x, y, z, Random.range(0.05, 2));
      // return new THREE.Vector4(x, y, z, 1);
      // return new THREE.Vector4(x, y, z, Math.min(2, Random.gaussian(0.5, 1)));
    });

    const pointScale = 0.2;

    const baseColor = Random.pick(palette);
    const color = new THREE.Color(baseColor);
    const altColor = new THREE.Color(
      Random.pick(palette.filter(p => p !== baseColor))
    );
    // const altColor = color
    //   .clone()
    //   .offsetHSL(
    //     (Random.range(-1, 1) * 1) / 360,
    //     (Random.range(-1, 1) * 10) / 100,
    //     (Random.range(-1, 1) * 10) / 100
    //   );
    // Setup a material
    const material = new THREE.ShaderMaterial({
      defines: {
        POINT_COUNT: String(randomPoints.length)
      },
      extensions: {
        derivatives: true
      },
      uniforms: {
        color: { value: color },
        altColor: { value: altColor },
        time: { value: 0 },
        pointScale: { value: pointScale },
        randomPoints: { value: randomPoints }
      },
      side: THREE.DoubleSide,
      vertexShader,
      fragmentShader
    });
    return new THREE.Mesh(geometry, material);
  }
};

canvasSketch(sketch, settings);
