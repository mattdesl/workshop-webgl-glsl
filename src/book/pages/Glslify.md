---
title: "glslify"
---

[glslify](https://github.com/glslify/glslify) preprocesses GLSL so shader
files can import reusable functions from npm packages or local files.

This project uses `vite-plugin-glsl` for shader imports. Its `#include`
syntax is separate from glslify's `#pragma glslify` syntax; glslify needs
its own build step or transform.

## GLSL ES 3.00 source

For a standalone WebGL 2 shader, put `#version 300 es` on the first line.
When Three.js sets `glslVersion: THREE.GLSL3` on a material, it adds that
directive for you, so omit it from the shader string.

Install glslify and a shader module in a project configured to run glslify:

```sh
npm install --save-dev glslify glsl-noise
```

Import and preprocess the fragment shader at build time:

```js
import glslify from 'glslify';

const fragmentShader = glslify(`
  precision highp float;

  #pragma glslify: noise = require(glsl-noise/simplex/2d)

  in vec2 vUv;
  out vec4 fragColor;

  void main() {
    float value = noise(vUv);
    fragColor = vec4(vec3(value * 0.5 + 0.5), 1.0);
  }
`);
```

This uses GLSL ES 3.00 inputs and an explicit fragment output. Configure
glslify in the build pipeline before passing the result to WebGL.

## Write a module

A GLSL module exports a function. It does not include a version directive or
default precision; the entry shader owns those declarations.

```glsl
vec3 red() {
  return vec3(1.0, 0.0, 0.0);
}

#pragma glslify: export(red)
```

Import the function in an entry shader:

```glsl
#pragma glslify: red = require('./red.glsl')

precision highp float;
out vec4 fragColor;

void main() {
  fragColor = vec4(red(), 1.0);
}
```
