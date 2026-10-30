"use strict";

// sphere-random module by Mikola Lysenko under the MIT License
// waiting for https://github.com/scijs/sphere-random/pull/1 to be merged

module.exports = sampleSphere;

/**
 * @param {int} d Dimensions
 * @param {Function} rng
 * @returns {Array}
 */
function sampleSphere(d, rng) {
    var v = new Array(d),
        d2 = Math.floor(d/2) << 1,
        r2 = 0.0,
        rr,
        r,
        theta,
        h,
        i;

    for (i = 0; i < d2; i += 2) {
        rr = -2.0 * Math.log(rng());
        r =  Math.sqrt(rr);
        theta = 2.0 * Math.PI * rng();

        r2+= rr;
        v[i] = r * Math.cos(theta);
        v[i+1] = r * Math.sin(theta);
    }

    if (d % 2) {
        var x = Math.sqrt(-2.0 * Math.log(rng())) * Math.cos(2.0 * Math.PI * rng());
        v[d - 1] = x;
        r2+= Math.pow(x, 2);
    }

    h = 1.0 / Math.sqrt(r2);

    for (i = 0; i < d; ++i) {
        v[i] *= h;
    }

    return v;
}
