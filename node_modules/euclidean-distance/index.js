// http://en.wikipedia.org/wiki/Euclidean_distance#Three_dimensions

var distanceSquared = require('./squared')

module.exports = function (a, b) {
  return Math.sqrt(distanceSquared(a,b))
}
