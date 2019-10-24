module.exports = function () {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const pixelRatio = Math.min(2, window.devicePixelRatio);

  return {
    canvas,
    update (opt = {}) {
      const {
        color = 'black',
        text = '',
        fontSize,
        fontFamily = '"Inter", sans-serif',
        background = null
      } = opt;
      const width = Math.floor(opt.width);
      const height = Math.floor(opt.height);
      canvas.width = Math.floor(width * pixelRatio);
      canvas.height = Math.floor(height * pixelRatio);
      context.save();
      context.scale(pixelRatio, pixelRatio);
      context.clearRect(0, 0, width, height);
      if (background != null) {
        context.fillStyle = background;
        context.fillRect(0, 0, width, height);
      }
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `${fontSize}px ${fontFamily}`;
      context.fillStyle = color;
      context.fillText(text, width / 2, height / 2);
      context.restore();
    }
  };
};
