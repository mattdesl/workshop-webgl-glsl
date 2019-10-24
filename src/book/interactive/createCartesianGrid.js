const createLine3D = require('../util/createLine3D');
const MathUtil = require('canvas-sketch-util/math');
const THREEDOMText = require('../util/THREEDOMText');
const defined = require('defined');
const THREECanvasText = require('../util/THREECanvasText');
const quaternionFromDirection = require('../util/quaternionFromDirection');

module.exports = createCartesianGrid;
function createCartesianGrid (props = {}) {
  const { context, showText = true, showSubdivisions = true } = props;

  const renderer = new THREE.WebGLRenderer({ context });
  renderer.setClearColor('#fff', 1);
  renderer.sortObjects = false;

  const camera = new THREE.OrthographicCamera(-1, 1, -1, 1, -100, 100);
  // const controls = new THREE.OrbitControls(camera, context.canvas);
  camera.rotation.order = 'YXZ';

  const scene = new THREE.Scene();

  // const geometry = new THREE.BoxGeometry(1, 1, 1);
  // const axis = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
  //   color: 'black',
  //   wireframe: true
  // }));
  // axis.scale.setScalar(1);
  // scene.add(axis);

  const { dimensions = 3 } = props;
  let axesData = [
    { target: 'x', normal: new THREE.Vector3(1, 0, 0), tangent: new THREE.Vector3(0, 1, 0) },
    { target: 'y', normal: new THREE.Vector3(0, 1, 0), tangent: new THREE.Vector3(1, 0, 0) },
    { target: 'z', normal: new THREE.Vector3(0, 0, 1), tangent: new THREE.Vector3(1, 0, 0) },
    { target: 'w', normal: new THREE.Vector3(1, 0, 0), tangent: new THREE.Vector3(0, 0, 1), midpoint: false }
  ];
  if (dimensions === 2) axesData = axesData.slice(0, 2);
  const gridSubdivisions = defined(props.gridSubdivisions, 9);
  const gridLineWidth = 0.01 / 2;
  if (gridSubdivisions % 2 === 0) console.warn('Should use an odd number for grid subdivisions');
  const cellSize = 1 / (gridSubdivisions - 1);

  const cellGeometry = new THREE.BoxGeometry(2, 2, 2);
  const cellMesh = new THREE.Mesh(cellGeometry, new THREE.MeshBasicMaterial({
    wireframe: true,
    color: 'red'
  }));
  cellMesh.scale.setScalar(cellSize);
  cellMesh.visible = false;

  const group = new THREE.Group();
  scene.add(group);

  const gridGroup = new THREE.Group();
  group.add(gridGroup);

  // const thickCylinderGeometry = new THREE.CylinderGeometry(gridLineWidth, gridLineWidth, 2, 8, 1);
  // const thinCylinderGeometry = new THREE.CylinderGeometry(gridLineWidth * 0.25, gridLineWidth, 2, 8, 1);

  const visibleSubdivisions = props.visibleSubdivisions;
  const lines = axesData.map(({ target, normal, tangent, midpoint = true }) => {
    return MathUtil.linspace(gridSubdivisions, true).map((t, i) => {
      if (i === 0 || i === gridSubdivisions - 1) return false;
      const isMidpoint = i === Math.floor(gridSubdivisions / 2);
      const isVisible = visibleSubdivisions ? visibleSubdivisions.includes(target) : false;
      if (showSubdivisions === false && !isMidpoint) return false;
      if (visibleSubdivisions != null && !isVisible && !isMidpoint) return false;
      if (midpoint === false && isMidpoint) return false;
      const line = createLine3D({
        color: isMidpoint ? 'tomato' : 'hsl(0, 0%, 85%)',
        opacity: isMidpoint ? 1 : 1,
        thickness: isMidpoint ? gridLineWidth : gridLineWidth * 0.25
      });
      const length = 1;
      const a = new THREE.Vector3().addScaledVector(normal, -length);
      const b = new THREE.Vector3().addScaledVector(normal, +length);
      const path = [ a, b ];
      line.update(path.map(position => ({ position })));

      const textNodes = (showText && isMidpoint && midpoint !== false) ? [ -1, 1 ].map(dir => {
        const textPadding = 0.1;
        const totalLength = length + textPadding;
        const point = new THREE.Vector3().addScaledVector(normal, totalLength * dir);
      
        // const node = THREECanvasText(camera);
        // gridGroup.add(node.mesh);
        const node = THREEDOMText(context.canvas, camera);
        context.canvas.parentElement.appendChild(node.element);
        const object = cellMesh.clone();
        gridGroup.add(object);

        const text = (dir < 0 ? '-' : '') + target.toUpperCase();
        object.position.copy(point);
        return {
          node,
          text,
          object,
          point,
          is3D: target === 'z' || target === 'w'
        };
      }) : [];

      const u = t * 2 - 1;
      line.midpoint = isMidpoint;
      line.object.position.addScaledVector(tangent, u);
      line.axis = target;
      line.textNodes = textNodes;
      return line;
      // const cylinder = new THREE.Mesh(
      //   isMidpoint ? thickCylinderGeometry : thinCylinderGeometry,
      //   new THREE.MeshBasicMaterial({
      //     transparent: true,
      //     color: isMidpoint ? 'tomato' : 'hsl(0, 0%, 85%)',
      //   })
      // );
      // quaternionFromDirection(normal, cylinder.quaternion);
      // cylinder.position.addScaledVector(tangent, u);

      // return {
      //   object: cylinder,
      //   textNodes
      // };
    });
  }).reduce((a, b) => a.concat(b), [])
    .filter(Boolean);

  lines.filter(line => !line.midpoint).forEach(line => gridGroup.add(line.object));
  lines.filter(line => line.midpoint).forEach(line => gridGroup.add(line.object));

  const vertexGroup = new THREE.Group();
  group.add(vertexGroup);

  return {
    scene,
    group,
    renderer,
    camera,
    vertexGroup,
    gridGroup,
    gridLineWidth,
    gridSubdivisions,
    cellSize,
    resize (props) {
      const { pixelRatio, viewportWidth, viewportHeight } = props;
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(viewportWidth, viewportHeight);

      lines.forEach(line => {
        line.resize(props);
      });
    },
    render (props) {
      const { time, width, height, zoom = 1.25, perspective = 1 } = props;
      const aspect = width / height;
      let curZoom = zoom * 1 / aspect;
      if (aspect > 1) {
        curZoom *= aspect;
      }
      camera.left = -curZoom * aspect;
      camera.right = curZoom * aspect;
      camera.top = curZoom;
      camera.bottom = -curZoom;
      camera.updateProjectionMatrix();

      camera.position.set(0, 0, 0);
      camera.rotation.y = perspective * -Math.PI / 4;
      camera.rotation.x = perspective * Math.atan(-1 / Math.sqrt(2));
      camera.updateMatrix();
      camera.updateMatrixWorld(true);

      renderer.render(scene, camera);
      lines.forEach(line => {
        line.textNodes.forEach(({ is3D, node, text, object, point }) => {
          node.update({
            ...props,
            object: object,
            color: 'black',
            fontSize: 0.35,
            opacity: is3D ? perspective : 1,
            scale: 1,
            text
          });
        });
      });
    },
    unload () {
      // controls.dispose();
      renderer.dispose();
    }
  };
}
