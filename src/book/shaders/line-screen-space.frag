precision highp float;

// Uniforms remain the same, but 'bool' is fully supported natively
uniform vec3 color;
uniform float opacity;
uniform bool dash;
uniform float dashRepeat;
uniform float dashDistance;

// 'varying' is replaced by 'in' in WebGL 2 fragments
in float vDistance;
in float vTotalDistance;

// WebGL 2 requires you to declare your own output variable instead of gl_FragColor
out vec4 fragColor;

float aastep(float threshold, float value) {
  // fwidth() is built into core WebGL 2 (no extensions needed!)
  float afwidth = fwidth(value) * 0.5;
  return smoothstep(threshold - afwidth, threshold + afwidth, value);
}

void main() {
  float alpha = dash
    ? aastep(0.5, fract(vDistance / dashDistance * dashRepeat))
    : 1.0;
    
  // Assign directly to your custom output variable
  fragColor = vec4(color, opacity * alpha);
}
