module.exports = pack;
function pack(opt = {}) {
  const bounds = defined(opt.bounds, 1);
  const maxAttempts = defined(opt.maxAttempts, 500);
  const maxCount = defined(opt.maxCount, 100);
  const sampleFn = opt.sample || sample;
  const dimensions = defined(opt.dimensions, 2);
  const random = opt.random || (() => Math.random());

  if (dimensions !== 2 && dimensions !== 3) {
    throw new Error("Dimensions must be 2 or 3");
  }

  const shapes = [];
  for (let i = 0; i < maxCount; i++) {
    const result = pack();
    if (result) {
      shapes.push(result);
    }
  }

  return shapes;

  function defined(a, defaultValue) {
    return a != null ? a : defaultValue;
  }

  function pack() {
    // try to pack
    let shape;
    for (let i = 0; i < maxAttempts; i++) {
      shape = place();
      if (shape) break;
    }

    // exhausted all pack attempts
    if (!shape) return false;

    let radius = shape.minRadius;
    if (shape.radiusGrowth > 0) {
      let count = 0;
      while (radius < shape.maxRadius && count < shape.maxGrowthSteps) {
        const newRadius = radius + shape.radiusGrowth;
        if (reject(shape.position, newRadius, shape.padding)) {
          break;
        }
        radius = newRadius;
        count++;
      }
    }

    shape.radius = Math.min(shape.maxRadius, radius);
    return shape;
  }

  function expand(arg, defaultValue) {
    let result = defined(arg, defaultValue);
    if (typeof result === "function") return result();
    return result;
  }

  function place() {
    const maxRadius = expand(opt.maxRadius, 0.05);
    const radiusGrowth = expand(opt.radiusGrowth, 0.01);
    const maxGrowthSteps = expand(opt.maxGrowthSteps, Infinity);
    const position = sampleFn();
    const radius = expand(opt.minRadius, 0.01);
    const padding = expand(opt.padding, 0);

    if (reject(position, radius, padding)) {
      return false;
    }

    return {
      maxGrowthSteps,
      minRadius: radius,
      maxRadius,
      radiusGrowth,
      position,
      padding
    };
  }

  function reject(position, radius, padding) {
    if (outside(position, radius, padding)) {
      return true;
    }
    return shapes.some(other => {
      return collision(
        position,
        radius + padding,
        other.position,
        other.radius + other.padding
      );
    });
  }

  function outside(position, radius, padding) {
    const [x, y] = position;
    if (x + radius >= bounds || x - radius < -bounds) {
      return true;
    }
    if (y + radius >= bounds || y - radius < -bounds) {
      return true;
    }
    return false;
  }

  function sample() {
    const p = [];
    for (let i = 0; i < dimensions; i++) {
      p.push((random() * 2 - 1) * bounds);
    }
    return p;
  }

  function distanceSq(a, b) {
    var sum = 0;
    var n;
    for (n = 0; n < a.length; n++) {
      sum += Math.pow(a[n] - b[n], 2);
    }
    return sum;
  }

  function collision(pointA, radiusA, pointB, radiusB) {
    const radius = radiusA + radiusB;
    const radiusSq = radius * radius;
    return distanceSq(pointA, pointB) < radiusSq;
  }
}
