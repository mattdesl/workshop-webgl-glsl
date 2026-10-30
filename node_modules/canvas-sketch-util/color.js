var cssColor = require('./lib/css-color');
var names = require('./lib/css-color-names.json');
var rgbLuminance = require('./lib/relative-luminance');
var HSLUtil = require('./lib/hsl');
var hexToRGBA = require('./lib/hex-to-rgba');
var RGBAToHex = require('./lib/rgba-to-hex');

module.exports.parse = cssColor.parse;
module.exports.style = cssColor.style;
module.exports.names = names;

module.exports.relativeLuminance = function relativeLuminance (color) {
  var result = module.exports.parse(color);
  if (!result) return null;
  return rgbLuminance(result.rgb);
};

// Extracted from @tmcw / wcag-contrast
// https://github.com/tmcw/wcag-contrast
module.exports.contrastRatio = function contrastRatio (colorA, colorB) {
  var a = module.exports.relativeLuminance(colorA);
  var b = module.exports.relativeLuminance(colorB);
  if (a == null || b == null) return null;
  var l1 = Math.max(a, b);
  var l2 = Math.min(a, b);
  return (l1 + 0.05) / (l2 + 0.05);
};

module.exports.offsetHSL = function (color, h, s, l) {
  var result = module.exports.parse(color);
  if (!result) return null;
  result.hsla[0] += h || 0;
  result.hsla[1] = Math.max(0, Math.min(100, result.hsla[1] + (s || 0)));
  result.hsla[2] = Math.max(0, Math.min(100, result.hsla[2] + (l || 0)));
  return module.exports.parse({ hsla: result.hsla });
};

module.exports.blend = function (background, foreground, opacity) {
  var bg = module.exports.parse(background);
  var fg = module.exports.parse(foreground);
  if (bg == null || fg == null) return null;

  var c0 = bg.rgba;
  var c1 = fg.rgba;
  opacity = typeof opacity === 'number' && isFinite(opacity) ? opacity : 1.0;
  var alpha = opacity * c1[3];
  if (alpha >= 1) {
    // foreground is opaque so no blend required
    return fg;
  }
  for (var i = 0; i < 3; i++) {
    c1[i] = c1[i] * alpha + c0[i] * (c0[3] * (1 - alpha));
  }
  c1[3] = Math.max(0, Math.min(1, alpha + c0[3] * (1 - alpha)));
  return module.exports.parse(c1); // re-parse to get new metadata
};

// Exposed but not yet documented
module.exports.hexToRGBA = hexToRGBA;
module.exports.RGBAToHex = RGBAToHex;
module.exports.RGBAToHSLA = HSLUtil.RGBAToHSLA;
module.exports.HSLAToRGBA = HSLUtil.HSLAToRGBA;
