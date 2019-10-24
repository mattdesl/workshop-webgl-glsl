const canvasSketch = require("canvas-sketch");
const pack = require("./pack-sphere");
const { lerp } = require("canvas-sketch-util/math");
const Random = require("canvas-sketch-util/random");

const settings = {
  dimensions: [2048, 2048]
};

const sketch = ({ width, height }) => {
  const margin = width * 0.1;
  const bounds = 1;
  const shapes = pack({
    bounds,
    minRadius: 0.01,
    maxRadius: 0.2,
    maxCount: 1000,
    outside: (position, radius) => {
      return position[0] + position[1] > radius * radius;
    },
    sample: () => Random.insideCircle(bounds),
    dimensions: 2
  }).map(p => {
    // Normalize from -1..1 to screen size
    const size = Math.min(width, height);
    const scale = 0.75;
    return {
      position: [
        size / 2 + ((p.position[0] * size) / 2) * scale,
        size / 2 + ((p.position[1] * size) / 2) * scale
      ],
      radius: ((size * p.radius) / 2) * scale
    };
  });

  return ({ context, width, height }) => {
    context.fillStyle = "white";
    context.fillRect(0, 0, width, height);

    const size = Math.min(width, height) * 0.33;
    // context.translate(width / 2, height / 2);
    // context.scale(size, size);
    // context.lineWidth = 2 / size;
    context.globalAlpha = 0.5;
    context.strokeRect(-1, -1, 2, 2);
    context.globalAlpha = 1;
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
