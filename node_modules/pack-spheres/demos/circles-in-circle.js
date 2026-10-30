const canvasSketch = require("canvas-sketch");
const Random = require("canvas-sketch-util/random");
const pack = require("..");

const settings = {
  dimensions: [1024, 1024]
};

const sketch = ({ width, height }) => {
  const size = Math.min(width, height);
  const margin = width * 0.1;
  const scale = 0.5 * size - margin;

  const bounds = 1;
  const shapes = pack({
    bounds,
    sample: () => Random.insideCircle(bounds),
    outside: (position, radius) => {
      // See if length of circle + radius
      // exceeds the bounds
      const length = Math.sqrt(
        position[0] * position[0] + position[1] * position[1]
      );
      return length + radius >= bounds;
    },
    maxCount: 2500,
    dimensions: 2,
    minRadius: 0.015,
    maxRadius: 0.25,
    padding: 0.0025
  });

  return ({ context, width, height }) => {
    // Clear background
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    // Centered origin point
    context.translate(width / 2, height / 2);
    // Scale from -1..1 to -scale..scale
    context.scale(scale, scale);

    shapes.forEach(shape => {
      context.beginPath();
      context.arc(
        shape.position[0],
        shape.position[1],
        shape.radius,
        0,
        Math.PI * 2
      );
      context.fillStyle = "black";
      context.fill();
    });
  };
};

canvasSketch(sketch, settings);
