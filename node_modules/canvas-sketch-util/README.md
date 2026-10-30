# canvas-sketch-util

Utilities for generative art in Canvas, WebGL and JavaScript.

This is designed to be used alongside the [canvas-sketch](https://github.com/mattdesl/canvas-sketch/) toolset, but it is generic enough to work for various Node.js/Browser use cases.

## Example

You can require each module individually, and grab only the necessary functions.

Some examples:

```js
const math = require('canvas-sketch-util/math');

console.log(math.clamp(1.25, 0, 1));
// 1
```

Or by using destructuring to grab only a select few functions:

```js
const { fract, lerp } = require('canvas-sketch-util/math');

console.log(fract(51.23));
// 0.23

console.log(lerp(0, 50, 0.5));
// 25
```

The `random` utility has been inspired by Unity3D, as well as other engines.

```js
const random = require('canvas-sketch-util/random');

console.log(random.value());
// some random number between 0 (inclusive) and 1 (exclusive)

// Create a seeded random generator
const seeded = random.createRandom(25);

console.log(seeded.range(25, 50));
// some deterministic random number

console.log(seeded.shuffle([ 'a', 'b', 'c' ]));
// deterministically shuffles a copy of the array
```

## Features

The following modules have been implemented:

- [`math`](./docs/math.md) - Math & interpolation utilities
- [`random`](./docs/random.md) - A random number generator
- [`color`](./docs/color.md) - RGB and HSL color utilities
- [`geometry`](./docs/geometry.md) - Utilities for geometry & shapes
- [`penplot`](./docs/penplot.md) - Utilities for working with pen plotters (e.g. AxiDraw)
- [`shader`](./docs/shader.md) - A full-screen GLSL shader utility

The following are planned but not yet implemented:

- `tween` - Tweening, easing & animation utilities

And more to come...

## Install

Use [npm](https://npmjs.com/) to install.

```sh
npm install canvas-sketch-util --save
```

## Docs

For full API documentation, see [Documentation](./docs/README.md).

You can also see a few examples in [./test/examples.js](./test/examples.js).

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/canvas-sketch-util/blob/master/LICENSE.md) for details.
