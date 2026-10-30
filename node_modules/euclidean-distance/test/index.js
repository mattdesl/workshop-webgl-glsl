var assert = require('assert')
var distance = require('..')
var squared = require('../squared')

describe('euclidean-distance', function () {
  describe('2d', function () {
    it('returns 1 when points are 1 unit away', function () {
      assert.equal(1, distance([0, 0], [1, 0]))
    })

    it('works with non-parallel points', function () {
      var d = distance([0, 0], [3, 2]) // 3.605551275463989
      assert.equal(360, Math.floor(d * 100))
    })

    it('handles with non-parallel points', function () {
      var d = distance([-1, 0], [2, 2]) // 3.605551275463989
      assert.equal(360, Math.floor(d * 100))
    })

    it('returns 0 when points are the same', function () {
      assert.equal(0, distance([3, 5], [3, 5]))
    })

  })

  describe('3d', function () {
    it('returns 1 when points are 1 unit away', function () {
      assert.equal(1, distance([0, 0, 0], [1, 0, 0]))
    })

    // http://www.calculatorsoup.com/calculators/geometry-solids/distance-two-points.php
    it("works with numbers I didn't make up", function () {
      assert.equal(26, Math.floor(distance([-7, -4, 3], [17, 6, 2.5])))
    })

  })

  describe('square', function () {
    it('returns the square of the distance', function () {
      var a = [0, 0, 0]
      var b = [1, 0, 0]
      var c = [2, 0, 0]

      assert.equal(1, distance(a,b))
      assert.equal(1, squared(a,b))

      assert.equal(2, distance(a,c))
      assert.equal(4, squared(a,c))
    })
  })

})
