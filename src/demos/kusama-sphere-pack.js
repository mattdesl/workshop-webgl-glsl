import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import Random from "canvas-sketch-util/random";
import canvasSketch from "canvas-sketch";
import packSpheres from "pack-spheres";
import risoColorsData from "riso-colors";

const risoColors = risoColorsData.map((h) => h.hex);

const settings = {
  // Provide dimensions (e.g., standard high-res square) so the script can compile
  dimensions: [2048, 2048],
  context: "webgl2",
};

const sketch = ({ context }) => {
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas,
  });

  const palette = Random.shuffle(risoColors).slice(0, 3);
  const backgroundHex = palette.shift();
  const background = new THREE.Color(backgroundHex);

  renderer.setClearColor(background, 1);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(0, 0, -4);
  camera.lookAt(new THREE.Vector3());

  const controls = new OrbitControls(camera, context.canvas);
  const scene = new THREE.Scene();

  const geometry = new THREE.SphereGeometry(1, 64, 32);
  const baseGeometry = new THREE.IcosahedronGeometry(1, 1);

  const points = [];
  const posAttr = baseGeometry.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    points.push(
      new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i)),
    );
  }

  const spheres = packSpheres({
    maxCount: 10,
    maxRadius: 0.75,
    minRadius: 0.05,
  });

  spheres.map((sphere) => {
    const [color0] = Random.shuffle(palette);

    const material = new THREE.ShaderMaterial({
      defines: {
        POINT_COUNT: points.length,
      },
      uniforms: {
        color: { value: new THREE.Color(color0) },
        pointColor: { value: new THREE.Color("black") },
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

      uniform mat4 modelMatrix;

      float sphereRim (vec3 spherePosition) {
        vec3 normal = normalize(spherePosition.xyz);
        vec3 worldNormal = normalize(mat3(modelMatrix) * normal.xyz);
        vec3 worldPosition = (modelMatrix * vec4(spherePosition, 1.0)).xyz;
        
        // FIX 2: Explicitly calculate or normalize the view vector relative to cameraPosition
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

        float inside = dist < 0.1 ? 1.0 : 0.0;
        
        vec3 fragColor = mix(color, pointColor, inside);

        fragColor += sphereRim(vPosition) * color * 0.2;

        gl_FragColor = vec4(fragColor, 1.0);
      }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.fromArray(sphere.position);
    mesh.scale.setScalar(sphere.radius);
    mesh.quaternion.fromArray(Random.quaternion());
    scene.add(mesh);
    return mesh;
  });

  return {
    resize({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight, false);
      camera.aspect = viewportWidth / viewportHeight;
      camera.updateProjectionMatrix();
    },
    render({ time }) {
      controls.update();
      renderer.render(scene, camera);
    },
    unload() {
      controls.dispose();
      renderer.dispose();
    },
  };
};

canvasSketch(sketch, settings);
