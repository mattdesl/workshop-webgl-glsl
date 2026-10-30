# float-rgb2hsl

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Converts [R,G,B] to [H,S,L]. 

```js
var rgb2hsl = require('float-rgb2hsl')

var rgb = [0.375, 0.625, 0.625]

var hsl = rgb2hsl(rgb)
// -> [0.5, 0.25, 0.5]
```

All input/output uses the range [0 .. 1] for consistency and composition with other modules.

## Usage

[![NPM](https://nodei.co/npm/float-rgb2hsl.png)](https://www.npmjs.com/package/float-rgb2hsl)

#### `hsl = rgb2hsl(rgb)`

Takes the `rgb` float array `[R, G, B]` and returns a `[H, S, L]` float representation.

## Motivation

This was adapted from @harthur's wonderful [color-convert](https://github.com/harthur/color-convert) module. Often I found myself only needing one function rather than all of them, and consistent input/output lends well to composition with other modules and WebGL. 

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/float-rgb2hsl/blob/master/LICENSE.md) for details.
