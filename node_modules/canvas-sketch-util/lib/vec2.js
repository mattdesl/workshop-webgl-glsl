module.exports.squaredDistance = squaredDistance;
function squaredDistance (pt1, pt2) {
  var dx = pt2[0] - pt1[0];
  var dy = pt2[1] - pt1[1];
  return dx * dx + dy * dy;
}
