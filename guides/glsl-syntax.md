# GLSL syntax

GLSL is a language for programs that run on the GPU. A shader is usually
paired with another shader in a rendering pipeline:

- A vertex shader positions geometry.
- A fragment shader calculates the color of each pixel.

These examples use GLSL ES 3.00 for WebGL 2. In standalone shader files, put
`#version 300 es` on the first line. Three.js adds that directive when a
`ShaderMaterial` uses `glslVersion: THREE.GLSL3`, so omit it from shader
strings passed to Three.js.

## Main function

Every shader has a `main` function. This standalone fragment shader writes
a constant color to every pixel:

```glsl
#version 300 es
precision highp float;
out vec4 fragColor;

void main() {
  fragColor = vec4(1.0, 0.25, 0.1, 1.0);
}
```

The four components of `vec4` are red, green, blue, and alpha.

## Types and constructors

Common types include `float`, `int`, `bool`, `vec2`, `vec3`, `vec4`, and
matrix types such as `mat3` and `mat4`. A vector constructor takes one or
more values:

```glsl
float alpha = 0.5;
vec3 rgb = vec3(1.0, 0.5, 0.0);
vec4 color = vec4(rgb, alpha);
```

Write decimal points for floating-point values, such as `1.0`.

## Vector components

Use `.xyzw` or `.rgba` to access vector components. These names refer to the
same components:

```glsl
vec2 position = vec2(0.25, 0.75);
float x = position.x;
float y = position.y;
```

A swizzle can reorder or repeat components:

```glsl
vec3 color = vec3(0.1, 0.4, 0.8);
vec3 blueToRed = color.bgr;
vec3 repeated = color.xxx;
```

## Inputs from JavaScript

A `uniform` is a value supplied by JavaScript and shared by shader
invocations. In GLSL ES 3.00, vertex outputs use `out` and the matching
fragment shader inputs use `in`. Their names and types must match.

This standalone vertex shader declares its inputs and uniforms:

```glsl
#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix *
    vec4(position, 1.0);
}
```

Three.js `ShaderMaterial` provides `position`, `uv`, `projectionMatrix`, and
`modelViewMatrix` as built-ins. Do not redeclare them in Three.js shader
strings. Set `glslVersion: THREE.GLSL3` on the material; Three.js supplies the
version directive.

```glsl
#version 300 es
precision highp float;

uniform float uTime;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec3 color = 0.5 + 0.5 * cos(
    uTime + vUv.xyx + vec3(0.0, 2.0, 4.0)
  );
  fragColor = vec4(color, 1.0);
}
```

## Functions

GLSL has built-in math functions such as `sin`, `cos`, `length`, `dot`, and
`smoothstep`. You can define your own functions:

```glsl
float circleMask(vec2 point, float radius) {
  return 1.0 - smoothstep(radius, radius + 0.01, length(point));
}
```

Functions have a return type and typed parameters. `void` means that a
function does not return a value.

## Learn more

See the [GLSL ES specification][glsl-spec] and the
[Three.js ShaderMaterial documentation][shader-material].

[glsl-spec]:
  https://registry.khronos.org/OpenGL/index_es.php
[shader-material]:
  https://threejs.org/docs/pages/ShaderMaterial.html
