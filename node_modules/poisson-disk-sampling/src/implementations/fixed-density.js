"use strict";

var tinyNDArray = require('./../tiny-ndarray').integer,
    sphereRandom = require('./../sphere-random'),
    getNeighbourhood = require('./../neighbourhood');

/**
 * Get the squared euclidean distance from two points of arbitrary, but equal, dimensions
 * @param {Array} point1
 * @param {Array} point2
 * @returns {number} Squared euclidean distance
 */
function squaredEuclideanDistance (point1, point2) {
    var result = 0,
        i = 0;

    for (; i < point1.length; i++) {
        result += Math.pow(point1[i] - point2[i], 2);
    }

    return result;
}

/**
 * FixedDensityPDS constructor
 * @param {object} options Options
 * @param {Array} options.shape Shape of the space
 * @param {float} options.minDistance Minimum distance between each points
 * @param {float} [options.maxDistance] Maximum distance between each points, defaults to minDistance * 2
 * @param {int} [options.tries] Number of times the algorithm will try to place a point in the neighbourhood of another points, defaults to 30
 * @param {function|null} [rng] RNG function, defaults to Math.random
 * @constructor
 */
function FixedDensityPDS (options, rng) {
    if (typeof options.distanceFunction === 'function') {
        throw new Error('PoissonDiskSampling: Tried to instantiate the fixed density implementation with a distanceFunction');
    }

    this.shape = options.shape;
    this.minDistance = options.minDistance;
    this.maxDistance = options.maxDistance || options.minDistance * 2;
    this.maxTries = Math.ceil(Math.max(1, options.tries || 30));

    this.rng = rng || Math.random;

    // to replace with floatPrecisionMitigation = Math.max(1, Math.max(...this.shape) / 64 | 0) on the next major update
    var maxShape = 0;
    for (var i = 0; i < this.shape.length; i++) {
        maxShape = Math.max(maxShape, this.shape[i]);
    }
    var floatPrecisionMitigation = Math.max(1, maxShape / 128 | 0);
    var epsilonDistance = 1e-14 * floatPrecisionMitigation;

    this.dimension = this.shape.length;
    this.squaredMinDistance = this.minDistance * this.minDistance;
    this.minDistancePlusEpsilon = this.minDistance + epsilonDistance;
    this.deltaDistance = Math.max(0, this.maxDistance - this.minDistancePlusEpsilon);
    this.cellSize = this.minDistance / Math.sqrt(this.dimension);

    this.neighbourhood = getNeighbourhood(this.dimension);

    this.currentPoint = null;
    this.processList = [];
    this.samplePoints = [];

    // cache grid

    this.gridShape = [];

    for (var i = 0; i < this.dimension; i++) {
        this.gridShape.push(Math.ceil(this.shape[i] / this.cellSize));
    }

    this.grid = tinyNDArray(this.gridShape); //will store references to samplePoints
}

FixedDensityPDS.prototype.shape = null;
FixedDensityPDS.prototype.dimension = null;
FixedDensityPDS.prototype.minDistance = null;
FixedDensityPDS.prototype.maxDistance = null;
FixedDensityPDS.prototype.minDistancePlusEpsilon = null;
FixedDensityPDS.prototype.squaredMinDistance = null;
FixedDensityPDS.prototype.deltaDistance = null;
FixedDensityPDS.prototype.cellSize = null;
FixedDensityPDS.prototype.maxTries = null;
FixedDensityPDS.prototype.rng = null;
FixedDensityPDS.prototype.neighbourhood = null;

FixedDensityPDS.prototype.currentPoint = null;
FixedDensityPDS.prototype.processList = null;
FixedDensityPDS.prototype.samplePoints = null;
FixedDensityPDS.prototype.gridShape = null;
FixedDensityPDS.prototype.grid = null;

/**
 * Add a totally random point in the grid
 * @returns {Array} The point added to the grid
 */
FixedDensityPDS.prototype.addRandomPoint = function () {
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
FixedDensityPDS.prototype.addPoint = function (point) {
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
FixedDensityPDS.prototype.directAddPoint = function (point) {
    var internalArrayIndex = 0,
        stride = this.grid.stride,
        dimension;

    this.processList.push(point);
    this.samplePoints.push(point);

    for (dimension = 0; dimension < this.dimension; dimension++) {
        internalArrayIndex += ((point[dimension] / this.cellSize) | 0) * stride[dimension];
    }

    this.grid.data[internalArrayIndex] = this.samplePoints.length; // store the point reference

    return point;
};

/**
 * Check whether a given point is in the neighbourhood of existing points
 * @param {Array} point Point
 * @returns {boolean} Whether the point is in the neighbourhood of another point
 * @protected
 */
FixedDensityPDS.prototype.inNeighbourhood = function (point) {
    var dimensionNumber = this.dimension,
        stride = this.grid.stride,
        neighbourIndex,
        internalArrayIndex,
        dimension,
        currentDimensionValue,
        existingPoint;

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

        if (internalArrayIndex !== -1 && this.grid.data[internalArrayIndex] !== 0) {
            existingPoint = this.samplePoints[this.grid.data[internalArrayIndex] - 1];

            if (squaredEuclideanDistance(point, existingPoint) < this.squaredMinDistance) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Try to generate a new point in the grid, returns null if it wasn't possible
 * @returns {Array|null} The added point or null
 */
FixedDensityPDS.prototype.next = function () {
    var tries,
        angle,
        distance,
        currentPoint,
        newPoint,
        inShape,
        i;

    while (this.processList.length > 0) {
        if (this.currentPoint === null) {
            this.currentPoint = this.processList.shift();
        }

        currentPoint = this.currentPoint;

        for (tries = 0; tries < this.maxTries; tries++) {
            inShape = true;
            distance = this.minDistancePlusEpsilon + this.deltaDistance * this.rng();

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
FixedDensityPDS.prototype.fill = function () {
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
FixedDensityPDS.prototype.getAllPoints = function () {
    return this.samplePoints;
};

/**
 * Get all the points in the grid along with the result of the distance function.
 * @throws Will always throw an error.
 */
FixedDensityPDS.prototype.getAllPointsWithDistance = function () {
    throw new Error('PoissonDiskSampling: getAllPointsWithDistance() is not available in fixed-density implementation');
};

/**
 * Reinitialize the grid as well as the internal state
 */
FixedDensityPDS.prototype.reset = function () {
    var gridData = this.grid.data,
        i = 0;

    // reset the cache grid
    for (i = 0; i < gridData.length; i++) {
        gridData[i] = 0;
    }

    // new array for the samplePoints as it is passed by reference to the outside
    this.samplePoints = [];

    // reset the internal state
    this.currentPoint = null;
    this.processList.length = 0;
};

module.exports = FixedDensityPDS;
