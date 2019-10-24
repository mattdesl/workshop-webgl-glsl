/** @jsx h */
const { h } = require('preact');
const defined = require('defined');
const Random = require('canvas-sketch-util/random');
const { linspace, lerp } = require('canvas-sketch-util/math');
const InteractiveComponent = require('./InteractiveComponent');
const createCartesianGrid = require('./createCartesianGrid');
const createWireframe = require('three-tube-wireframe');
const UI = require('../util/UI');

const settings = {
  context: 'webgl',
  animate: true,
  attributes: { antialias: true }
};

const sketch = (props) => {
  const { data = {}, context, canvas } = props;
  const { geometryType, material, materialType } = data.params;

  const renderer = new THREE.WebGLRenderer({ context });
  renderer.setClearColor('#fff', 1);
  renderer.sortObjects = false;

  const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000);
  camera.position.set(2, 2, 2);
  camera.lookAt(new THREE.Vector3());

  const getWireframe = (geom) => {
    return material ? geom : createWireframe(geom, {
      thickness: 0.005
    });
  };
  
  const materialTypes = {
    GeometryMaterial: new THREE.MeshBasicMaterial({
      color: 'black',
      transparent: true,
      depthTest: false,
      depthWrite: false,
      wireframe: false
    }),
    MeshNormalMaterial: new THREE.MeshNormalMaterial(),
    MeshBasicMaterial: new THREE.MeshBasicMaterial(),
    MeshPhongMaterial: new THREE.MeshPhongMaterial(),
    MeshStandardMaterial: new THREE.MeshStandardMaterial(),
    MeshToonMaterial: new THREE.MeshToonMaterial(),
  };

  const geometryTypes = {
    PlaneGeometry: getWireframe(new THREE.PlaneGeometry(1, 1, 1, 1)),
    BoxGeometry: getWireframe(new THREE.BoxGeometry(1, 1, 1)),
    CylinderGeometry: getWireframe(new THREE.CylinderGeometry(0.5, 0.5, 1.5, 8, 1)),
    SphereGeometry: getWireframe(new THREE.SphereGeometry(1, 16, 8)),
    IcosahedronGeometry: getWireframe(new THREE.IcosahedronGeometry(1, 1))
  };
  
  const scene = new THREE.Scene();
  const mainMesh = new THREE.Mesh(
    geometryTypes[geometryType],
    materialTypes[materialType]
  );
  scene.add(mainMesh);

  const controls = new THREE.OrbitControls(camera, canvas);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = true;

  const light = new THREE.PointLight('white', 1, 20);
  light.position.set(2, 2, 2);
  scene.add(light);

  return {
    resize (props) {
      renderer.setSize(props.viewportWidth, props.viewportHeight);
      renderer.setPixelRatio(props.pixelRatio);
      camera.aspect = props.width / props.height;
      camera.updateProjectionMatrix();
    },
    render (props) {
      const { data = {} } = props;
      const { params } = data;
      const { geometryType, materialType, wireframe, flatShading, color } = params;

      mainMesh.geometry = geometryTypes[geometryType];
      mainMesh.material = materialTypes[materialType];
      const oldFlat = mainMesh.material.flatShading;
      const oldWire = mainMesh.material.wireframe;
      mainMesh.material.wireframe = wireframe;
      mainMesh.material.flatShading = flatShading;
      if (flatShading !== oldFlat || wireframe !== oldWire) {
        mainMesh.material.needsUpdate = true;
      }
      if (mainMesh.material.color) mainMesh.material.color.set(color);

      controls.update();
      renderer.render(scene, camera);
    },
    unload (props) {
      controls.dispose();
      renderer.dispose();
    }
  }
}

module.exports = (props) => {
  const {
    material = false
  } = props;

  const control = {
    min: -1,
    max: 1,
    step: 0.01
  };

  const params = {
    material,
    @UI.Select({ visible: !material, label: 'Type', options: [
      'PlaneGeometry', 'BoxGeometry', 'SphereGeometry', 'IcosahedronGeometry', 'CylinderGeometry'
    ] })
    geometryType: material ? 'SphereGeometry' : 'PlaneGeometry',
    @UI.Select({ visible: material, label: 'Type', options: [
      'MeshBasicMaterial', 'MeshNormalMaterial', 'MeshPhongMaterial',
      'MeshToonMaterial', 'MeshStandardMaterial'
    ] })
    materialType: material ? 'MeshBasicMaterial' : 'GeometryMaterial',
    @UI.Color({ visible: material })
    color: material ? 'tomato' : 'black',
    @UI.Checkbox({ visible: material })
    wireframe: false,
    @UI.Checkbox({ visible: material })
    flatShading: true
  };

  return <InteractiveComponent
    sketch={sketch}
    settings={settings}
    params={params}
    showParams
    showCanvas
    size='small'
  />;
};
