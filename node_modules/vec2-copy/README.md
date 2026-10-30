# vec2-copy

[![frozen](http://badges.github.io/stability-badges/dist/frozen.svg)](http://github.com/badges/stability-badges)

A common function to copy values from one vec2 array to another.

This will eventually be replaced in a backward-compatible manner by `require('gl-vec2/copy')`

```js
var tmp = [0, 0]
var other = [25, 25]
console.log( copy(tmp, other) )
//prints [25, 25]
```

## Usage

[![NPM](https://nodei.co/npm/vec2-copy.png)](https://nodei.co/npm/vec2-copy/)

#### `copy(out, vec)`

Copies the first two elements in `vec` to the first two elements in `out`, and returns `out`. 

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/vec2-copy/blob/master/LICENSE.md) for details.
