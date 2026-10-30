# Euclidean Distance [![Build Status](https://travis-ci.org/zeke/euclidean-distance.png?branch=master)](https://travis-ci.org/zeke/euclidean-distance)

euclidean-distance is a [browserify](https://github.com/substack/node-browserify#browserify)-friendly npm module
for calculating the [Euclidean distance](http://en.wikipedia.org/wiki/Euclidean_distance#Three_dimensions)

between two vectors in n-dimensional space.

<img src="http://upload.wikimedia.org/math/a/0/5/a056c1b3e4b1c72be81acf62b9e574ca.png">

## Installation

```
npm install euclidean-distance --save
```

## Usage

```js
var distance = require('euclidean-distance')

distance([0,0], [1,0])
// 1

distance([0,0], [3,2])
// 3.605551275463989

distance([-7,-4,3], [17, 6, 2.5])
// 26.004807247892

distance([5,13,17,3,25,21,7,1], [20,26,7,5,28,3,23,10])
// 34.17601498127012
```

For [some purposes](https://github.com/zeke/euclidean-distance/issues/3) you may actually be looking for the square of the distance. For that, you can use:

```js
var distanceSquared = require('euclidean-distance/squared')

distanceSquared([0,0], [2,0])
// 4
```

## Test

```
npm test
```

## License

[WTFPL](http://wtfpl.org/)
