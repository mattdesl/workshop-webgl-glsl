"use strict";

var tinyNDArray = require('./../tiny-ndarray').array,
    sphereRandom = require('./../sphere-random'),
    getNeighbourhood = require('./../neighbourhood');

/**
 * Get the euclidean distance from two points of arbitrary, but equal, dimensions
 * @param {Array} point1
 * @param {Array} point2
 * @returns {number} Euclidean distance
 */
function euclideanDistance (point1, point2) {
    var result = 0,
        i = 0;

    for (; i < point1.length; i++) {
        result += Math.pow(point1[i] - point2[i], 2);
    }

    return Math.sqrt(result);
}

/**
 * VariableDensityPDS constructor
 * @param {object} options Options
 * @param {Array} options.shape Shape of the space
 * @param {float} options.minDistance Minimum distance between each points
 * @param {float} [options.maxDistance] Maximum distance between each points, defaults to minDistance * 2
 * @param {int} [options.tries] Number of times the algorithm will try to place a point in the neighbourhood of another points, defaults to 30
 * @param {function} options.distanceFunction Function to control the distance between each point depending on their position, must return a value between 0 and 1
 * @param {float} [options.bias] When using a distanceFunction, will indicate which point constraint takes priority when evaluating two points (0 for the lowest distance, 1 for the highest distance), defaults to 0
 * @param {function|null} rng RNG function, defaults to Math.random
 * @constructor
 */
function VariableDensityPDS (options, rng) {
    if (typeof options.distanceFunction !== 'function') {
        throw new Error('PoissonDiskSampling: Tried to instantiate the variable density implementation without a distanceFunction');
    }

    this.shape = options.shape;
    this.minDistance = options.minDistance;
    this.maxDistance = options.maxDistance || options.minDistance * 2;
    this.maxTries = Math.ceil(Math.max(1, options.tries || 30));
    this.distanceFunction = options.distanceFunction;
    this.bias = Math.max(0, Math.min(1, options.bias || 0));

    this.rng = rng || Math.random;

    // to replace with floatPrecisionMitigation = Math.max(1, Math.max(...this.shape) / 64 | 0) on the next major update
    var maxShape = 0;
    for (var i = 0; i < this.shape.length; i++) {
        maxShape = Math.max(maxShape, this.shape[i]);
    }
    var floatPrecisionMitigation = Math.max(1, maxShape / 128 | 0);
    var epsilonDistance = 1e-14 * floatPrecisionMitigation;

    this.dimension = this.shape.length;
    this.minDistancePlusEpsilon = this.minDistance + epsilonDistance;
    this.deltaDistance = Math.max(0, this.maxDistance - this.minDistancePlusEpsilon);
    this.cellSize = this.maxDistance / Math.sqrt(this.dimension);

    this.neighbourhood = getNeighbourhood(this.dimension);

    this.currentPoint = null;
    this.currentDistance = 0;
    this.processList = [];
    this.samplePoints = [];
    this.sampleDistance = []; // used to store the distance for a given point

    // cache grid

    this.gridShape = [];

    for (var i = 0; i < this.dimension; i++) {
        this.gridShape.push(Math.ceil(this.shape[i] / this.cellSize));
    }

    this.grid = tinyNDArray(this.gridShape); //will store references to samplePoints and sampleDistance
}

VariableDensityPDS.prototype.shape = null;
VariableDensityPDS.prototype.dimension = null;
VariableDensityPDS.prototype.minDistance = null;
VariableDensityPDS.prototype.maxDistance = null;
VariableDensityPDS.prototype.minDistancePlusEpsilon = null;
VariableDensityPDS.prototype.deltaDistance = null;
VariableDensityPDS.prototype.cellSize = null;
VariableDensityPDS.prototype.maxTries = null;
VariableDensityPDS.prototype.distanceFunction = null;
VariableDensityPDS.prototype.bias = null;
VariableDensityPDS.prototype.rng = null;
VariableDensityPDS.prototype.neighbourhood = null;

VariableDensityPDS.prototype.currentPoint = null;
VariableDensityPDS.prototype.currentDistance = null;
VariableDensityPDS.prototype.processList = null;
VariableDensityPDS.prototype.samplePoints = null;
VariableDensityPDS.prototype.sampleDistance = null;
VariableDensityPDS.prototype.gridShape = null;
VariableDensityPDS.prototype.grid = null;

/**
 * Add a totally random point in the grid
 * @returns {Array} The point added to the grid
 */
VariableDensityPDS.prototype.addRandomPoint = function () {
    var point = new Array(this.dimension);

    for (var i = 0; i < this.dimension; i++) {
        point[i] = this.rng() * this.shape[i];
    }

    return this.directAddPoint(point);
};

/**
 * Add a given point to the grid
 * @param {Array} point Point
 * @returns {Array|null} The point added to the grid, null if the point is out of the bound or not of the correct dimension
 */
VariableDensityPDS.prototype.addPoint = function (point) {
    var dimension,
        valid = true;

    if (point.length === this.dimension) {
        for (dimension = 0; dimension < this.dimension && valid; dimension++) {
            valid = (point[dimension] >= 0 && point[dimension] < this.shape[dimension]);
        }
    } else {
        valid = false;
    }

    return valid ? this.directAddPoint(point) : null;
};

/**
 * Add a given point to the grid, without any check
 * @param {Array} point Point
 * @returns {Array} The point added to the grid
 * @protected
 */
