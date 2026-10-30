var almostEqual = require('almost-equal');

module.exports = intersectSegmentCircle;
function intersectSegmentCircle (p0, p1, circle, circleRadius, hits) {
  return intersect(p0[0], p0[1], p1[0], p1[1], circle[0], circle[1], circleRadius, hits);
}

function intersect (x1, y1, x2, y2, cx, cy, radius, hits) {
  if (hits == null) hits = [];
  var p1InCircle = pointInCircle(x1, y1, cx, cy, radius);
  var p2InCircle = pointInCircle(x2, y2, cx, cy, radius);

  if (p1InCircle && p2InCircle) {
    hits.push([ x1, y1 ]);
    hits.push([ x2, y2 ]);
    return true;
  }

  var h, a, closestPoint, px, py;
  if (p1InCircle || p2InCircle) {
    closestPoint = closestPointOnLineFromPoint(x1, y1, x2, y2, cx, cy);
    px = closestPoint[0];
    py = closestPoint[1];
    h = distance(px, py, cx, cy);
    a = Math.sqrt((radius * radius) - (h * h));
    var hitA = p1InCircle ? [ x1, y1 ] : [ x2, y2 ];
    var hitB = p1InCircle ? projectPoint(px, py, x2, y2, a) : projectPoint(px, py, x1, y1, a);
    if (almostEqual(hitA[0], hitB[0]) && almostEqual(hitA[1], hitB[1])) {
      // One point in the segment lies on the circle, the other is outside
      hits.push(hitA);
      return true;
    }
    hits.push(hitA);
    hits.push(hitB);
    return true;
  }

  closestPoint = closestPointOnSegmentFromPoint(x1, y1, x2, y2, cx, cy);
  px = closestPoint[0];
  py = closestPoint[1];

  if ((almostEqual(x1, px) && almostEqual(y1, py)) ||
      (almostEqual(x2, px) && almostEqual(y2, py))) {
    return false;
  } else {
    h = distance(px, py, cx, cy);
    if (h > radius) {
      return false;
    } else if (almostEqual(h, radius)) {
      hits.push([ px, py ]);
      return true;
    } else if (almostEqual(h, 0.0)) {
      hits.push(projectPoint(cx, cy, x1, y1, radius));
      hits.push(projectPoint(cx, cy, x2, y2, radius));
      return true;
    } else {
      a = Math.sqrt((radius * radius) - (h * h));
      hits.push(projectPoint(px, py, x1, y1, a));
      hits.push(projectPoint(px, py, x2, y2, a));
      return true;
    }
  }
}

function layDistance (x1, y1, x2, y2) {
  var dx = (x2 - x1);
  var dy = (y2 - y1);
  return dx * dx + dy * dy;
}

function pointInCircle (px, py, cx, cy, radius) {
  return layDistance(px, py, cx, cy) <= (radius * radius);
}

function distance (x1, y1, x2, y2) {
  var dx = (x1 - x2);
  var dy = (y1 - y2);
  return Math.sqrt(dx * dx + dy * dy);
}

function projectPoint (srcx, srcy, destx, desty, dist) {
  var t = dist / distance(srcx, srcy, destx, desty);
  return [
    srcx + t * (destx - srcx),
    srcy + t * (desty - srcy)
  ];
}

function closestPointOnLineFromPoint (x1, y1, x2, y2, px, py) {
  var vx = x2 - x1;
  var vy = y2 - y1;
  var wx = px - x1;
  var wy = py - y1;
  var c1 = vx * wx + vy * wy;
  var c2 = vx * vx + vy * vy;
  var ratio = c1 / c2;
  return [
    x1 + ratio * vx,
    y1 + ratio * vy
  ];
}

function closestPointOnSegmentFromPoint (x1, y1, x2, y2, px, py) {
  var vx = x2 - x1;
  var vy = y2 - y1;
  var wx = px - x1;
  var wy = py - y1;

  var c1 = vx * wx + vy * wy;

  if (c1 <= 0.0) {
    return [ x1, y1 ];
  }

  var c2 = vx * vx + vy * vy;
  if (c2 <= c1) {
    return [ x2, y2 ];
  }

  var ratio = c1 / c2;
  return [
    x1 + ratio * vx,
    y1 + ratio * vy
  ];
}
