var floatHSL2RGB = require('float-hsl2rgb');
var floatRGB2HSL = require('float-rgb2hsl');
var wrap = require('./wrap');

module.exports.RGBAToHSLA = RGBAToHSLA;
function RGBAToHSLA (rgba) {
  var floatHSL = floatRGB2HSL([ rgba[0] / 255, rgba[1] / 255, rgba[2] / 255 ]);
  return [
    Math.max(0, Math.min(360, Math.round(floatHSL[0] * 360))),
    Math.max(0, Math.min(100, Math.round(floatHSL[1] * 100))),
    Math.max(0, Math.min(100, Math.round(floatHSL[2] * 100))),
    rgba[3]
  ];
}

module.exports.HSLAToRGBA = HSLAToRGBA;
function HSLAToRGBA (hsla) {
  var hue = wrap(hsla[0], 0, 360);
  var floatRGB = floatHSL2RGB([ hue / 360, hsla[1] / 100, hsla[2] / 100 ]);
  return [
    Math.max(0, Math.min(255, Math.round(floatRGB[0] * 255))),
    Math.max(0, Math.min(255, Math.round(floatRGB[1] * 255))),
    Math.max(0, Math.min(255, Math.round(floatRGB[2] * 255))),
    hsla[3]
  ];
}
