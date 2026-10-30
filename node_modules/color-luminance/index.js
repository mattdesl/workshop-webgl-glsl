module.exports = rec601;
module.exports.rec601 = rec601;
module.exports.rec709 = rec709;

/**
 * For the given RGB components, calculates the luminance according 
 * to Rec. 601 (PAL/NTSC) coefficients:
 *
 *   R * 0.299 + G * 0.587 + B * 0.114
 * 
 * @param  {Number} r the red component
 * @param  {Number} g the green component
 * @param  {Number} b the blue component
 * @return {Number}   the calculated luminance
 */
function rec601(r, g, b) {
    if (Array.isArray(r)) {
        var a = r;
        r = a[0];
        g = a[1];
        b = a[2];
    }
    return r * 0.299 + g * 0.587 + b * 0.114;
}

/**
 * For the given RGB components, calculates the luminance according 
 * to Rec. 709 (HDTV) coefficients:
 *
 *   R * 0.2126 + G * 0.7152 + B * 0.0722
 * 
 * @param  {Number} r the red component
 * @param  {Number} g the green component
 * @param  {Number} b the blue component
 * @return {Number}   the calculated luminance
 */
function rec709(r, g, b) {
    if (Array.isArray(r)) {
        var a = r;
        r = a[0];
        g = a[1];
        b = a[2];
    }
    return r * 0.2126 + g * 0.7152 + b * 0.0722;
}