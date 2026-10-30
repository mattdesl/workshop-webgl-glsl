---
title: "THREE.ShaderMaterial"
demo: shader-material
---

Three.js shaders include built-in uniforms (e.g. `projectionMatrix`) and
attributes (e.g. `position`, `uv`), so you do not need to redefine them.
Set `glslVersion: THREE.GLSL3` to use GLSL ES 3.00 syntax. Three.js adds the
version directive and default precision to `ShaderMaterial` shader strings.
