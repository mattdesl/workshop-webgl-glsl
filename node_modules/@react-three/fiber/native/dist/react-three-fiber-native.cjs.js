'use strict';

if (process.env.NODE_ENV === "production") {
  module.exports = require("./react-three-fiber-native.cjs.prod.js");
} else {
  module.exports = require("./react-three-fiber-native.cjs.dev.js");
}
