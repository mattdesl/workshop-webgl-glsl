# array-almost-equal

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

Tests whether two arrays are almost equal; that is, any numbers are within a certain epsilon.

```js
var almostEqual = require('array-almost-equal')

//defaults to float epsilon
almostEqual(['foo', 1, 1], ['foo', 1, 1 + 1e-12]) // true
almostEqual(['bar', 2], ['foo', 2]) // false

//custom epsilon
almostEqual(['foo', 1, 0.0025], ['foo', 1, 0.0026], 0.01) // true
```

## Usage

[![NPM](https://nodei.co/npm/array-almost-equal.png)](https://www.npmjs.com/package/array-almost-equal)

#### `almostEqual(a, b[, epsilon[, relativeTolerance]])`

Tests whether `a` and `b` are arrays (or typed arrays), equal length, and all elements are strictly equal *or* numbers are almost equal. 

`epsilon` defaults to [FLT_EPSILON](https://github.com/mikolalysenko/almost-equal/blob/master/almost_equal.js). `relativeTolerance` defaults to `epsilon` if not specified. 

## License

MIT, see [LICENSE.md](http://github.com/Jam3/array-almost-equal/blob/master/LICENSE.md) for details.
