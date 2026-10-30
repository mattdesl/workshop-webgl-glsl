module.exports = triangleCentroid
function triangleCentroid (triangle) {
  if (triangle.length !== 3) {
    throw new TypeError('must provide triangle array of length 3')
  }

  var dimension = triangle[0].length
  var result = new Array(dimension)
  for (var i = 0; i < dimension; i++) {
    var t0 = triangle[0][i]
    var t1 = triangle[1][i]
    var t2 = triangle[2][i]
    result[i] = (t0 + t1 + t2) / 3
  }
  return result
}
