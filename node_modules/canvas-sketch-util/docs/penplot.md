#### <sup>:closed_book: [canvas-sketch-util](../README.md) → [Documentation](./README.md) → `penplot`</sup>

---

### `canvas-sketch-util/penplot`

A set of utilities around pen plotting with the [AxiDraw V3](https://shop.evilmadscientist.com/productsmenu/846). This is ideally used alongside [canvas-sketch](https://github.com/mattdesl/canvas-sketch) CLI tools for exporting SVG files.

This tool allows you to create arbitrary "path" instances using familiar Canvas2D APIs, and then serialize these as a complete SVG that should be plottable. In this utility, a "path" can be a polyline, Path instance, or SVGPath string.

### Example

```js
const { pathsToSVG, createPath } = require('canvas-sketch-util/penplot');

// You can create a Path serializer like so
const path0 = createPath(context => {
  context.moveTo(25, 50);
  context.lineTo(10, 10);
  context.arc(52, 50, 25, 0, Math.PI * 2);
});

// You can also append commands onto the path
// path.lineTo(50, 50);

// And/or you can use manual polylines like so
const path1 = [
  [ 0, 0 ], [ 50, 25 ], [ 25, 50 ]
];

// Generate a SVG file as a string
// Accepts a single or multiple (potentially nested) "path" interfaces
// A "path" can be a polyline, SVGPath string, or Path object from createPath
const svg = pathsToSVG([ path0, path1 ], {
  width: 2,
  height: 2,
  units: 'cm',
  lineWidth: 0.04,
  // optimize the SVG output for pen plotter use
  optimize: true
});
```

### Functions

- [createPath](#createPath)
- [pathsToPolylines](#pathsToPolylines)
- [pathsToSVG](#pathsToSVG)
- [renderPaths](#renderPaths)

<a name="createPath"></a>

### `path = createPath([fn])`

Creates a new *Path* serializer which can be used for drawing lines, arcs, rectangles and shapes with Canvas2D-style functions. If you specify a `fn`, it will be called with the path as the argument before returning. For example:

```js
const path = createPath(context => {
  // Circle in centre of page
  context.arc(width / 2, height / 2, 25, 0, Math.PI * 2);
});

// Get a SVG string of the path
const svg = path.toString();
```

The *Path* interface has the following drawing functions, see [d3-path API](https://www.npmjs.com/package/d3-path#api-reference) for details. The drawing functions match those in Canvas2D contexts.

- `moveTo(x, y)`
- `lineTo(x, y)`
- `quadraticCurveTo(cpx, cpy, x, y)`
- `bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y)`
- `arcTo(x1, y1, x2, y2, radius)`
- `arc(x, y, radius, startAngle, endAngle[, anticlockwise])`
- `closePath()`
- `rect(x, y, width, height)`

To get the SVGPath string, use `path.toString()`.

<a name="pathsToPolylines"></a>

### `polylines = pathsToPolylines(paths, opt)`

Converts a single or multiple (potentially listed) array of 'paths' (Path objects, SVGPath strings, or polylines) into a flat 1-dimensional list of polyline contours.

This is done by converting all SVGPath strings into cubic bezier arcs, and then subdividing them into discrete lists of points.

```js
const inputs = /* .. path, polylines, etc .. */;

pathsToPolylines(inputs).forEach(contour => {
  context.beginPath();
  contour.forEach(point => {
    context.lineTo(point[0], point[1]);
  });
  context.stroke();
});
```

You can specify `{ curveResolution }` option (a number) to adjust the smoothness when converting SVG paths into discrete polyline lists. The number is the inverse of the distance threshold to further subdivide curves, a higher resolution leads to more subdivisions. By default, a reasonable default will be selected from your `{ units }` option (4 units converted to pixels at 96 DPI). For example:

```js
// Use a resolution of 1
pathsToPolylines(inputs, { curveResolution: 1 });

// Choose a reasonable default resolution based on units
pathsToPolylines(inputs, { units: 'cm' });

// No options specified, will default to a resolution of 4
pathsToPolylines(inputs);
```

<a name="pathsToSVG"></a>

### `svg = pathsToSVG(paths, opt)`

Generates a physically-sized SVG file as a string from the given list of `paths` with the specified options in `opt`. The `paths` can be a single or multiple nested path instances, such as Path objects from `createPath`, or SVGPath strings, or polylines (nested 2D points using arrays).

Options:

- `units` (defaults to `'px'`) a unit string like `'cm'`, `'px'`, `'in'`, etc
- `width` (required) the width of the resulting output in `units`
- `height` (required) the height of the resulting output in `units`
- `lineWidth` (defaults to 0.03 cm in user `units`) the line width of strokes
- `strokeStyle` (defaults to `'black'`) the color of the strokes
- `precision` (defaults to 5) the decimal precision for floating point numbers as they are converted to strings
- `fillStyle` (defaults to `'none'`) the fill style of SVG path elements
- `curveResolution` (defaults to a reasonable smoothness) the resolution when converting SVG paths into discrete arcs, see [pathsToPolylines](#pathsToPolylines) for details
- `optimize` (defaults to false) if true, enables path sorting for optimal traversal distance and merging end-points to reduce pen lifts. Can also specify an object instead of a boolean:
  - `optimize.sort` (default true) – can disable distance sorting
  - `optimize.removeDuplicates` (default true) – remove duplicaet adjacent points (before merging)
  - `optimize.removeCollinear` (default true) – remove unnecessary collinear adjacent points within lines
  - `optimize.merge` (default true) – can disable end point merging
  - `optimize.mergeThreshold` (default 0.25 mm in your units) – adjsut the distance threshold at which to merge end points

Returns a string of the SVG file.

The SVG is formatted in such a way that it can be easily opened and exported to AxiDraw V3 with Inkscape.

<a name="renderPaths"></a>

### `layers = renderPaths(lines, props)`

Renders the specified list of `lines` (each containing an array of 2D coordinates) using the specified `props` (expected to be from `canvas-sketch`), returning an array of renderable layers: `[ canvas, svgOutput ]`.

> :bulb: 
> 
> <sup>This is a convenience function to be used alongside `canvas-sketch`.</sup>

This will render the lines as 2D paths into the canvas context given by `props`, and then convert them into a SVG file. The return value is a list of layers that can be used for exporting both a PNG and SVG file with `canvas-sketch-cli`.

Example:

```js
const canvasSketch = require('canvas-sketch');
const { createPath, renderPaths } = require('canvas-sketch-util/penplot');

const settings = {
  dimensions: 'A4',
  pixelsPerInch: 300,
  units: 'cm',
};

const sketch = ({ width, height }) => {
  // Create shapes with path interface
  const shape0 = createPath(ctx => ctx.arc(0, 0, 50, 0, Math.PI * 2));
  // And/or with polylines or plain SVGStrings, e.g. from a .svg file
  const shape1 = [ [ 0, 0 ], [ 50, 25 ] ];
  // Combine into an array or nested array
  const paths = [ shape0, shape1 ];
  // Export both PNG and SVG files on 'Cmd + S'
  return props => renderPaths(paths, props);
};

canvasSketch(sketch, settings);
```

You can also override settings such as `lineWidth` or `strokeStyle` if you want a different SVG output:

```js
const sketch = ({ width, height }) => {
  // ...
  return props => renderPaths(paths, {
    ...props,
    lineWidth: 0.05
  });
};
```

Full list of expected props:

- `context` (required) The canvas context
- `units` The units of the artwork
- `width` (required) the width of the artwork in `units`
- `height` (required) the width of the artwork in `units`
- `background` The background `fillStyle` for 2D canvas, default `'white'`
- `foreground` The foreground `strokeStyle` applied only to the 2D canvas, defaults to `'black'` (use this if you wish to have a white stroke on black PNG, but still a black stroke SVG)
- Other properties passed into `pathsToSVG` function

## 

#### <sup>[← Back to Documentation](./README.md)