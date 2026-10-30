'use strict';

var Suite = require('benchmark').Suite;
var lineclip = require('./');

var line = [[-10, 10], [0, 10], [10, 10], [10, 5], [10, -5], [10, -10], [20, -10], [20, 10], [40, 10],
    [40, 20], [20, 20], [20, 40], [10, 40], [10, 20], [5, 20], [-10, 20]];

var bbox = [0, 0, 30, 30];

new Suite()
.add('polyline', function () {
    lineclip(line, bbox);
})
.add('polygon', function () {
    lineclip.polygon(line, bbox);
})
.on('cycle', function(event) {
    console.log(event.target.toString());
})
.on('error', function(e) {
    throw e.target.error;
})
.run();
