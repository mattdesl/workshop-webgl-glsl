# triangle-centroid

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Computes the centroid or "center of gravity" of a triangle. The vectors can be 2D, 3D or n-dimensional.

## Example

```js
var centroid = require('triangle-centroid')

var tri = [
  [10, 0, -4],
  [20, 2, 24],
  [30, 1, 4]
]

centroid(tri)
// -> [20, 1, 8]
```

## Usage

[![NPM](https://nodei.co/npm/triangle-centroid.png)](https://www.npmjs.com/package/triangle-centroid)

#### `centroid = triangleCentroid(triangle)`

For the given `triangle`, an array of 3 vectors, computes the centroid or "center of gravity". 

Returns a new vector with the same dimension as the first point in `triangle`. 

## See Also

- [triangle-incenter](https://www.npmjs.com/package/triangle-incenter)
- [circumcenter](https://www.npmjs.com/package/circumcenter)

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/triangle-centroid/blob/master/LICENSE.md) for details.
