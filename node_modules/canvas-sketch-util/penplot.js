var defined = require('defined');
var convert = require('convert-length');
var d3 = require('d3-path');
var svgPathContours = require('svg-path-contours');
var svgPathParse = require('parse-svg-path');
var svgPathAbs = require('abs-svg-path');
var svgPathArcs = require('normalize-svg-path');
var optimizer = require('./lib/optimize-penplot-paths');
var geometry = require('./geometry');

var DEFAULT_PEN_THICKNESS = 0.03;
var DEFAULT_PEN_THICKNESS_UNIT = 'cm';
var DEFAULT_PIXELS_PER_INCH = 90;

// A Path helper for arcs, curves and lineTo commands
module.exports.createPath = createPath;
function createPath (fn) {
  var path = d3.path();
  if (typeof fn === 'function') fn(path);
  path.lineTo = wrap(path.lineTo);
  path.quadraticCurveTo = wrap(path.quadraticCurveTo);
  path.bezierCurveTo = wrap(path.bezierCurveTo);
  return path;

  // Patch a bug in d3-path that doesn't handle
  // lineTo and so on without an initial moveTo
  function wrap (fn) {
    return function () {
      var args = Array.prototype.slice.call(arguments);
      if (path._x1 == null && path._y1 == null) {
        path.moveTo(args[0], args[1]);
      }
      return fn.apply(path, args);
    };
  }
}

module.exports.pathsToSVGPaths = pathsToSVGPaths;
function pathsToSVGPaths (inputs, opt) {
  opt = opt || {};

  var svgPath = convertToSVGPath(inputs, opt);
  var svgPaths = Array.isArray(svgPath) ? svgPath : [ svgPath ];
  return svgPaths.filter(Boolean);
}

module.exports.pathsToPolylines = pathsToPolylines;
function pathsToPolylines (inputs, opt) {
  opt = opt || {};

  var scale;
  if (opt.curveResolution != null && isFinite(opt.curveResolution) && typeof opt.curveResolution === 'number') {
    scale = opt.curveResolution;
  } else {
    var units = opt.units || 'px';
    scale = Math.max(1, convert(4, units, 'px'));
  }

  var contours = [];
  eachPath(inputs, function (feature) {
    if (typeof feature === 'string') {
      var commands = svgPathParse(feature);
      var subContours = svgPathContours(commands, scale);
      subContours.forEach(function (subContour) {
        contours.push(subContour);
      });
    } else {
      // output only 2D polylines
      var polyline = feature.map(function (point) {
        return [ point[0] || 0, point[1] || 0 ];
      });
      contours.push(polyline);
    }
  });
  return contours;
}

