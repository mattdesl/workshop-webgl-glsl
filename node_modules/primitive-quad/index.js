module.exports = primitiveQuad

function primitiveQuad (scale) {
  scale = typeof scale !== 'undefined' ? scale : 1
  if (!Array.isArray(scale)) {
    scale = [scale, scale]
  }

  var positions = [
    [-scale[0], -scale[1], 0],
    [scale[0], -scale[1], 0],
    [scale[0], scale[1], 0],
    [-scale[0], scale[1], 0]
  ]
  var cells = [
    [0, 1, 2],
    [2, 3, 0]
  ]
  var uvs = [[0, 0], [1, 0], [1, 1], [0, 1]]
  var n = [0, 0, -1]
  var normals = [ n.slice(), n.slice(), n.slice(), n.slice() ]
  return {
    positions: positions,
    cells: cells,
    uvs: uvs,
    normals: normals
  }
}
