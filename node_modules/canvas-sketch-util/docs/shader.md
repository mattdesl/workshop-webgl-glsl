#### <sup>:closed_book: [canvas-sketch-util](../README.md) → [Documentation](./README.md) → `shader`</sup>

---

### `canvas-sketch-util/shader`

A utility to quickly bootstrap a full-screen GLSL quad shader, similar to [ShaderToy](https://www.shadertoy.com/) but with only minimal features.

This uses [REGL](https://github.com/regl-project/regl) under the hood.

> :bulb: This utility is best used alongside [canvas-sketch](https://github.com/mattdesl/canvas-sketch) and its CLI, although it should also work in other environments.

### Example

A typical example with [canvas-sketch](https://github.com/mattdesl/canvas-sketch) will look like this:

```js
const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');

// Setup our sketch
const settings = {
  dimensions: [ 512, 512 ],
  context: 'webgl',
  animate: true
};

// Your glsl code
const frag = `
  precision highp float;

  uniform float time;
  varying vec2 vUv;

  void main () {
    float anim = sin(time) * 0.5 + 0.5;
    gl_FragColor = vec4(vec3(vUv.x * anim), 1.0);
  }
`;

// Your sketch, which simply returns the shader
const sketch = ({ gl }) => {
  // Create the shader and return it. It will be rendered by regl.
  return createShader({
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Expose props from canvas-sketch
      time: ({ time }) => time
    }
  });
};

canvasSketch(sketch, settings);
```

Also see [Advanced Example](#advanced-example).

### Functions


### `shader = createShader(opt)`

Creates a full-screen GLSL shader renderer with `opt` settings (rendered by [regl](https://regl.party)). The following options can be used:

- `gl` (required) the WebGL context to render to
- `frag` the fragment shader string, or a function that returns a string
- `vert` the vertex shader string, or a function that returns a string
- `clearColor` a color string or `[ r, g, b ]` array (in 0..1 floats) of the clear color
  - if `false` then no clear will be applied before rendering

  - defaults to black, i.e. `[ 0, 0, 0 ]`
- `clearAlpha` a number for the clear color alpha (if clearing), defaults to `1.0`
- `uniforms` a map of named uniforms
  - You can specify a constant value like `{ alpha: 0.5 }` (float) or `{ position: [ 0, 0.5 ] }` (vec2)

  - If you want to use a `sampler2D`, you should pass an image-like object, such as a `<image>` tag, ndarray, regl texture object descriptor, or Canvas.

  - Or, you can specify a function to derive a value from the current `props`, such as `({ time }) => time`
- `extensions` a list of WebGL extensions to enable for this shader
- `optionalExtensions` a list of optional WebGL extensions to attempt to enable for this shader
- `blend` (default true) enable blending with background, set to `false` to disable entirely
- `scissor` if true, scissor testing will be enabled and the props `scissorX, scissorY, scissorWidth, scissorHeight` will be expected to be passed through to the render function

The default `frag` and `vert` will use a simple black shader, which passes along the UV coordinates as `varying vec2 vUv`.

The returned `render(props)` function can be used to draw the shader to the context, or `unload()` can be used to destroy the shader.

### `shader.render(props)`

The resulting shader has a `render()` function which will poll the GL state, clear the backbuffer (if needed), draw a full-screen quad, and then flush the GL state.

### `shader.unload()`

Destroys the shader and any GL memory associated with it.

### `shader.drawQuad(props)`

This is a low-level function that will draw the full-screen quad. This does not do any GL polling/flushing or buffer clearing. This can be used, for example, to implement tiled rendering when `scissor` is enabled, by passing `{ scissorX, scissorY, scissorWidth, scissorHeight }` props.

### `shader.regl`

Returns the underlying `regl` instance that was created for use with this shader.

### Default Shaders

The default values when no `frag` and/or `vert` strings are passed.

#### Vertex

```glsl
precision highp float;

attribute vec3 position;
varying vec2 vUv;

void main () {
  gl_Position = vec4(position.xyz, 1.0);
  vUv = gl_Position.xy * 0.5 + 0.5;
}
```

#### Fragment

```glsl
precision highp float;

void main () {
  gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
```

#### Advanced Example

Another example without directly returning the shader result, and also showing image loading.

```js
const canvasSketch = require('canvas-sketch');
const createShader = require('canvas-sketch-util/shader');
const loadAsset = require('load-asset');

// Require a GLSL file for nicer editor syntax highlighting
const frag = require('./mouse.glsl');

// Setup our sketch
const settings = {
  context: 'webgl',
  animate: true
};

const sketch = async ({ gl }) => {
  const image = await loadAsset('image.png');
  const mouse = [ 0, 0 ];

  // Create a mouse listener
  const move = ev => {
    mouse[0] = ev.clientX / window.innerWidth;
    mouse[1] = (window.innerHeight - ev.clientY - 1) / window.innerHeight;
  };
  window.addEventListener('mousemove', move);

  // Create the shader and return it
  const shader = createShader({
    // Pass along WebGL context
    gl,
    // Specify fragment and/or vertex shader strings
    frag,
    // Specify additional uniforms to pass down to the shaders
    uniforms: {
      // Pass down a sampler2D image
      map: image,
      // Expose props from canvas-sketch
      time: ({ time }) => time,
      // Expose additional mouse uniform
      // Use an array here to ensure it picks up the new values each render
      mouse: () => mouse
    }
  });

  return {
    render (props) {
      // Render shader
      shader.render(props);
    },
    unload () {
      // Cleanup shader and mouse event
      shader.unload();
      window.removeEventListener('mousemove', move);
    }
  }
};

canvasSketch(sketch, settings);
```

## 

#### <sup>[← Back to Documentation](./README.md)