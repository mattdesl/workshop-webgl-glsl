float attenuation(float r, float f, float d) {
  return pow(max(0.0, 1.0 - (d / r)), f + 1.0);
}

#pragma glslify: export(attenuation)


//this code is modified to support webgl2
// older code credit(s)
// by David Reid - Source:
// https://kookaburragamer.wordpress.com/2013/03/24/user-friendly-exponential-light-attenuation/
