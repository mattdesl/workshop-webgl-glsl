/** @jsx h */
const { h } = require('preact');
const Random = require('canvas-sketch-util/random');
const InteractiveComponent = require('./InteractiveComponent');
const { linspace, lerp } = require('canvas-sketch-util/math');
const UI = require('../util/UI');
const THREECanvasText = require('../util/THREECanvasText');
const THREEDOMText = require('../util/THREEDOMText');

const settings = {
  context: 'webgl',
  attributes: { antialias: true }
};

const sketch = ({ context, data = {} }) => {
  const {
    gridSize,
    zoom
  } = data.params;

  const renderer = new THREE.WebGLRenderer({ context });
  renderer.setClearColor('#fff', 1);

  const camera = new THREE.OrthographicCamera(-1, 1, -1, 1, -100, 100);
  camera.position.x = gridSize / 2;
  camera.position.y = gridSize / 2;

  const scene = new THREE.Scene();

  const color0 = '#000';
  const color1 = color0;
  const mesh = new THREE.GridHelper(gridSize, gridSize, color0, color1);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.set(gridSize / 2, gridSize / 2, 0);
  scene.add(mesh);

  const cube = new THREE.BoxGeometry(1, 1, 1);
  cube.translate(0.5, 0.5, 0);

  const block = new THREE.Mesh(
    cube,
    new THREE.MeshBasicMaterial({
      depthTest: false,
      depthWrite: false,
      color: '#000'
    })
  );
  scene.add(block);

  const text = THREEDOMText(context.canvas, camera);
  context.canvas.parentElement.appendChild(text.element);

  return {
    resize ({ pixelRatio, viewportWidth, viewportHeight }) {
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);
    },
    render ({ time, width, height, data = {} }) {
      const { x, y, zoom } = data.params;

      const aspect = width / height;
      let curZoom = zoom * 1 / aspect;
      if (aspect > 1) {
        curZoom *= aspect;
      }
      camera.left = -curZoom * aspect;
      camera.right = curZoom * aspect;
      camera.top = -curZoom;
      camera.bottom = curZoom;
      camera.updateProjectionMatrix();

      block.position.set(x, y, 0);

      text.update({
        object: block,
        width,
        height,
        color: 'white',
        fontSize: 0.25,
        scale: 1,
        flipY: true,
        text: `(${x}, ${y})`,
      });

      // text.mesh.position.copy(block.position);
      // text.mesh.position.x += 0.5;
      // text.mesh.position.y += 0.5;
      // text.mesh.position.z += 1;

      renderer.render(scene, camera);
    },
    unload () {
      renderer.dispose();
    }
  };
}

module.exports = () => {
  const control = {
    min: 0,
    max: ({ gridSize }) => (gridSize - 1),
    step: 1
  };

  const params = {
    zoom: 3.5,
    gridSize: 6,
    @UI.Slider(control)
    x: 2,
    @UI.Slider(control)
    y: 1
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
