# glsl-voronoi-noise

Voronoi noise, packed for glslify

 &nbsp; | &nbsp; 
:-------------------------:|:-------------------------:
![example 2d output](https://i.imgur.com/0i4AeaX.png)  |  ![example 3d output](https://i.imgur.com/sTFMgzv.png)

usage: 
```glsl
precision mediump float;
#pragma glslify: voronoi3d = require('glsl-voronoi-noise/3d')

varying vec2 uv;
uniform float t;

void main() {
    gl_FragColor.rgb = voronoi3d(vec3(uv, t));  
    gl_FragColor.a   = 1.0;
}
```
See also: [glsl-worley](https://github.com/Erkaman/glsl-worley)

Implementations from [Shawn Lawson](https://github.com/shawnlawson/The_Force/blob/b28befa00fc8c2c128945ee36c55df4e1bb8416d/shaders/header.frag#L186-L226)

