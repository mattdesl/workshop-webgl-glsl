const CameraProjector = require('./CameraProjector');
const defined = require('defined');

module.exports = (canvas, camera) => {
  const container = canvas.parentElement;
  if (!container) {
    throw new Error('No parent element for canvas');
  }
  const projector = CameraProjector(camera);
  const box = new THREE.Box3();

  const element = document.createElement('label');
  element.classList.add('THREEDOMTextLabel');

  const node = {
    element,
    dispose () {
      if (element.parentElement) {
        element.parentElement.removeChild(element);
      }
    },
    update (props = {}) {
      const {
        object,
        fontSize = 1,
        scale = 1,
        text = '',
        flipY,
        offset = [ 0, 0 ],
        position = new THREE.Vector3()
      } = props;
      projector.update(props);
      object.updateMatrixWorld(true);
      box.setFromObject(object);
      box.translate(position);

      const min2D = projector.project(box.min.toArray());
      const max2D = projector.project(box.max.toArray());
      let canvasWidth = Math.abs(max2D[0] - min2D[0]);
      let canvasHeight = Math.abs(max2D[1] - min2D[1]);

      const x = (min2D[0]) + offset[0];
      const y = (props.height - min2D[1] - (flipY ? 0 : canvasHeight)) + offset[1];

      const newProps = {
        opacity: defined(props.opacity, 1),
        width: `${Math.round(canvasWidth)}px`,
        height: `${Math.round(canvasHeight)}px`,
        fontSize: `${canvasHeight * fontSize}px`,
        color: props.color || 'black',
        fontFamily: props.fontFamily || 'inherit',
        background: props.background,
        transform: `translateZ(0) translate(${x.toFixed(5)}px, ${y.toFixed(5)}px) scale(${scale.toFixed(5)})`
      };
      Object.assign(element.style, newProps);
      element.textContent = text;
    }
  };

  return node;
};
