varying vec3 vPosition;
varying vec2 vUv;

#pragma glslify: noise = require('glsl-noise/simplex/4d');
#pragma glslify: vNoise = require('glsl-voronoi-noise/3d');
#pragma glslify: aastep = require('glsl-aastep');
#pragma glslify: worley3D = require(glsl-worley/worley3D.glsl) 

#define PI 3.141593

uniform vec4 randomPoints[POINT_COUNT];
uniform float time;
uniform float timeOffset;
uniform float pointScale;
uniform vec3 color;
uniform vec3 altColor;
uniform mat4 noiseRotation;
varying vec4 vNearestPoint;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

float radial_pattern(vec3 pos)
{
    const float pi = 3.141593;

    const float nbs = 6.1;
    const float ncr0 = 6.;
    const float cd = 2.0;

    vec2 uv0 = pos.xy;
    float a0 = atan(uv0.x, uv0.y);
    float ro = acos(abs(pos.z))/pi;
    
    float l = ro*cd;
    
    float sn = floor(0.5 + l*nbs);
    float ccr = sn/(cd*nbs); 

    float ncr = sn*ncr0;
    float ncr2p = ncr/(2.*pi);
    
    // Couldn't use this one yet
    //float f1 = l/sqrt(1. - z0*z0);
    
    // Empiric trick so that the holes on the "equator" don't look "compressed"
    // if (sn>5.)
    //    a0*= (ncr - floor(pow(sn - 6., 1.75)))/ncr;
    
    // To break the symmetry at the "equator"
    // a0+= pos.z<0.?0.04:0.;
    
    vec2 uv = ro*vec2(sin(a0), cos(a0));
    
    float a = (floor(a0*ncr2p) + 0.5)/ncr2p;
    vec2 cpos = ccr*vec2(sin(a), cos(a));

    return sn==0.?length(uv):distance(uv, cpos);
}

vec3 polarToCartesian (float phi, float theta) {
  float r = 1.0;
  return vec3(
    r * sin(phi) * cos(theta),
    r * cos(phi),
    r * sin(phi) * sin(theta)
  );
}

vec3 cartesianToPolar (vec3 pos) {
  float r = length(pos);
  float phi = acos(pos.y / r);
  float theta = atan(pos.z, pos.x);
  return vec3(
    phi,
    theta,
    r
  );
}

void main () {
  vec3 pos = normalize(vPosition.xyz);

  float minDist = 10000.0;
  float size = 10000.0;
  vec3 curPoint = vec3(0.0);
  for (int i = 0; i < POINT_COUNT; i++) {
    vec4 point = randomPoints[i];
    float curLen = distance(pos.xyz, point.xyz);
    if (curLen < minDist) {
      curPoint = point.xyz;
      minDist = curLen;
      size = point.w;
    }
  }

  // vec3 noisePos = normalize(noiseRotation * vec4(normalize(vPosition), 1.0)).xyz;
  // vec2 v = worley3D(vec3(curPoint * 1.0 + time + timeOffset), 2.0, false);
  // vec2 v = worley3D(vec3(vPosition * 1.5), 1.0, false);
  // float len = aastep(0.25, v.x);
  float len = aastep(pointScale, minDist);

  // float len = noise(vec4(curPoint.xyz, time));
  // float len = aastep(v.x, minDist);
  // float len = aastep(pointScale * size + v.x, minDist);
  // float len = aastep(pointScale * size + 0.1 * v.x, minDist);

  vec3 worldNormal = vWorldNormal;

	// //get light an view directions
	vec3 V = normalize( cameraPosition - vWorldPosition );

	// //rim lighting
	float rim = 1.0 - max(dot(V, worldNormal), 0.0);
	rim = smoothstep(-1.0, 1.0, rim);

  vec3 fragColor = color;
  // fragColor.rgb += (normalize(vPosition) * 0.5 + 0.5).xxx * 0.2;
  // fragColor.rgb += normalize(vPosition).zzz * 0.1;
  // fragColor.rgb = mix(fragColor.rgb, altColor, rim);
  // fragColor.rgb = mix(fragColor.rgb, altColor, vWorldNormal.y * 0.5 + 0.5);
  fragColor.rgb = mix(vec3(1.0), fragColor.rgb, len);
  gl_FragColor = vec4(fragColor, 1.0);
}

// var u = value() * Math.PI * 2;
// var v = value() * 2 - 1;
// var phi = u;
// var theta = Math.acos(v);
// out[0] = radius * Math.sin(theta) * Math.cos(phi);
// out[1] = radius * Math.sin(theta) * Math.sin(phi);
// out[2] = radius * Math.cos(theta);