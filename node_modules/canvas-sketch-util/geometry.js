var lineclip = require('lineclip');
var almostEqual = require('almost-equal');
var arrayAlmostEqual = require('array-almost-equal');
var clone = require('clone');
var squaredDistance = require('./lib/vec2').squaredDistance;

module.exports.arePointsCollinear = function (point0, point1, point2) {
  var x0 = point0[0];
  var y0 = point0[1];
  var x1 = point1[0];
  var y1 = point1[1];
  var x2 = point2[0];
  var y2 = point2[1];
  return almostEqual((y0 - y1) * (x0 - x2), (y0 - y2) * (x0 - x1));
};

module.exports.removeDuplicatePoints = function (path) {
  var newPath = [];
  var lastPoint;
  for (var i = 0; i < path.length; i++) {
    var curPoint = path[i];
    if (!lastPoint || !arrayAlmostEqual(lastPoint, curPoint)) {
      newPath.push(curPoint);
      lastPoint = curPoint;
    }
  }
  return clone(newPath);
};

module.exports.removeCollinearPoints = function (path) {
  var newPath = [];
  var remainingPoints = clone(path);
  while (remainingPoints.length >= 3) {
    var p0 = remainingPoints[0];
    var p1 = remainingPoints[1];
    var p2 = remainingPoints[2];
    var collinear = module.exports.arePointsCollinear(p0, p1, p2);
    // one more check is to ensure that points are in a line:
    // A->B->C
    // not A->C->B or some variant
    if (collinear) {
      var distAB = squaredDistance(p0, p1);
      var distAC = squaredDistance(p0, p2);
      if (distAB > distAC) collinear = false;
    }
    if (collinear) {
      // the first 3 points are collinear
      // remove the second point as it isn't needed
      remainingPoints.splice(1, 1);
    } else {
      // the 3 points are not collinear
      // add the first one as the others may still be collinear
      for (var i = 0; i < 1; i++) {
        newPath.push(remainingPoints.shift());
      }
    }
  }
  // add any remaining points
  while (remainingPoints.length) {
    newPath.push(remainingPoints.shift());
  }
  return newPath;
};

module.exports.clipSegmentToCircle = require('./lib/clip/clip-segment-to-circle');
module.exports.clipLineToCircle = require('./lib/clip/clip-line-to-circle');

module.exports.clipPolylinesToBox = function (polylines, bbox, border, closeLines) {
  if (!Array.isArray(bbox) || (bbox.length !== 2 && bbox.length !== 4)) {
    throw new Error('Expected box to either be format [ minPoint, maxPoint ] or [ minX, minY, maxX, maxY ]');
  }
  // Expand nested format to flat bounds
  if (bbox.length === 2) {
    var min = bbox[0];
    var max = bbox[1];
    bbox = [ min[0], min[1], max[0], max[1] ];
  }
  closeLines = closeLines !== false;
  border = Boolean(border);

  if (border) {
    return polylines.map(function (line) {
      var result = lineclip.polygon(line, bbox);
      if (closeLines && result.length > 2) {
        result.push(result[0]);
      }
      return result;
    }).filter(function (lines) {
      return lines.length > 0;
    });
  } else {
    return polylines.map(function (line) {
      return lineclip.polyline(line, bbox);
    }).reduce(function (a, b) {
      return a.concat(b);
    }, []);
  }
};

module.exports.createHatchLines = createHatchLines;
function createHatchLines (bounds, angle, spacing, out) {
  if (!Array.isArray(bounds) || (bounds.length !== 2 && bounds.length !== 4)) {
    throw new Error('Expected box to either be format [ minPoint, maxPoint ] or [ minX, minY, maxX, maxY ]');
  }
  // Expand nested format to flat bounds
  if (bounds.length === 2) {
    var min = bounds[0];
    var max = bounds[1];
    bounds = [ min[0], min[1], max[0], max[1] ];
  }

  if (angle == null) angle = -Math.PI / 4;
  if (spacing == null) spacing = 0.5;
  if (out == null) out = [];

  // Reference:
  // https://github.com/evil-mad/EggBot/blob/master/inkscape_driver/eggbot_hatch.py
  spacing = Math.abs(spacing);
  if (spacing === 0) throw new Error('cannot use a spacing of zero as it will run an infinite loop!');

  var xmin = bounds[0];
  var ymin = bounds[1];
  var xmax = bounds[2];
  var ymax = bounds[3];

  var w = xmax - xmin;
  var h = ymax - ymin;
  if (w === 0 || h === 0) return out;
  var r = Math.sqrt(w * w + h * h) / 2;
  var rotAngle = Math.PI / 2 - angle;
  var ca = Math.cos(rotAngle);
  var sa = Math.sin(rotAngle);
  var cx = xmin + (w / 2);
  var cy = ymin + (h / 2);
  var i = -r;
  while (i <= r) {
    // Line starts at (i, -r) and goes to (i, +r)
    var x1 = cx + (i * ca) + (r * sa); //  i * ca - (-r) * sa
    var y1 = cy + (i * sa) - (r * ca); //  i * sa + (-r) * ca
    var x2 = cx + (i * ca) - (r * sa); //  i * ca - (+r) * sa
    var y2 = cy + (i * sa) + (r * ca); //  i * sa + (+r) * ca
    i += spacing;
    // Remove any potential hatch lines which are entirely
    // outside of the bounding box
    if ((x1 < xmin && x2 < xmin) || (x1 > xmax && x2 > xmax)) {
      continue;
    }
    if ((y1 < ymin && y2 < ymin) || (y1 > ymax && y2 > ymax)) {
      continue;
    }
    out.push([ [ x1, y1 ], [ x2, y2 ] ]);
  }
  return out;
}

module.exports.getBounds = function getBounds (points) {
  var n = points.length;
  if (n === 0) {
    throw new Error('Expected points to be a non-empty array');
  }
  var d = points[0].length;
  var lo = points[0].slice();
  var hi = points[0].slice();
  for (var i = 1; i < n; ++i) {
    var p = points[i];
    for (var j = 0; j < d; ++j) {
      var x = p[j];
      lo[j] = Math.min(lo[j], x);
      hi[j] = Math.max(hi[j], x);
    }
  }
  return [ lo, hi ];
};
