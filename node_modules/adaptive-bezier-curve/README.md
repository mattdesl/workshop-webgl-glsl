# adaptive-bezier-curve

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Builds a bezier curve that is adaptive; that is to say, it has more points along curved corners, and less points along straight lines. This can be used to produce scalable curves that are consistently smooth, while using a small number of steps. Based on [AntiGrain](http://antigrain.com/research/adaptive_bezier/).

Also see [adaptive-quadratic-curve](https://nodei.co/npm/adaptive-quadratic-curve/).

```js
var bezier = require('adaptive-bezier-curve')

var start = [20, 20],
    c1 = [100, 159],
    c2 = [50, 200],
    end = [200, 20],
    scale = 2

var points = bezier(start, c1, c2, end, scale)

//returns a list of 2d points: [ [x,y], [x,y], [x,y] ... ]
```

See [demo/index.js](demo/index.js) for an example with HTML5 canvas.

![img](http://i.imgur.com/iEQCFY3.png)

## Usage

[![NPM](https://nodei.co/npm/adaptive-bezier-curve.png)](https://nodei.co/npm/adaptive-bezier-curve/)

#### `bezier(start, c1, c2, end[, scale, points])`

Returns an adaptive bezier curve for the given four control points. You can specify a `scale` to produce better smoothing for scaled contexts, otherwise it defaults to 1.0.

If you specify a `points` array, the new points will be pushed onto that array (useful for building paths). If you don't specify `points`, a new array will be used.

## License

The AntiGrain 2.4 code is licensed under BSD-3-Clause, see [LICENSE.md](http://github.com/mattdesl/adaptive-bezier-curve/blob/master/LICENSE.md) for details.
