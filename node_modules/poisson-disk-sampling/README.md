# poisson-disk-sampling

[![Build Status](https://travis-ci.org/kchapelier/poisson-disk-sampling.svg)](https://travis-ci.org/kchapelier/poisson-disk-sampling) [![NPM version](https://badge.fury.io/js/poisson-disk-sampling.svg)](http://badge.fury.io/js/poisson-disk-sampling)

Poisson disk sampling in arbitrary dimensions.

## Installing

With [npm](https://www.npmjs.com/) do:

```
npm install poisson-disk-sampling
```

With [yarn](https://yarnpkg.com/) do:

```
yarn add poisson-disk-sampling
```

A compiled version for web browsers is also available on a CDN:

```html
<script src="https://cdn.jsdelivr.net/gh/kchapelier/poisson-disk-sampling@2.3.1/build/poisson-disk-sampling.min.js"></script>
```

## Features

- Can be used in any dimension (1D, 2D, 3D and more).
- Can be used with a custom RNG function.
- Allow the configuration of the max number of tries, the minimum distance and the maximum distance between each points.
- Allow the use of custom function to drive the density of the distribution.
- Similar general API as [fast-2d-poisson-disk-sampling](https://github.com/kchapelier/fast-2d-poisson-disk-sampling) and [jittered-hexagonal-grid-sampling](https://github.com/kchapelier/jittered-hexagonal-grid-sampling).

## Basic example

```js
var p = new PoissonDiskSampling({
    shape: [600, 300, 200],
    minDistance: 20,
    maxDistance: 30,
    tries: 10
});
var points = p.fill();

console.log(points); // array of sample points, themselves represented as simple arrays
```

### Result as an image

<img src="https://github.com/kchapelier/poisson-disk-sampling/raw/master/img/example1.png" style="image-rendering:pixelated; width:500px;"></img>

## Example with an image driving the distribution density

```js
var p = new PoissonDiskSampling({
    shape: [500, 500],
    minDistance: 1,
    maxDistance: 30,
    tries: 20,
    distanceFunction: function (p) {
        return getImagePixelValueSomehow(p[0], p[1]); // value between 0 and 1
    }
});
var points = p.fill();

console.log(points); // array of sample points, themselves represented as simple arrays
```

### Result as an image

<img src="https://github.com/kchapelier/poisson-disk-sampling/raw/master/img/example2.png" style="image-rendering:pixelated; width:500px;"></img>

### Complete working example

[Demo online](http://www.kchapelier.com/poisson-disk-sampling/examples/distance-function-with-images-in-browser/) | [Source code](https://github.com/kchapelier/poisson-disk-sampling/tree/master/examples/distance-function-with-images-in-browser/)

## Public API

### Constructor

**new PoissonDiskSampling(options[, rng])**

- *options :*
  - *shape :* Size/dimensions of the grid to generate points in, required.
  - *minDistance :* Minimum distance between each points, required.
  - *maxDistance :* Maximum distance between each points, defaults to minDistance times 2.
  - *tries :* Maximum number of tries to generate a point, defaults to 30.
  - *distanceFunction :* Function to control the distance between each point depending on their position, must return a value between 0 and 1.
  - *bias :* When using a distanceFunction, will indicate which point constraint takes priority when evaluating two points (0 for the lowest distance, 1 for the highest distance), defaults to 0.
- *rng :* A function to use as random number generator, defaults to Math.random.

The following code will allow the generation of points where both coordinates will range from *0 up to 50* (including 0, but not including 50, **0 <= c < 50**).

```js
// Poisson disk sampling in a 2D square
var pds = new PoissonDiskSampling({
    shape: [50, 50],
    minDistance: 4,
    maxDistance: 4,
    tries: 10
});
```

```js
// Poisson disk sampling in a 3D volume
var pds = new PoissonDiskSampling({
    shape: [900, 400, 400],
    minDistance: 20,
    maxDistance: 25,
    tries: 10
});
```

```js
// Poisson disk sampling in a 2D square using
// a custom function to drive the distance between each point
var pds = new PoissonDiskSampling({
    shape: [400, 400],
    minDistance: 4,
    maxDistance: 20,
    tries: 20,
    distanceFunction: function (point) {
        return point[0] / 400;
    },
    bias: 0
});
```

### Method

**pds.fill()**

Fill the grid with random points following the distance constraint.

Returns the entirety of the points in the grid as an array of coordinate arrays. The points are sorted in their generation order.

```js
var points = pds.fill();

console.log(points[0]);
// prints something like [30, 16]
```

**pds.getAllPoints()**

Get all the points present in the grid without trying to generate any new points.

Returns the entirety of the points in the grid as an array of coordinate arrays. The points are sorted in their generation order.

```js
var points = pds.getAllPoints();

console.log(points[0]);
// prints something like [30, 16]
```

**pds.getAllPointsWithDistance()**

Get all the points present in the grid along with the result of the distance function.

Returns the entirety of the points in the grid as an array of coordinate + distance function result arrays. The points are sorted in their generation order.

Calling this method on an instance of PoissonDiskSampling without a distanceFunction will throw an error.

```js
var points = pds.getAllPointsWithDistance();

console.log(points[0]);
// prints something like [30, 16, 0.4], 0.4 being the result of the distance function
```

**pds.addRandomPoint()**

Add a completely random point to the grid. There won't be any check on the distance constraint with the other points already present in the grid.

Returns the point as a coordinate array.

**pds.addPoint(point)**

- *point :* Point represented as a coordinate array.

Add an arbitrary point to the grid. There won't be any check on the distance constraint with the other points already present in the grid.

Returns the point added to the grid.

If the point given is not of the correct dimension (i.e. inserting a 2D point in a 3D grid) or doesn't fit in the grid size, null will be returned.

```js
pds.addPoint([20, 30, 40]);
```

**pds.next()**

Try to generate a new point in the grid following the distance constraint.

Returns a coordinate array when a point is generated, null otherwise.

```js
var point;

while(point = pds.next()) {
    console.log(point); // [x, y, z]
}
```

**pds.reset()**

Reinitialize the grid as well as the internal state.

When doing multiple samplings in the same grid, it is preferable to reuse the same instance of PoissonDiskSampling instead of creating a new one for each sampling.

## Usages in the wild

 * Image-based point clouds by Dmitri Cherniak: [#1](https://twitter.com/dmitricherniak/status/1348039557523116037) / [#2](https://twitter.com/dmitricherniak/status/1348065708333273090)
 * Creative Experiments by Lionel Radisson: [#1](https://twitter.com/MAKIO135/status/1225665997341749248) / [#2](https://twitter.com/MAKIO135/status/1224948519871696901)
 * ["Poisson disc squares", by Matt DesLauriers](https://twitter.com/mattdesl/status/973197660617355269)
 * [Mapgen4, a procedural wilderness map generator by Amit Patel](https://github.com/redblobgames/mapgen4)
 * [stsmapgen, a Slay the Spire-inspired procedural map generator by torin](https://github.com/yurkth/stsmapgen)

## Implementation notes

Internally, there are two different implementations of the algorithm. The implementation is chosen depending on whether a distanceFunction is passed to the constructor. The library is designed in such a way as to keep it transparent to the end user.

In order to reduce the impact of this dependency on the size of the javascript bundle(s) in web projects, it is possible to explicitly require a given implementation.

```
var PoissonDiskSampling = require('poisson-disk-sampling/src/implementations/fixed-density');
```

or

```
var PoissonDiskSampling = require('poisson-disk-sampling/src/implementations/variable-density');
```

## TypeScript definitions

TypeScripts definitions (`.d.ts`) provided by [Aliyss](https://github.com/Aliyss) are available through DefinitelyTyped. They can be installed locally using the following commands:

```
npm install --save-dev @types/poisson-disk-sampling
```

or

```
yarn add @types/poisson-disk-sampling --dev
```

## History

### [2.3.1](https://github.com/kchapelier/poisson-disk-sampling/tree/2.3.1) (2022-06-05) :

- Slightly better performances and point density when working with a large shape

### [2.3.0](https://github.com/kchapelier/poisson-disk-sampling/tree/2.3.0) (2022-05-21) :

- Fix addPoint() erroneously accepting points on the outer bounds of the shape
- Update dev dependencies

### [2.2.3](https://github.com/kchapelier/poisson-disk-sampling/tree/2.2.3) (2022-02-26) :

- Fix outdated CDN builds, no actual changes to the code provided through npm

### [2.2.2](https://github.com/kchapelier/poisson-disk-sampling/tree/2.2.2) (2020-05-25) :

- Minor performance-related tweaks for 3D and higher dimensions
- Fix an issue causing the points to be generated in the [0, size-1] range instead of the [0, size) range

### [2.2.1](https://github.com/kchapelier/poisson-disk-sampling/tree/2.2.1) (2020-05-11) :

- Minor performance-related tweaks
- Update dev dependencies

### [2.2.0](https://github.com/kchapelier/poisson-disk-sampling/tree/2.2.0) (2020-02-17) :

- Do not ignore distanceFunction anymore if minDistance and maxDistance are equal
- Make it possible to explicitly require a specific implementation

### [2.1.0](https://github.com/kchapelier/poisson-disk-sampling/tree/2.1.0) (2020-02-10) :

*Due to an [issue](https://status.npmjs.org/incidents/1dpd0zjyhj2v?u=3q2zbsynvt3t) on npmjs.com this version was not listed on the website even though it was available through the CLI.*

- Implement getAllPointsWithDistance()
- Add a test suite for the variable density implementation
- Fix an issue where the actual minDistance could be larger than the one set by the user in the variable density implementation

### [2.0.0](https://github.com/kchapelier/poisson-disk-sampling/tree/2.0.0) (2020-02-03) :

- Support distance function / variable density
- Change constructor signature, the rest of the public API is unchanged

### [1.0.6](https://github.com/kchapelier/poisson-disk-sampling/tree/1.0.6) (2019-09-28) :

- Update dev dependencies

### 1.0.5 (2019-05-27) :

- Fix package on npm (adding missing file)

### 1.0.4 (2019-05-27) :

- Replace ndarray with a leaner custom implementation to drastically reduce the size of the package (~50%)
- Update dev dependencies

### 1.0.3 (2019-01-12) :

- Update dev dependencies
- Change node versions tested with travis

### 1.0.2 (2017-09-30) :

- Minor performance tweaks
- Reduce npm package size
- Update `moore` dep
- Add benchmark script

### 1.0.1 (2017-01-06) :

- Add some checks on the points added with addPoint()
- Implements tests
- Add travis support

### 1.0.0 (2016-09-16) :

- Implement `getAllPoints()` and `reset()`
- Fix incorrect handling of `maxDistance` when it is not set
- Fix incorrect behavior when `fill()` is called several times
- Declare the public API stable
- API documentation
- Remove `mathp` dependency

### 0.0.1 (2015-11-28) :

- First release

## How to contribute ?

For new features and other enhancements, please make sure to contact me beforehand, either on [Twitter](https://twitter.com/kchplr) or through an issue on Github.

## License

MIT
