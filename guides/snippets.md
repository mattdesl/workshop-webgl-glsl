# Shader snippets

These examples use GLSL ES 3.00 for WebGL 2. The Three.js materials set
`glslVersion: THREE.GLSL3`. Three.js adds the version directive to shader
strings, so these strings omit `#version 300 es`.

## Basic fragment shader

A fragment shader receives the interpolated texture coordinate `vUv` and
writes one color per pixel:

```glsl
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

The vertex shader sends a matching output to the fragment shader:

```glsl
out vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix *
    vec4(position, 1.0);
}
```

Three.js provides the built-in attributes and transform uniforms in these
shader strings.

## Supply a uniform from JavaScript

Pass a starting value in the material's `uniforms` object. Update the
`value` property as your animation runs:

```js
const material = new THREE.ShaderMaterial({
  glslVersion: THREE.GLSL3,
  uniforms: {
    uTime: { value: 0 }
  },
  vertexShader,
  fragmentShader
});

material.uniforms.uTime.value = elapsedSeconds;
```

The application must import Three.js and provide the `vertexShader`,
`fragmentShader`, and `elapsedSeconds` values.

## Smooth circular mask

`smoothstep` makes a soft transition around a radius. This fragment shader
centers and scales coordinates so the circle stays round on a non-square
canvas:

```glsl
precision highp float;

uniform vec2 resolution;
in vec2 vUv;
out vec4 fragColor;

void main() {
  vec2 point = (vUv - 0.5) * resolution;
  float radius = min(resolution.x, resolution.y) * 0.25;
  float circle = 1.0 - smoothstep(
    radius,
    radius + 1.0,
    length(point)
  );
  fragColor = vec4(vec3(circle), 1.0);
}
```

Pass the drawing buffer dimensions in the `resolution` uniform:

```js
uniforms: {
  resolution: {
    value: new THREE.Vector2(width, height)
  }
}
```

## Rim lighting

This pair of shaders calculates a simple view-dependent rim. The vertex
shader sends a view-space normal and position to the fragment shader:

```glsl
out vec3 vNormal;
out vec3 vViewPosition;

void main() {
  vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vViewPosition = -viewPosition.xyz;
  gl_Position = projectionMatrix * viewPosition;
}
```

The fragment shader receives those values with matching `in` declarations:

```glsl
precision highp float;

in vec3 vNormal;
in vec3 vViewPosition;
out vec4 fragColor;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(vViewPosition);
  float rim = 1.0 - max(dot(normal, viewDirection), 0.0);
  rim = smoothstep(0.2, 0.8, rim);
  fragColor = vec4(vec3(rim), 1.0);
}
```

See [GLSL syntax](glsl-syntax.md) for types and shader inputs. For shader
imports in this repository, see
[JavaScript and shader modules](modules.md).

