const canvasSketch = require('canvas-sketch');
const colors = require('./');

const settings = {
  dimensions: [ 2048, 1024 ],
};

const sketch = () => {
  return ({ context, width, height }) => {
    const cellWidth = width / colors.length;
    colors.forEach((paper, i) => {
      context.fillStyle = paper.hex;
      context.fillRect(i * cellWidth, 0, cellWidth, height);
    });
  };
};

canvasSketch(sketch, settings);
