const axis = new THREE.Vector3();

module.exports = setDirection;
function setDirection (dir, quaternion = new THREE.Quaternion()) {
  // dir is assumed to be normalized
  if (dir.y > 0.99999) {
    quaternion.set(0, 0, 0, 1);
  } else if (dir.y < -0.99999) {
    quaternion.set(1, 0, 0, 0);
  } else {
    axis.set(dir.z, 0, -dir.x).normalize();
    const radians = Math.acos(dir.y);
    quaternion.setFromAxisAngle(axis, radians);
  }
  return quaternion;
}
