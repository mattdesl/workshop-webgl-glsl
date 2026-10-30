## lineclip

[![Build Status](https://travis-ci.org/mapbox/lineclip.svg?branch=master)](https://travis-ci.org/mapbox/lineclip)
[![Coverage Status](https://coveralls.io/repos/mapbox/lineclip/badge.svg?branch=master&service=github)](https://coveralls.io/github/mapbox/lineclip?branch=master)

A very fast JavaScript library for clipping polylines and polygons by a bounding box.

- uses [Cohen-Sutherland algorithm](https://en.wikipedia.org/wiki/Cohen%E2%80%93Sutherland_algorithm) for line clipping
- uses [Sutherland-Hodgman algorithm](https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm) for polygon clipping

```js
lineclip(
    [[-10, 10], [10, 10], [10, -10]], // line
    [0, 0, 20, 20]); // bbox
// returns [[[0, 10], [10, 10], [10, 0]]]
```


### API

#### lineclip.polyline(points, bbox[, result])

- `points` — an array of `[x, y]` points
- `bbox` — a bounding box as `[xmin, ymin, xmax, ymax]`
- `result` — an array to append the results to

Returns an array of clipped lines.

`lineclip` is an alias to `lineclip.polyline`.

#### lineclip.polygon(points, bbox)

Returns a clipped polygon.


### Install

Install with NPM:

```
npm install lineclip
```

To build a browser-compatible version, clone the repository locally, then run:

```
npm install -g browserify
browserify -s lineclip index.js > lineclip.js
```


### Changelog

#### 1.1.5 (Sep 23, 2015)

- Fixed a bug where polygon clip broke on out-of-bbox polygons.

#### 1.1.4 (Sep 22, 2015)

- Fixed a bug where last point was omitted if the last two points are in bbox.
- Fixed a bug where a line outside of bbox would produce `[[]]` instead of `[]`.

#### 1.1.3 (Sep 12, 2015)

- Fixed a polygon clipping race condition.

#### 1.1.2 (Sep 11, 2015)

- Fixed a bug that completely broke the clipping on many cases. Sorry!

#### 1.1.1 (Sep 11, 2015)

- Fixed a polyline clipping edge case.

#### 1.1.0 (Sep 11, 2015)

- Added Sutherland-Hodgeman polygon clipping (`lineclip.polygon`).

#### 1.0.1 (Sep 11, 2015)

- Minor code cleanup and optimizations.

#### 1.0.0 (Sep 8, 2015)

- Initial release.
