# float-hsl2rgb

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Converts [H,S,L] to [R,G,B]. 

```js
var hsl2rgb = require('float-hsl2rgb')

var hsl = [180/360, 0.25, 0.50]

var rgb = hsl2rgb(hsl)
// -> [0.375, 0.625, 0.625]
```

All input/output uses the range [0 .. 1] for consistency and composition with other modules.

## Usage

[![NPM](https://nodei.co/npm/float-hsl2rgb.png)](https://www.npmjs.com/package/float-hsl2rgb)

#### `rgb = hsl2rgb(hsl)`

Takes the `hsl` float array `[H, S, L]` and returns an `[R, G, B]` float representation.

## Motivation

This was adapted from @harthur's wonderful [color-convert](https://github.com/harthur/color-convert) module. Often I found myself only needing one function rather than all of them, and consistent input/output lends well to composition with other modules and WebGL. 

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/float-hsl2rgb/blob/master/LICENSE.md) for details.
