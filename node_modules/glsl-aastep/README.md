# glsl-aastep

[![stable](http://badges.github.io/stability-badges/dist/stable.svg)](http://github.com/badges/stability-badges)

![smooth](http://i.imgur.com/w7El33x.png)

[(glslbin demo)](http://glslb.in/s/d7b309df)

Performs a smoothstep using standard derivatives for anti-aliased edges at any level of magnification. If `GL_OES_standard_derivatives` is not available, this falls back to using `step()` without any anti-aliasing. 

For this module to work, you must enable standard derivatives at your top-level shader:

```glsl
precision mediump float;

#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

#pragma glslify: aastep = require('glsl-aastep')

//rest of your shader
```

A full example of 2D circle rendering:

```glsl
precision highp float;

#ifdef GL_OES_standard_derivatives
#extension GL_OES_standard_derivatives : enable
#endif

#pragma glslify: aastep = require('glsl-aastep')

uniform float iGlobalTime;
uniform vec3  iResolution;

void main() {
  //centered texture coordinates
  vec2 uv = vec2(gl_FragCoord.xy / iResolution.xy) - 0.5;

  //correct aspect
  uv.x *= iResolution.x / iResolution.y;

  //animate zoom
  uv /= sin(iGlobalTime * 0.2); 

  //radial distance
  float len = length(uv);

  //anti-alias
  len = aastep(0.5, len);

  gl_FragColor.rgb = vec3(len);
  gl_FragColor.a   = 1.0;
}
```

Suggestions/PRs welcome.

## Usage

[![NPM](https://nodei.co/npm/glsl-aastep.png)](https://www.npmjs.com/package/glsl-aastep)

#### `float aastep(float threshold, float value)`

Performs a `step(threshold, value)` function, except that the edge is smoothed across the width of a single fragment to create anti-aliasing at any scale. Returns the smoothed float.

## Contributing

See [stackgl/contributing](https://github.com/stackgl/contributing) for details.

## License

MIT, see [LICENSE.md](http://github.com/stackgl/glsl-aastep/blob/master/LICENSE.md) for details.
