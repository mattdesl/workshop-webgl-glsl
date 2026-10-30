# camera-unproject

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Unprojects a 2D screen space point into 3D space using the inverse of your camera's combined matrix.

```js
var mat4 = require('gl-mat4')
var unproject = require('camera-unproject')

//projection * view matrix
var combinedProjView = mat4.multiply([], projection, view)

//now invert it
var invProjView = mat4.invert([], combinedProjView)

//viewport bounds
var viewport = [x, y, width, height]

//2D point in screen space
//z=0 means "near plane"
var point = [123, 52, 0]

//vec3 output
var output = []

unproject(output, point, viewport, invProjView)
```

## Usage

[![NPM](https://nodei.co/npm/camera-unproject.png)](https://www.npmjs.com/package/camera-unproject)

#### `vec3 = unproject(out, point, viewport, invCombined)`

Unprojects the 2D `point` into 3D space using the `viewport` bounds (screen x, y, width, height) and `invCombined` matrix. 

Where `point` [x, y, z] uses window coordinates for XY and a range between 0.0 (near plane) and 1.0 (far plane) for Z. `invCombined` is typically the invert of the combined `projection * view` matrix for your camera. 

The `[x, y, z]` result is stored in `out` and returned.

## See Also

- [camera-project](https://www.npmjs.com/package/camera-project)

## License

MIT, see [LICENSE.md](http://github.com/Jam3/camera-unproject/blob/master/LICENSE.md) for details.
