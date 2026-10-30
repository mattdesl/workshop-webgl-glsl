# pack-spheres

Brute force circle/sphere packing in 2D or 3D.

<img src="https://raw.githubusercontent.com/mattdesl/pack-spheres/master/demos/2d.png" width="20%" /><img src="https://raw.githubusercontent.com/mattdesl/pack-spheres/master/demos/2d-circle.png" width="20%" /><img src="https://raw.githubusercontent.com/mattdesl/pack-spheres/master/demos/3d.png" width="20%" />

See [./demos](./demos) for examples.

```js
const pack = require('pack-spheres');

const circles = pack({
  dimensions: 2,
  packAttempts: 500,
  maxCount: 1000,
  minRadius: 0.05,
  maxRadius: 0.5,
  padding: 0.0025
});

console.log('Got %d circles', circles.length);
console.log(circles[0].position, circles[0].radius);
```

Returns an array of objects with normalized values between `-1.0` and `1.0`, but the algorithm works on arbitrary units (for example, you could use pixels instead).

```js
[ 
  {
    position: [ x, y, z ],
    radius: Number
  },
  ...
]
```

If you specify `{ dimensions: 2 }`, the `position` will only contain `[ x, y ]`.

The algorithm is roughly based on Tim Holman's [Circle Packing tutorial](https://generativeartistry.com/tutorials/circle-packing/), thanks Tim!

## Install

Use [npm](https://npmjs.com/) to install.

```sh
npm install pack-spheres --save
```

## Usage

#### `spheres = pack([opt])`

Packs 3D spheres (default) or 2D circles with the given options:

- `dimensions` — Can either be 3 (default) for spheres, or 2 for circles
- `bounds` — The normalized bounding box from `-1.0` to `1.0` that spheres are randomly generated within and clip to, default 1.0
- `packAttempts` — Number of attempts per sphere to pack within the space, default 500
- `maxCount` — The max number of total spheres that will be packed, default 1000 (note: you may not always reach the maxCount if all spheres could not be packed)
- `minRadius` — A number or [generator function](#generator-functions) that specifies the min (starting) radius for placed spheres (default 0.01)
- `maxRadius` — A number or [generator function](#generator-functions) that specifies the max radius a sphere will grow to (default 0.5)
- `maxGrowthSteps` — A number or[ generator function](#generator-functions) that specifies the max number of steps a sphere will grow before stopping (default Infinity)
- `padding` — A number or [generator function](#generator-functions) that specifies the padding around this sphere (default 0)

## Override Functions

You can pass in override functions to change the behaviour:

- `random` — A function that returns a 0..1 random value used by the default `sample` function, defaults to `Math.random()`
- `sample` — A function that returns a 2D or 3D vector for where a new sphere should be placed
- `outside` — A function that takes in a sphere's `(position, radius, padding)` and returns `true` if the sphere is considered to be "outside" of your virtual bounding region. Defaults to a bounding cube/box

```js
// Some utility for randomness
const Random = require('canvas-sketch-util/random');

// Generate circles in a 2D unit circle
const bounds = 1;
const shapes = pack({
  bounds,
  // Generate a random point inside a 2D circle
  sample: () => Random.insideCircle(bounds),
  // See if mag(pos - center) >= bounds
  outside: (position, radius) => {
    const length = Math.sqrt(
      position[0] * position[0] + position[1] * position[1]
    );
    return length + radius >= bounds;
  }
});
```

## Generator Functions

Instead of having all spheres start with, say, a fixed `minRadius`, you can pass a function that will get used for each new sphere being placed:

```js
// Some utility for randomness
const Random = require('canvas-sketch-util/random');

const spheres = pack({
  minRadius: () => Random.range(0, 0.5)
});
```

## Credits

Thanks to Tim Holman for his [Circle Packing tutorial](https://generativeartistry.com/tutorials/circle-packing/) which this code is roughly based on.

## License

MIT, see [LICENSE.md](http://github.com/mattdesl/pack-spheres/blob/master/LICENSE.md) for details.
