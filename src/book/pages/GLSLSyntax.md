---
title: "GLSL Syntax"
---

These examples use GLSL ES 3.00 for WebGL 2. In standalone WebGL 2 shader
files, put `#version 300 es` on the first line. Three.js adds that directive
for `THREE.ShaderMaterial` when its `glslVersion` is set to `THREE.GLSL3`, so
leave it out of shader strings passed to Three.js.

Shaders have a `main` function. This fragment shader writes a constant color:

```glsl
#version 300 es
precision highp float;
out vec4 fragColor;

void main () {
  fragColor = vec4(1.0, 0.25, 0.1, 1.0);
}
```

A `vec4` contains red, green, blue, and alpha components.

## Types and constructors

Common types include `float`, `int`, `bool`, `vec2`, `vec3`, `vec4`, and
matrix types such as `mat3` and `mat4`. Constructors combine scalar and vector
values:

```glsl
#version 300 es
precision highp float;
out vec4 fragColor;

void main () {
  float alpha = 0.5;
  int i = 5;
  bool enabled = true;
  vec3 rgb = vec3(1.0, 0.5, 0.0);
  vec4 myRGBA = vec4(rgb, alpha);
  fragColor = myRGBA;
}
```

Write decimal points for floating-point values, such as `1.0`.

## Vector components

Use `.xyzw` or `.rgba` to access vector components. These names refer to the
same components. A swizzle can reorder or repeat them:

```glsl
#version 300 es
precision highp float;
out vec4 fragColor;

void main () {
  vec4 myRGBA = vec4(1.0, 0.5, 0.25, 1.0);
  vec2 xy = myRGBA.xy;
  vec3 rgb = myRGBA.rgb;
  float alpha = myRGBA.a;
  fragColor = vec4(xy, rgb.x + alpha, 1.0);
}
```

## Inputs from JavaScript

A `uniform` is a value supplied by JavaScript and shared by shader
invocations. Vertex shader outputs are declared with `out` and received by
the fragment shader with a matching `in` declaration:

```glsl
#version 300 es
precision highp float;

in vec2 uv;
in vec3 position;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
out vec2 vUv;

void main () {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix *
    vec4(position, 1.0);
}
```

For Three.js `ShaderMaterial`, the `position` and `uv` attributes and matrix
uniforms are built in. Do not redeclare them.

```glsl
#version 300 es
precision highp float;

uniform float uTime;
in vec2 vUv;
out vec4 fragColor;

void main () {
  vec3 color = 0.5 + 0.5 * cos(
    uTime + vUv.xyx + vec3(0.0, 2.0, 4.0)
  );
  fragColor = vec4(color, 1.0);
}
```

The fragment shader declares a floating-point precision. This example uses
time and interpolated texture coordinates to vary the color.

## Functions

GLSL includes math functions such as `sin`, `cos`, `length`, `dot`, and
`smoothstep`. You can define your own functions:

```glsl
float circleMask(vec2 point, float radius) {
  return 1.0 - smoothstep(radius, radius + 0.01, length(point));
}
```

Functions have a return type and typed parameters. `void` means that a
function does not return a value.
