module.exports = hexToRGBA;
function hexToRGBA (str) {
  if (typeof str !== 'string') {
    throw new TypeError('Hex code parsing must be performed on a string parameter');
  }

  str = str.toLowerCase();

  if (!/^#[a-f0-9]+$/.test(str)) {
    return null;
  }

  var hex = str.replace(/^#/, '');
  var alpha = 1;

  if (hex.length === 8) {
    alpha = parseInt(hex.slice(6, 8), 16) / 255;
    hex = hex.slice(0, 6);
  }

  if (hex.length === 4) {
    alpha = parseInt(hex.slice(3, 4).repeat(2), 16) / 255;
    hex = hex.slice(0, 3);
  }

  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  var num = parseInt(hex, 16);
  var red = num >> 16;
  var green = (num >> 8) & 255;
  var blue = num & 255;

  return [ red, green, blue, alpha ];
}
