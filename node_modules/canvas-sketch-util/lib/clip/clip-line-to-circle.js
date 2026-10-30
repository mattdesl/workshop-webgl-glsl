var almostEqual = require('almost-equal');

module.exports = intersectLineCircle;
function intersectLineCircle (p0, p1, circle, circleRadius, hits) {
  if (hits == null) hits = [];
  var a = sqr(p1[0] - p0[0]) + sqr(p1[1] - p0[1]);
  var b = 2.0 * (
    (p1[0] - p0[0]) * (p0[0] - circle[0]) +
    (p1[1] - p0[1]) * (p0[1] - circle[1])
  );

  var c = sqr(circle[0]) + sqr(circle[1]) + sqr(p0[0]) +
    sqr(p0[1]) - 2 * (circle[0] * p0[0] + circle[1] * p0[1]) -
    sqr(circleRadius);

  var det = b * b - 4.0 * a * c;
  var delta;
  if (det < 0) {
    return false;
  } else if (almostEqual(det, 0.0)) {
    delta = -b / (2.0 * a);
    hits.push([
      p0[0] + delta * (p1[0] - p0[0]),
      p0[1] + delta * (p1[1] - p0[1])
    ]);
    return true;
  } else if (det > 0.0) {
    var sqrtDet = Math.sqrt(det);
    delta = (-b + sqrtDet) / (2.0 * a);

    hits.push([
      p0[0] + delta * (p1[0] - p0[0]),
      p0[1] + delta * (p1[1] - p0[1])
    ]);

    delta = (-b - sqrtDet) / (2.0 * a);
    hits.push([
      p0[0] + delta * (p1[0] - p0[0]),
      p0[1] + delta * (p1[1] - p0[1])
    ]);
    return true;
  }
  return null;
}

function sqr (a) {
  return a * a;
}
