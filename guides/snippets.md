#### <sup>:closed_book: [workshop-webgl-glsl](../README.md) → Code Snippets</sup>

---

# Code Snippets

A few snippets that we may use during the workshop.

## GLSL — Baisc Vertex Shader

This is a "pass-through" vertex shader that just passes down some varyings:

```glsl
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

void main () {
  vPosition = position;
  vUv = uv;
  vNormal = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
}
```

## GLSL — Basic Fragment Shader

If you're using a Vertex Shader similar to the above, you can then accept `vUv` and other varyings in the fragment shader.

```js
varying vec2 vUv;

void main () {
  vec3 fragColor = vec3(vUv.x);
  gl_FragColor = vec4(fragColor, 1.0);
}
```

## GLSL in Three.js

You can write your programs with template strings like so:

```js
const vertexShader = /* glsl */ `
  void main () {
    // ...
  }
`;

const fragmentShader = /* glsl */ `
  void main () {
    // ...
  }
`;

const material = new THREE.ShaderMaterial({
  uniforms: {
    // your unifroms
  },
  vertexShader,
  fragmentShader
});
```

> :bulb: I'm using [Comment tagged templates](https://marketplace.visualstudio.com/items?itemName=bierner.comment-tagged-templates) and [Shader languages support](https://marketplace.visualstudio.com/items?itemName=slevesque.shader) extensions in VSCode for inline highlighting.

## GLSL — Rim Light Shader

Here's how we can create rim lighting on a sphere geometry. This goes in the Fragment shader, and expects `vPosition` which is a varying of the position attribute:

```glsl
uniform mat4 modelMatrix;

float sphereRim (vec3 spherePosition) {
  vec3 normal = normalize(spherePosition.xyz);
  vec3 worldNormal = normalize(mat3(modelMatrix) * normal.xyz);
  vec3 worldPosition = (modelMatrix * vec4(spherePosition, 1.0)).xyz;
  vec3 V = normalize(cameraPosition - worldPosition);
  float rim = 1.0 - max(dot(V, worldNormal), 0.0);
  return pow(smoothstep(0.0, 1.0, rim), 0.5);
}
```

In your rendering:

```glsl
void main () {
  ...

  // a value between 0..1
  float rim = sphereRim(vPosition);

  ...
}
```

## GLSL — Anti-aliased Step Function

First, make sure your shader has standard derivatives extension enabled:

```js
const material = new THREE.ShaderMaterial({
  ...
  extensions: {
    derivatives: true
  },
  ...
})
```

Then, install `glsl-aastep` and include the following:

```glsl
#pragma glslify: aastep = require('glsl-aastep')

void main () {
  ...

  // Some distance value, e.g. distance from point
  float distance = /* some value */;

  // Some threshold, e.g. size of circle you want to step to
  float threshold = 0.25;

  // Perform an anti-alias step, returns a value between 0..1
  float edge = aastep(threshold, distance);
  ...
}
```

This is basically the following step function, but the edge is smoothed perfectly with anti-aliasing rather than a jagged/stepped edge:

```
threshold < distance ? 0.0 : 1.0
```

## 

#### <sup>[← Back to README](../README.md)