uniform vec3 color;
uniform float opacity;
uniform bool dash;
uniform float dashRepeat;
uniform float dashDistance;
varying float vDistance;
varying float vTotalDistance;

#pragma glslify: aastep = require('glsl-aastep')

void main() {
  float alpha = dash
    ? aastep(0.5, fract(vDistance / dashDistance * dashRepeat))
    : 1.0;
  gl_FragColor = vec4(color, opacity * alpha);
}