module.exports.pathsToSVG = pathsToSVG;
function pathsToSVG (inputs, opt) {
  opt = opt || {};

  var width = opt.width;
  var height = opt.height;

  var computeBounds = typeof width === 'undefined' || typeof height === 'undefined';
  if (computeBounds) {
    throw new Error('Must specify "width" and "height" options');
  }

  var viewUnits = 'px';
  var units = opt.units || viewUnits;

  var convertOptions = {
    units: units,
    viewUnits: 'px',
    roundPixel: false,
    precision: defined(opt.precision, 5),
    pixelsPerInch: DEFAULT_PIXELS_PER_INCH
  };

  // Convert all SVGPaths/paths/etc to polylines
  // This won't change their units so they are still in user space
  inputs = pathsToPolylines(inputs, Object.assign({}, convertOptions, {
    curveResolution: opt.curveResolution || undefined
  }));

  // TODO: allow for 'repeat' option
  if (opt.optimize) {
    var optimizeOpts = typeof opt.optimize === 'object' ? opt.optimize : {
      sort: true,
      merge: true,
      removeDuplicates: true,
      removeCollinear: true
    };
    var shouldSort = optimizeOpts.sort !== false;
    var shouldMerge = optimizeOpts.merge !== false;
    var shouldRemoveDuplicate = optimizeOpts.removeDuplicates !== false;
    var shouldRemoveCollinear = optimizeOpts.removeCollinear !== false;
    if (shouldRemoveDuplicate) {
      inputs = inputs.map(function (line) {
        return geometry.removeDuplicatePoints(line);
      });
    }
    if (shouldRemoveCollinear) {
      inputs = inputs.map(function (line) {
        return geometry.removeCollinearPoints(line);
      });
    }
    // now do sorting & merging
    if (shouldSort) inputs = optimizer.sort(inputs);
    if (shouldMerge) {
      var mergeThreshold = optimizeOpts.mergeThreshold != null
        ? optimizeOpts.mergeThreshold
        : convert(0.25, 'mm', units, {
          pixelsPerInch: DEFAULT_PIXELS_PER_INCH
        });
      inputs = optimizer.merge(inputs, mergeThreshold);
    }
  }

  // now we convert all polylines in user space units into view units
  var svgPaths = pathsToSVGPaths(inputs, convertOptions);

  var viewWidth = convert(width, units, viewUnits, convertOptions).toString();
  var viewHeight = convert(height, units, viewUnits, convertOptions).toString();
  var fillStyle = opt.fillStyle || 'none';
  var strokeStyle = opt.strokeStyle || 'black';
  var lineWidth = opt.lineWidth;
  var lineJoin = opt.lineJoin;
  var lineCap = opt.lineCap;

  // Choose a default line width based on a relatively fine-tip pen
  if (typeof lineWidth === 'undefined') {
    // Convert to user units
    lineWidth = convert(DEFAULT_PEN_THICKNESS, DEFAULT_PEN_THICKNESS_UNIT, units, convertOptions).toString();
  }

  var pathElements = svgPaths.map(function (d) {
    var attrs = toAttrList([
      [ 'd', d ]
    ]);
    return '    <path ' + attrs + ' />';
  }).join('\n');

  var groupAttrs = toAttrList([
    [ 'fill', fillStyle ],
    [ 'stroke', strokeStyle ],
    [ 'stroke-width', lineWidth + '' + units ],
    lineJoin ? [ 'stroke-linejoin', lineJoin ] : false,
    lineCap ? [ 'stroke-linecap', lineCap ] : false
  ]);

  return [
    '<?xml version="1.0" standalone="no"?>',
    '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" ',
    '    "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">',
    '<svg width="' + width + units + '" height="' + height + units + '"',
    '    xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ' + viewWidth + ' ' + viewHeight + '">',
    '  <g ' + groupAttrs + '>',
    pathElements,
    '  </g>',
    '</svg>'
  ].join('\n');
}

function toAttrList (args) {
  return args.filter(Boolean).map(function (attr) {
    return attr[0] + '="' + attr[1] + '"';
  }).join(' ');
}

module.exports.renderPaths = renderPaths;
function renderPaths (inputs, opt) {
  opt = opt || {};

  var context = opt.context;
  if (!context) throw new Error('Must specify "context" options');

  var units = opt.units || 'px';

  var width = opt.width;
  var height = opt.height;
  if (typeof width === 'undefined' || typeof height === 'undefined') {
    throw new Error('Must specify "width" and "height" options');
  }

  // Choose a default line width based on a relatively fine-tip pen
  var lineWidth = opt.lineWidth;
  if (typeof lineWidth === 'undefined') {
    // Convert to user units
    lineWidth = convert(DEFAULT_PEN_THICKNESS, DEFAULT_PEN_THICKNESS_UNIT, units, {
      roundPixel: false,
      pixelsPerInch: DEFAULT_PIXELS_PER_INCH
    });
  }

  // Clear canvas
  context.clearRect(0, 0, width, height);

  // Fill with white
  context.fillStyle = opt.background || 'white';
  context.fillRect(0, 0, width, height);

  context.strokeStyle = opt.foreground || opt.strokeStyle || 'black';
  context.lineWidth = lineWidth;
  context.lineJoin = opt.lineJoin || 'miter';
  context.lineCap = opt.lineCap || 'butt';

  // Draw lines
  eachPath(inputs, function (feature) {
    context.beginPath();

    if (typeof feature === 'string') {
      // SVG string = drawSVGPath;
      drawSVGPath(context, feature);
    } else {
      // list of points
      feature.forEach(function (p) {
        context.lineTo(p[0], p[1]);
      });
    }

    context.stroke();
  });

  // Save layers
  return [
    // Export PNG as first layer
    context.canvas,
    // Export SVG for pen plotter as second layer
    {
      data: pathsToSVG(inputs, opt),
      extension: '.svg'
    }
  ];
}

