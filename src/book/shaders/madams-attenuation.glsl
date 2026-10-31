float attenuation(float r, float f, float d) {
  float denom = d / r + 1.0;
  float attenuationVal = 1.0 / (denom * denom);
  float t = (attenuationVal - f) / (1.0 - f);
  return max(t, 0.0);
}

#pragma glslify: export(attenuation)


//this code is modified to support webgl2
// older code credit(s)
// by Tom Madams
// Simple:
// https://imdoingitwrong.wordpress.com/2011/01/31/light-attenuation/
// https://imdoingitwrong.wordpress.com/2011/02/10/improved-light-attenuation/
