# moore

A little module for generating Moore neighborhoods (i.e. the surrounding cells
of a single cell in a grid) of arbitrary range and dimensions. Or, the blue
squares for a red square:

[![moore](http://i.imgur.com/BEA7pxu.jpg)](http://www.dis.anl.gov/news/HydrogenTransitionModeling.html)

## Installation ##

``` bash
npm install moore
```

## Usage ##

### `require('moore')(range, dimensions)` ###

Takes two arguments, returning an array of relative coordinates.

* `range` determines how large the neighborhood extends, and defaults to 1.
* `dimensions` determines how many dimensions the Moore neighborhood
  covers - i.e. 2 will return the results for a 2D grid, and 3 will return the
  results for a 3D grid. May be any value above zero.

``` javascript
var moore = require('moore')

// 2D, 1 range:
moore(1, 2) === [
  [-1,-1], [ 0,-1], [ 1,-1],
  [-1, 0],          [ 1, 0],
  [-1, 1], [ 0, 1], [ 1, 1],
]
```
