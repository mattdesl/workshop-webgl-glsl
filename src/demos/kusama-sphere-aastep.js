// Ensure ThreeJS is in global scope for the 'examples/'
global.THREE = require("three");

// Include any additional ThreeJS examples below
require("three/examples/js/controls/OrbitControls");

const Random = require("canvas-sketch-util/random");
const canvasSketch = require("canvas-sketch");
const packSpheres = require("pack-spheres");
const risoColors = require("riso-colors").map(h => h.hex);
const glslify = require("glslify");

const settings = {
  scaleToView: true,
  dimensions: [2048, 2048],
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

  const palette = Random.shuffle(risoColors).slice(0, 2);
  const backgroundHex = palette[0];
  const background = new THREE.Color(backgroundHex);

  // WebGL background color
  renderer.setClearColor(background, 1);

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

  const spheres = packSpheres({
    maxCount: 10,
    maxRadius: 0.75,
    minRadius: 0.05
  });

  const meshes = spheres.map(sphere => {
    const [color0, color1] = Random.shuffle(palette);

    // Setup a material
    const material = new THREE.ShaderMaterial({
      defines: {
        POINT_COUNT: points.length
      },
      extensions: {
        derivatives: true
      },
      uniforms: {
        background: { value: new THREE.Color(background) },
        color: { value: new THREE.Color(color0) },
        pointColor: { value: new THREE.Color(color1) },
        points: { value: points }
      },
      vertexShader: /*glsl*/ `
      varying vec3 vPosition;
      void main () {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
      `,
      fragmentShader: glslify(/* glsl */ `
      varying vec3 vPosition;
      uniform vec3 color;
      uniform vec3 pointColor;
      uniform vec3 background;
      uniform vec3 points[POINT_COUNT];

      #pragma glslify: aastep = require('glsl-aastep');

      // For the sphere rim
      uniform mat4 modelMatrix;

      float sphereRim (vec3 spherePosition) {
        vec3 normal = normalize(spherePosition.xyz);
        vec3 worldNormal = normalize(mat3(modelMatrix) * normal.xyz);
        vec3 worldPosition = (modelMatrix * vec4(spherePosition, 1.0)).xyz;
        vec3 V = normalize(cameraPosition - worldPosition);
        float rim = 1.0 - max(dot(V, worldNormal), 0.0);
        return pow(smoothstep(0.0, 1.0, rim), 0.5);
      }

      void main () {
        float dist = 1000.0;
        for (int i = 0; i < POINT_COUNT; i++) {
          vec3 point = points[i];
          float curDist = distance(vPosition, point);
          dist = min(curDist, dist);
        }

        float inside = 1.0 - aastep(0.1, dist);
        
        vec3 fragColor = mix(color, pointColor, inside);

        float rim = sphereRim(vPosition);

        fragColor += rim * color * 0.25;

        float stroke = aastep(0.9, rim);
        fragColor = mix(fragColor, background, stroke);

        gl_FragColor = vec4(fragColor, 1.0);
      }
      `)
    });

    // Setup a mesh with geometry + material
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.fromArray(sphere.position);
    mesh.scale.setScalar(sphere.radius);
    mesh.quaternion.fromArray(Random.quaternion());
    scene.add(mesh);
    return mesh;
  });

  // draw each frame
  return {
    // Handle resize events here
    resize({ pixelRatio, canvasWidth, canvasHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(canvasWidth, canvasHeight, false);
      camera.aspect = canvasWidth / canvasHeight;
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
