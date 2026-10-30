"use strict";

function tinyNDArrayOfInteger (gridShape) {
    var dimensions = gridShape.length,
        totalLength = 1,
        stride = new Array(dimensions),
        dimension;

    for (dimension = dimensions; dimension > 0; dimension--) {
        stride[dimension - 1] = totalLength;
        totalLength = totalLength * gridShape[dimension - 1];
    }

    return {
        stride: stride,
        data: new Uint32Array(totalLength)
    };
}

function tinyNDArrayOfArray (gridShape) {
    var dimensions = gridShape.length,
        totalLength = 1,
        stride = new Array(dimensions),
        data = [],
        dimension, index;

    for (dimension = dimensions; dimension > 0; dimension--) {
        stride[dimension - 1] = totalLength;
        totalLength = totalLength * gridShape[dimension - 1];
    }

    for (index = 0; index < totalLength; index++) {
        data.push([]);
    }

    return {
        stride: stride,
        data: data
    };
}

module.exports = {
    integer: tinyNDArrayOfInteger,
    array: tinyNDArrayOfArray
};