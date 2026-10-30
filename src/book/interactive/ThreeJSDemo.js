/** @jsx h */
import { h } from 'preact';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import Random from 'canvas-sketch-util/random';
import paperColorsRaw from 'paper-colors';
import risoColorsRaw from 'riso-colors';
import InteractiveComponent from './InteractiveComponent';
import createWireframe from '../util/createTubeWireframe';

const paperColors = paperColorsRaw.map(color => color.hex);
const risoColors = risoColorsRaw.map(color => color.hex);

const settings = {
  animate: true,
  context: 'webgl2',
  attributes: { antialias: true }
};

const sketch = (props) => {
  const { context } = props;

  const renderer = new THREE.WebGLRenderer({ context });
  renderer.setClearColor('#fff', 1);
  renderer.sortObjects = false;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  camera.position.set(2, 2, 2);
  camera.lookAt(new THREE.Vector3());

  const controls = new OrbitControls(camera, context.canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;
  const scene = new THREE.Scene();

  const geometry = new THREE.IcosahedronGeometry(1, 0);
  const wireGeo = createWireframe(geometry, {
    thickness: 0.01,
    radiusSegments: 6,
    openEnded: false,
    lengthSegments: 1
  });
  const sphere = new THREE.Mesh(
    wireGeo,
    new THREE.MeshBasicMaterial()
  );
  scene.add(sphere);
  const innerSphere = new THREE.Mesh(
    geometry,
    new THREE.MeshPhongMaterial({ flatShading: true })
  );
  scene.add(innerSphere);
  innerSphere.scale.setScalar(0.5);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x8c8294, 1.5));
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(2, 3, 4);
  scene.add(light);

  const colorize = () => {
    renderer.setClearColor(Random.pick(paperColors), 1);
    const [wire, core] = Random.shuffle(risoColors).slice(0, 2);
    sphere.material.color.set(wire);
    innerSphere.material.color.set(core);
  };

  let time = 0;
  colorize();

  return {
    reset() {
      colorize();
    },
    resize(props) {
      renderer.setSize(props.viewportWidth, props.viewportHeight);
      renderer.setPixelRatio(props.pixelRatio);
      camera.aspect = props.width / props.height;
      camera.updateProjectionMatrix();
    },
    render(props) {
      time += props.deltaTime;
      const anim = Math.sin(time) * 0.5 + 0.5;
      innerSphere.rotation.x = anim;
      controls.update();
      renderer.render(scene, camera);
    },
    unload(props) {
      controls.dispose();
      renderer.dispose();
    }
  };
};

export default (props) => {
  const params = {};
  return (
    <InteractiveComponent
      sketch={sketch}
      settings={settings}
      params={params}
      size="small"
    />
  );
};
