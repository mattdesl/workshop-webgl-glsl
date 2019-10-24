const { mat4 } = require('gl-matrix');
const cameraProject = require('camera-project');
const cameraUnproject = require('camera-unproject');

module.exports = function (camera) {
  const modelView = [];
  const projView = [];
  const invProjView = [];
  const viewport = [ 0, 0, 1, 1 ];
  const container = new THREE.Group();

  return {
    update ({ width, height }) {
      camera.updateMatrix();
      camera.updateMatrixWorld(true);

      viewport[2] = width;
      viewport[3] = height;

      const viewMatrix = camera.matrixWorldInverse.elements;
      const projectionMatrix = camera.projectionMatrix.elements;
      const modelMatrix = container.matrixWorld.elements;
      mat4.multiply(modelView, viewMatrix, modelMatrix);
      mat4.multiply(projView, projectionMatrix, modelView);
      mat4.invert(invProjView, projView);
    },
    project,
    unproject
  };

  function project (point, output = []) {
    const vec = [ point[0], point[1], point[2] || 0 ];
    return cameraProject(output, vec, viewport, projView);
  }

  function unproject (point, output = []) {
    const vec = [ point[0], point[1], point[2] || 0 ];
    return cameraUnproject(output, vec, viewport, invProjView);
  }
};
