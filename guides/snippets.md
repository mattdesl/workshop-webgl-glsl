#### <sup>:closed_book: [workshop-webgl-glsl](../README.md) → Code Snippets</sup>

---

# Code Snippets

A few snippets that we may use during the workshop.

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