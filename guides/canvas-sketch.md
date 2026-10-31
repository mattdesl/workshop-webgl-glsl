# canvas-sketch

[canvas-sketch](https://github.com/mattdesl/canvas-sketch) is a toolkit for
creating generative artwork with JavaScript and HTML Canvas. It is an optional
tool for standalone sketches; this workshop website runs with Vite.

## Create a sketch

Make sure Node.js and npm are installed. The canvas-sketch CLI can scaffold a
new sketch:

```sh
npx canvas-sketch-cli --new --template=three --open
```

Follow the prompts to select a folder and sketch name. The Three.js template
is a starting point for a separate canvas-sketch project.

To run an existing sketch:

```sh
npx canvas-sketch-cli src/sketch.js --open
```

For CLI options and other templates, see the
[canvas-sketch CLI guide][canvas-cli].

## Sketch files

A basic canvas-sketch file exports a function that returns a drawing callback:

```js
const sketch = ({ context, width, height }) => {
  return () => {
    context.fillStyle = '#111';
    context.fillRect(0, 0, width, height);
  };
};

export default sketch;
```

Install `canvas-sketch` in the sketch project's folder if you want to import
and launch sketches from your own JavaScript entry point. Follow the
[installation guide][canvas-install] for the setup supported by the CLI.

## Useful controls

The browser window opened by the CLI supports saving and exporting from its
keyboard shortcuts. Refer to the current
[canvas-sketch documentation][canvas-docs] for the latest controls and
export options.

[canvas-cli]:
  https://github.com/mattdesl/canvas-sketch/blob/master/docs/cli.md
[canvas-install]:
  https://github.com/mattdesl/canvas-sketch/blob/master/docs/installation.md
[canvas-docs]: https://github.com/mattdesl/canvas-sketch/tree/master/docs