// Not documented...
module.exports.convertToSVGPath = convertToSVGPath;
function convertToSVGPath (input, opt) {
  // Input can be a single 'path' (string, object or polyline),
  // or nested 'path' elements

  // non-path
  if (isEmpty(input)) return '';

  // strings are just returned as-is
  if (typeof input === 'string') return input;

  // assume a path instance
  if (isPath(input)) {
    return input.toString();
  }

  if (isPolyline(input)) {
    return polylineToSVGPath(input, opt);
  }

  // assume a list of 'path' features or a list of polylines
  if (Array.isArray(input)) {
    return input.map(function (feature) {
      return convertToSVGPath(feature, opt);
    }).reduce(function (a, b) {
      return a.concat(b);
    }, []);
  }

  // Wasn't clear... let's return an empty path
  return '';
}

module.exports.eachPath = eachPath;
function eachPath (input, cb) {
  if (isEmpty(input)) {
    // pass-through
  } else if (typeof input === 'string' || (isPath(input))) {
    cb(input.toString());
  } else if (isPolyline(input)) {
    cb(input);
  } else if (Array.isArray(input)) {
    input.forEach(function (feature) {
      return eachPath(feature, cb);
    });
  }
}

module.exports.drawSVGPath = drawSVGPath;
function drawSVGPath (context, svgPath) {
  var commands = svgPathArcs(svgPathAbs(svgPathParse(svgPath)));
  for (var i = 0; i < commands.length; i++) {
    var c = commands[i];
    var type = c[0];
    if (type === 'M') {
      context.moveTo(c[1], c[2]);
    } else if (type === 'C') {
      context.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]);
    } else {
      throw new Error('Illegal type "' + type + '" in SVG commands');
    }
  }
}

module.exports.polylineToSVGPath = polylineToSVGPath;
function polylineToSVGPath (polyline, opt) {
  opt = opt || {};
  var units = opt.units || 'px';
  var viewUnits = opt.viewUnits || units;
  var commands = [];
  var convertOptions = {
    roundPixel: false,
    precision: defined(opt.precision, 5),
    pixelsPerInch: DEFAULT_PIXELS_PER_INCH
  };
  polyline.forEach(function (point, j) {
    var type = (j === 0) ? 'M' : 'L';
    var x = convert(point[0], units, viewUnits, convertOptions).toString();
    var y = convert(point[1], units, viewUnits, convertOptions).toString();
    commands.push(type + x + ' ' + y);
  });
  return commands.join(' ');
}

function isEmpty (input) {
  return !input || (Array.isArray(input) && input.length === 0);
}

function isPath (input) {
  return typeof input === 'object' && input && !Array.isArray(input);
}

function isPolyline (input) {
  // empty array or not an array
  if (!input || !Array.isArray(input) || input.length === 0) return false;
  // if at least one of the inputs is a point, assume they all are
  return isPoint(input[0]);
}

function isPoint (point) {
  return Array.isArray(point) && point.length >= 2 && point.every(function (p) {
    return typeof p === 'number';
  });
}

// @deprecated
module.exports.polylinesToSVG = function polylinesToSVG (polylines, opt) {
  if (!Array.isArray(polylines)) throw new Error('Expected array of arrays for polylines');
  console.warn('polylinesToSVG is deprecated, use pathsToSVG instead which has the same functionality');
  // Create a single string from polylines
  return pathsToSVG(polylines, opt);
};

// @deprecated
module.exports.renderPolylines = function renderPolylines (polylines, opt) {
  if (!Array.isArray(polylines)) throw new Error('Expected array of arrays for polylines');
  console.warn('renderPolylines is deprecated, use renderPaths instead which has the same functionality');
  // Create a single string from polylines
  return renderPaths(polylines, opt);
};