VariableDensityPDS.prototype.directAddPoint = function (point) {
    var internalArrayIndex = 0,
        stride = this.grid.stride,
        pointIndex = this.samplePoints.length,
        dimension;

    this.processList.push(pointIndex);
    this.samplePoints.push(point);
    this.sampleDistance.push(this.distanceFunction(point));

    for (dimension = 0; dimension < this.dimension; dimension++) {
        internalArrayIndex += ((point[dimension] / this.cellSize) | 0) * stride[dimension];
    }

    this.grid.data[internalArrayIndex].push(pointIndex); // store the point reference

    return point;
};

/**
 * Check whether a given point is in the neighbourhood of existing points
 * @param {Array} point Point
 * @returns {boolean} Whether the point is in the neighbourhood of another point
 * @protected
 */
VariableDensityPDS.prototype.inNeighbourhood = function (point) {
    var dimensionNumber = this.dimension,
        stride = this.grid.stride,
        neighbourIndex,
        internalArrayIndex,
        dimension,
        currentDimensionValue,
        existingPoint,
        existingPointDistance;

    var pointDistance = this.distanceFunction(point);

    for (neighbourIndex = 0; neighbourIndex < this.neighbourhood.length; neighbourIndex++) {
        internalArrayIndex = 0;

        for (dimension = 0; dimension < dimensionNumber; dimension++) {
            currentDimensionValue = ((point[dimension] / this.cellSize) | 0) + this.neighbourhood[neighbourIndex][dimension];

            if (currentDimensionValue < 0 || currentDimensionValue >= this.gridShape[dimension]) {
                internalArrayIndex = -1;
                break;
            }

            internalArrayIndex += currentDimensionValue * stride[dimension];
        }

        if (internalArrayIndex !== -1 && this.grid.data[internalArrayIndex].length > 0) {
            for (var i = 0; i < this.grid.data[internalArrayIndex].length; i++) {
                existingPoint = this.samplePoints[this.grid.data[internalArrayIndex][i]];
                existingPointDistance = this.sampleDistance[this.grid.data[internalArrayIndex][i]];

                var minDistance = Math.min(existingPointDistance, pointDistance);
                var maxDistance = Math.max(existingPointDistance, pointDistance);
                var dist = minDistance + (maxDistance - minDistance) * this.bias;

                if (euclideanDistance(point, existingPoint) < this.minDistance + this.deltaDistance * dist) {
                    return true;
                }
            }
        }
    }

    return false;
};

/**
 * Try to generate a new point in the grid, returns null if it wasn't possible
 * @returns {Array|null} The added point or null
 */
VariableDensityPDS.prototype.next = function () {
    var tries,
        angle,
        distance,
        currentPoint,
        currentDistance,
        newPoint,
        inShape,
        i;

    while (this.processList.length > 0) {
        if (this.currentPoint === null) {
            var sampleIndex = this.processList.shift();
            this.currentPoint = this.samplePoints[sampleIndex];
            this.currentDistance = this.sampleDistance[sampleIndex];
        }

        currentPoint = this.currentPoint;
        currentDistance = this.currentDistance;

        for (tries = 0; tries < this.maxTries; tries++) {
            inShape = true;
            distance = this.minDistancePlusEpsilon + this.deltaDistance * (currentDistance + (1 - currentDistance) * this.bias);

            if (this.dimension === 2) {
                angle = this.rng() * Math.PI * 2;
                newPoint = [
                    Math.cos(angle),
                    Math.sin(angle)
                ];
            } else {
                newPoint = sphereRandom(this.dimension, this.rng);
            }

            for (i = 0; inShape && i < this.dimension; i++) {
                newPoint[i] = currentPoint[i] + newPoint[i] * distance;
                inShape = (newPoint[i] >= 0 && newPoint[i] < this.shape[i])
            }

            if (inShape && !this.inNeighbourhood(newPoint)) {
                return this.directAddPoint(newPoint);
            }
        }

        if (tries === this.maxTries) {
            this.currentPoint = null;
        }
    }

    return null;
};

/**
 * Automatically fill the grid, adding a random point to start the process if needed.
 * Will block the thread, probably best to use it in a web worker or child process.
 * @returns {Array[]} Sample points
 */
VariableDensityPDS.prototype.fill = function () {
    if (this.samplePoints.length === 0) {
        this.addRandomPoint();
    }

    while(this.next()) {}

    return this.samplePoints;
};

/**
 * Get all the points in the grid.
 * @returns {Array[]} Sample points
 */
VariableDensityPDS.prototype.getAllPoints = function () {
    return this.samplePoints;
};

/**
 * Get all the points in the grid along with the result of the distance function.
 * @returns {Array[]} Sample points with their distance function result
 */
VariableDensityPDS.prototype.getAllPointsWithDistance = function () {
    var result = new Array(this.samplePoints.length),
        i = 0,
        dimension = 0,
        point;

    for (i = 0; i < this.samplePoints.length; i++) {
        point = new Array(this.dimension + 1);

        for (dimension = 0; dimension < this.dimension; dimension++) {
            point[dimension] = this.samplePoints[i][dimension];
        }

        point[this.dimension] = this.sampleDistance[i];

        result[i] = point;
    }

    return result;
};

/**
 * Reinitialize the grid as well as the internal state
 */
VariableDensityPDS.prototype.reset = function () {
    var gridData = this.grid.data,
        i = 0;

    // reset the cache grid
    for (i = 0; i < gridData.length; i++) {
        gridData[i] = [];
    }

    // new array for the samplePoints as it is passed by reference to the outside
    this.samplePoints = [];

    // reset the internal state
    this.currentPoint = null;
    this.processList.length = 0;
};

module.exports = VariableDensityPDS;
