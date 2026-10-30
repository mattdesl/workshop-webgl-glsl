// I believe this was originally written by Taylor Baldwin (@taylorbaldwin / @rolyatmax)
// If that is miscredited please open an issue.

var clone = require('clone');
var squaredDistance = require('./vec2').squaredDistance;

module.exports.sort = function sort (paths) {
  paths = clone(paths);

  if (!paths.length) return paths;

  var newPaths = [];
  newPaths.push(paths[0]);

  paths = paths.slice(1);

  while (paths.length) {
    var lastPath = newPaths[newPaths.length - 1];
    var curPt = lastPath[lastPath.length - 1];
    var result = paths.reduce(function (closest, path, i) {
      var firstPt = path[0];
      var lastPt = path[path.length - 1];
      var distanceToFirst = squaredDistance(curPt, firstPt);
      var distanceToLast = squaredDistance(curPt, lastPt);
      if (!closest) {
        return {
          idx: i,
          distance: Math.min(distanceToFirst, distanceToLast),
          reverse: distanceToLast < distanceToFirst
        };
      }
      if (distanceToFirst < closest.distance) {
        return {
          idx: i,
          distance: distanceToFirst,
          reverse: false
        };
      }
      if (distanceToLast < closest.distance) {
        return {
          idx: i,
          distance: distanceToLast,
          reverse: true
        };
      }
      return closest;
    }, null);
    var idx = result.idx;
    var reverse = result.reverse;
    var closestPath = paths.splice(idx, 1)[0].slice();
    if (reverse) {
      closestPath.reverse();
    }
    newPaths.push(closestPath);
  }
  return newPaths;
};

module.exports.merge = function merge (paths, mergeThrehsold) {
  mergeThrehsold = mergeThrehsold != null ? mergeThrehsold : 0.05;

  var mergeThrehsoldSq = mergeThrehsold * mergeThrehsold;
  paths = clone(paths);
  for (var i = 1; i < paths.length; i++) {
    var lastPath = paths[i - 1];
    var curPath = paths[i];
    if (squaredDistance(curPath[0], lastPath[lastPath.length - 1]) < mergeThrehsoldSq) {
      paths = mergePaths(paths, i - 1, i);
      i -= 1; // now that we've merged, var's correct i for the next round
    }
  }
  return paths;
};

function mergePaths (paths, path1Idx, path2Idx) {
  // this will help us keep things in order when we do the splicing
  var minIdx = Math.min(path1Idx, path2Idx);
  var maxIdx = Math.max(path1Idx, path2Idx);
  paths = paths.slice();
  var path1 = paths[minIdx];
  var path2 = paths[maxIdx];
  var mergedPath = path1.concat(path2.slice(1));
  paths.splice(maxIdx, 1);
  paths.splice(minIdx, 1, mergedPath);
  return paths;
}

// this is the distance between paths - from the end of path 1 to the start of path 2
// function getTravelingDistance (paths) {
//   var total = 0;
//   var lastPt = paths[0][paths[0].length - 1];
//   for (var path of paths.slice(1)) {
//     var squaredDist = squaredDistance(lastPt, path[0]);
//     total += Math.sqrt(squaredDist);
//     lastPt = path[path.length - 1];
//   }
//   return total;
// }
