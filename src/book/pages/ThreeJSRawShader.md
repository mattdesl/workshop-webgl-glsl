---
title: "THREE.RawShaderMaterial"
demo: raw-shader-material
---

You can also write raw GLSL without Three.js built-ins using
`RawShaderMaterial`. For GLSL ES 3.00, set `glslVersion: THREE.GLSL3` and
declare the attributes and uniforms your shader needs. Three.js adds the
version directive to the shader source.

This is useful when bringing shaders from other graphics engines or when you
want to manage the complete shader interface yourself.
