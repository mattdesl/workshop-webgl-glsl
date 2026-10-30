var transformMat4 = require('gl-vec4/transformMat4')
var set = require('gl-vec4/set')

var NEAR_RANGE = 0
var FAR_RANGE = 1
var tmp4 = [0, 0, 0, 0]

module.exports = cameraProject
function cameraProject (out, vec, viewport, combinedProjView) {
  var vX = viewport[0],
    vY = viewport[1],
    vWidth = viewport[2],
    vHeight = viewport[3],
    n = NEAR_RANGE,
    f = FAR_RANGE

  // convert: clip space -> NDC -> window coords
  // implicit 1.0 for w component
  set(tmp4, vec[0], vec[1], vec[2], 1.0)

  // transform into clip space
  transformMat4(tmp4, tmp4, combinedProjView)

  // now transform into NDC
  var w = tmp4[3]
  if (w !== 0) { // how to handle infinity here?
    tmp4[0] = tmp4[0] / w
    tmp4[1] = tmp4[1] / w
    tmp4[2] = tmp4[2] / w
  }

  // and finally into window coordinates
  // the foruth component is (1/clip.w)
  // which is the same as gl_FragCoord.w
  out[0] = vX + vWidth / 2 * tmp4[0] + (0 + vWidth / 2)
  out[1] = vY + vHeight / 2 * tmp4[1] + (0 + vHeight / 2)
  out[2] = (f - n) / 2 * tmp4[2] + (f + n) / 2
  out[3] = w === 0 ? 0 : 1 / w
  return out
}
