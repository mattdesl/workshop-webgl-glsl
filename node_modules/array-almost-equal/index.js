var isArray = require('an-array')
var almost = require('almost-equal')

//determines whether two arrays are almost equal
module.exports = function(a, b, absoluteTolerance, relativeTolerance) {
    //will accept typed arrays
    if (!a || !b || !isArray(a) || !isArray(b))
        return false
    if (a.length !== b.length)
        return false
    if (typeof absoluteTolerance !== 'number')
        absoluteTolerance = almost.FLT_EPSILON
    if (typeof relativeTolerance !== 'number')
        relativeTolerance = absoluteTolerance

    return Array.prototype.slice.call(a).every(function(a0, i) {
        var b0 = b[i]
        return a0 === b0 || almost(a0, b0, absoluteTolerance, relativeTolerance)
    })
}