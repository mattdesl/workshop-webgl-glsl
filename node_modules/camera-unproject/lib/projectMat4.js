module.exports = project

/**
 * Multiplies the input vec by the specified matrix, 
 * applying a W divide, and stores the result in out 
 * vector. This is useful for projection,
 * e.g. unprojecting a 2D point into 3D space.
 *
 * @method  prj
 * @param {vec3} out the output vector
 * @param {vec3} vec the input vector to project
 * @param {mat4} m the 4x4 matrix to multiply with 
 * @return {vec3} the out vector
 */
function project (out, vec, m) {
  var x = vec[0],
    y = vec[1],
    z = vec[2],
    a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3],
    a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7],
    a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11],
    a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15]

  var lw = 1 / (x * a03 + y * a13 + z * a23 + a33)

  out[0] = (x * a00 + y * a10 + z * a20 + a30) * lw
  out[1] = (x * a01 + y * a11 + z * a21 + a31) * lw
  out[2] = (x * a02 + y * a12 + z * a22 + a32) * lw
  return out
}
