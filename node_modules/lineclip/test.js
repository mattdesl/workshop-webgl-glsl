'use strict';

var test = require('tap').test;
var clip = require('./');

test('clips line', function (t) {
    var result = clip([
        [-10, 10], [10, 10], [10, -10], [20, -10], [20, 10], [40, 10],
        [40, 20], [20, 20], [20, 40], [10, 40], [10, 20], [5, 20], [-10, 20]],
        [0, 0, 30, 30]);

    t.same(result, [
        [[0, 10], [10, 10], [10, 0]],
        [[20, 0], [20, 10], [30, 10]],
        [[30, 20], [20, 20], [20, 30]],
        [[10, 30], [10, 20], [5, 20], [0, 20]]
    ]);

    t.end();
});

test('clips line crossing through many times', function (t) {
    var result = clip(
        [[10, -10], [10, 30], [20, 30], [20, -10]],
        [0, 0, 20, 20]);

    t.same(result, [
        [[10, 0], [10, 20]],
        [[20, 20], [20, 0]]
    ]);

    t.end();
});

test('clips polygon', function (t) {
    var result = clip.polygon([[-10, 10], [0, 10], [10, 10], [10, 5], [10, -5], [10, -10], [20, -10],
        [20, 10], [40, 10], [40, 20], [20, 20], [20, 40], [10, 40], [10, 20], [5, 20], [-10, 20]],
        [0, 0, 30, 30]);

    t.same(result, [[0, 10], [0, 10], [10, 10], [10, 5], [10, 0], [20, 0], [20, 10], [30, 10],
        [30, 20], [20, 20], [20, 30], [10, 30], [10, 20], [5, 20], [0, 20]]);

    t.end();
});

test('appends result if passed third argument', function (t) {
    var arr = [];
    var result = clip([[-10, 10], [30, 10]], [0, 0, 20, 20], arr);

    t.same(result, [[[0, 10], [20, 10]]]);
    t.equal(result, arr);

    t.end();
});

test('clips floating point lines', function (t) {
    var line = [
        [-86.66015624999999, 42.22851735620852], [-81.474609375, 38.51378825951165], [-85.517578125, 37.125286284966776],
        [-85.8251953125, 38.95940879245423], [-90.087890625, 39.53793974517628], [-91.93359375, 42.32606244456202],
        [-86.66015624999999, 42.22851735620852]];

    var bbox = [-91.93359375, 42.29356419217009, -91.7578125, 42.42345651793831];

    var result = clip(line, bbox);

    t.same(result, [[
        [-91.91208030440808, 42.29356419217009],
        [-91.93359375, 42.32606244456202],
        [-91.7578125, 42.3228109416169]
    ]]);

    t.end();
});

test('preserves line if no protrusions exist', function (t) {
    var result = clip([
        [1, 1], [2, 2], [3, 3]],
        [0, 0, 30, 30]);

    t.same(result, [
        [[1, 1], [2, 2], [3, 3]]
    ]);

    t.end();
});

test('clips without leaving empty parts', function (t) {
    var result = clip([
        [40, 40], [50, 50]],
        [0, 0, 30, 30]);

    t.same(result, []);

    t.end();
});

test('still works when polygon never crosses bbox', function (t) {
    var result = clip.polygon([
        [3, 3], [5, 3], [5, 5], [3, 5], [3, 3]],
        [0, 0, 2, 2]);

    t.same(result, []);

    t.end();
});
