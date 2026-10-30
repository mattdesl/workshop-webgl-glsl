#### <sup>:closed_book: [canvas-sketch-util](../README.md) → [Documentation](./README.md) → `geometry`</sup>

---

### `canvas-sketch-util/geometry`

A set of utilities around geometry and shapes. Most of these functions operate on 2D vectors in the form `[x, y]` unless otherwise stated.

### Example

```js
const { clipPolylinesToBox } = require('canvas-sketch-util/geometry');

// A list of 2D polylines
const polylines = [
  [ [ 0, 0 ], [ 1, 1 ], [ 1.5, 1.5 ], [ 0, 1.5 ] ]
];

// A bounding box in 2D of our surface area
const margin = 0.5;
const box = [
  margin, margin, pageWidth - margin, pageHeight - margin
]

// Clip the lines to the bounding box
const clipped = clipLinesToBox(polylines, box)
```

### Functions

- [createHatchLines](#createHatchLines)
- [clipLineToCircle](#clipLineToCircle)
- [clipSegmentToCircle](#clipSegmentToCircle)
- [clipPolylinesToBox](#clipPolylinesToBox)
- [getBounds](#getBounds)
- [arePointsCollinear](#arePointsCollinear)
- [removeDuplicatePoints](#removeDuplicatePoints)

<a name="createHatchLines"></a>

### `lines = createHatchLines(bounds, angle, spacing, out = [])`

Computes the lines needed to "hatch fill" the given bounding box, with the specified hatch angle for all lines and `spacing` between each line.

- `bounds` is a bounding box in the form `[ [ minX, minY ], [ maxX, maxY ] ]` or `[ minX, minY, maxX, maxY ]`
- `angle` is in radians
- `spacing` is in your working units

The resulting lines are pushed to `out` (or a new array), leading to a list of `[ p0, p1 ]` lines.

<a name="clipLineToCircle"></a>

### `collides = clipLineToCircle(p0, p1, circle, radius, hits = [])`

Clips an infinite 2D line to a circle, returning true if an intersection occurred and populating the `hits` array with any intersection points.

Here, (`p0`, `p1`) represent two `[x, y]` points along the infinite line, and `circle` is the `[x, y]` centre of the 2D circle.

Note that `hits` may result in an array with only one element, if the line exactly intersects the edge of the circle.

Returns false if no collision occurred.

<a name="clipSegmentToCircle"></a>

### `collides = clipSegmentToCircle(p0, p1, circle, radius, hits = [])`

Clips a finite 2D line segment to a circle, returning true if an intersection occurred and populating the `hits` array with any intersection points.

Here, (`p0`, `p1`) represent start and end `[x, y]` points of the line segment, and `circle` is the `[x, y]` centre of the 2D circle.

Note that `hits` may result in an array with only one element, if the line segment exactly intersects the edge of the circle.

Returns false if no collision occurred.

<a name="clipPolylinesToBox"></a>

### `newLines = clipPolylinesToBox(lines, box, border = false, closeLines = true)`

Clips the 2D `lines` list (each containing an array of 2D coordinates) to a 2D bounding box, defined by `[ minX, minY, maxX, maxY ]` or `[ [ minX, minY ], [ maxX, maxY ] ]`. If you specify `border` as true, you will end up with a border line around the clipped bounding box. If you specify `closeLines` as false, paths will not be closed by default, i.e. you will have to close them during rendering.

The return value, `newLines`, is a new list of polylines that has been clipped.

<a name="getBounds"></a>

### `[ min, max ] = getBounds(lines)`

Computes the n-dimensional bounds (box, cube, etc) from the given `lines` argument, which is typically an array of 2D or 3D coordinates. Returns the `[ min, max ]` bounds as coordinates of the same dimensionality.

```js
const polygon = [
  [ 0, 0 ], [ 4, 1 ], [ 2, 3 ], [ -1, 1 ]
];
const [ min, max ] = getBounds(polygon);
// min -> [ -1, 0 ]
// max -> [ 4, 3 ]
```

<a name="arePointsCollinear"></a>

### `bool = arePointsCollinear(a, b, c)`

Returns true if the 2D points `a`, `b` and `c` are all collinear.

<a name="removeDuplicatePoints"></a>

### `newLine = removeDuplicatePoints(polyline)`

For the given 2D `polyline` (array of 2D array coordinates), removes duplicate adjacent points (at almost the same coordinate, accounting for floating point precision).

## 

#### <sup>[← Back to Documentation](./README.md)