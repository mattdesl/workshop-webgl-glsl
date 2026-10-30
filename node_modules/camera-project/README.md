# camera-project

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Projects a 3D world point into 2D window space. 

```js
var mat4 = require('gl-mat4')
var project = require('camera-project')

//projection * view matrix
var combinedProjView = mat4.multiply([], projection, view)

//viewport bounds
var viewport = [x, y, width, height]

//3D world point
var point = [0, -1, 2.5]

//vec4 output
var output = []

project(output, point, viewport, combinedProjView)
```

The output `z` component contains the window space depth, and `w` is the value of `(1 / clip.w)`. Assumes [depth range](https://www.opengl.org/wiki/GLAPI/glDepthRange) is 0 to 1.

## Usage

[![NPM](https://nodei.co/npm/camera-project.png)](https://www.npmjs.com/package/camera-project)

#### `vec4 = project(out, point, viewport, combined)`

Projects the 3D `point` into window space using the `viewport` bounds (screen x, y, width, height) and `combined` matrix (result of multiplying `projection * view` matrices). 

The result is stored in `out` and returned.

## See Also

- [camera-unproject](https://www.npmjs.com/package/camera-unproject)

## License

MIT, see [LICENSE.md](http://github.com/Jam3/camera-project/blob/master/LICENSE.md) for details.
