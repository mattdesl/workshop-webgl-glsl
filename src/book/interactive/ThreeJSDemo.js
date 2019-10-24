/** @jsx h */
const { h } = require('preact');
const Random = require('canvas-sketch-util/random');
const { linspace, lerp } = require('canvas-sketch-util/math');
const InteractiveComponent = require('./InteractiveComponent');
const createCartesianGrid = require('./createCartesianGrid');
const createWireframe = require('three-tube-wireframe');
const paperColors = require('paper-colors').map(c => c.hex);
const risoColors = require('riso-colors').map(c => c.hex);
const UI = require('../util/UI');

const settings = {
  animate: true,
  context: 'webgl',
  attributes: { antialias: true }
};

const sketch = (props) => {
  const { context } = props;
  const { params } = props.data || {};
  const { } = params;

  const renderer = new THREE.WebGLRenderer({ context });
  renderer.setClearColor('#fff', 1);
  renderer.sortObjects = false;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  camera.position.set(2, 2, 2);
  camera.lookAt(new THREE.Vector3());

  const controls = new THREE.OrbitControls(camera, context.canvas);
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
  const sphere = new THREE.Mesh(wireGeo, new THREE.MeshToonMaterial({
    shininess: 5,
    flatShading: true
  }));
  scene.add(sphere);
  const innerSphere = new THREE.Mesh(geometry, new THREE.MeshToonMaterial({
    shininess: 5,
    flatShading: true
  }));
  scene.add(innerSphere);
  innerSphere.scale.setScalar(0.5);

  const light = new THREE.PointLight('white', 1, 20);
  light.position.set(2, 2, 2);
  scene.add(light);

  const colorize = () => {
    renderer.setClearColor(Random.pick(paperColors));
    const [ a, b ] = Random.shuffle(risoColors);
    sphere.material.color.set(a);
    innerSphere.material.color.set(b);
  };

  let time = 0;
  colorize();

  // const update = () => {
  //   props.update();
  // };
  // controls.addEventListener('change', update);
  // controls.addEventListener('start', update);
  // controls.addEventListener('end', update);

  return {
    reset () {
      colorize();
    },
    resize (props) {
      renderer.setSize(props.viewportWidth, props.viewportHeight);
      renderer.setPixelRatio(props.pixelRatio);
      camera.aspect = props.width / props.height;
      camera.updateProjectionMatrix();
    },
    render (props) {
      const { params } = props.data || {};
      const {  } = params;
      
      time += props.deltaTime;
      const anim = Math.sin(time) * 0.5 + 0.5;
      const s = lerp(0.25, 0.75, anim);
      // innerSphere.scale.setScalar(s);
      innerSphere.rotation.x = anim;
      controls.update();
      renderer.render(scene, camera);
    },
    unload (props) {
      // controls.removeEventListener('change', update);
      controls.dispose();
      renderer.dispose();
    }
  };
};

module.exports = (props) => {
  const params = {
    
  };
  return <InteractiveComponent
    sketch={sketch}
    settings={settings}
    params={params}
    size='small'
  />;
};
