var mesh = require('./')()

require('glo-demo-primitive')(mesh, {
  angle: Math.PI / 2,
  culling: false
}).start()
