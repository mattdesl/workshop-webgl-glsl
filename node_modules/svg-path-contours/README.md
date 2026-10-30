# svg-path-contours

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Approximates an SVG path into a discrete list of 2D contours (polylines). This is useful for collision detection, intersection, triangulation & WebGL rendering, etc. It does not attempt to clean or optimize the discretized points. 

![img](http://i.imgur.com/cqXtuQa.png)

Usage:

```js
var parse = require('parse-svg-path')
var contours = require('svg-path-contours')

var path = 'm10,10C45.812,24.024,45.673,24,45.529,24H31.625
   c0.482-3.325,6.464-2.758,8.913-3.155z'

var result = contours(parse(path))

/* 
[ 
 [ [10,10], ...etc ]
 [ [x, y], ... ]
]
*/
```

Triangulation example:

```js
var parse = require('parse-svg-path')
var simplify = require('simplify-path')
var contours = require('svg-path-contours')
var triangulate = require('triangulate-contours')

//get a list of polylines/contours from svg contents
var lines = contours(parse(path))

//simplify the contours before triangulation
lines = lines.map(function(path) {
    return simplify(path, threshold)
})

//turns into triangles, returns { positions, cells }
var shape = triangulate(lines)

//now draw the simplicial complex with Canvas/WebGL/etc
```

See [demo/index.js](demo/index.js) for exmaple.

## Usage

[![NPM](https://nodei.co/npm/svg-path-contours.png)](https://nodei.co/npm/svg-path-contours/)

#### `contours(svg)`

Takes parsed SVG contents from [parse-svg-path](https://nodei.co/npm/parse-svg-path/) and produces a list of 2D polylines representing the contours of the shape.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/svg-path-contours/blob/master/LICENSE.md) for details.
