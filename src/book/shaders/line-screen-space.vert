attribute float direction;
attribute vec2 distances;
attribute vec3 nextPosition;
attribute vec3 previousPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying float vDistance;
varying float vTotalDistance;

const bool miter = false;
const float miterLimit = 8.0;

uniform float thickness;
uniform float totalDistance;
uniform float time;
uniform float aspect;

vec4 screenSpaceLine (vec3 posOffset, float computedThickness) {
  vec2 aspectVec = vec2(aspect, 1.0);
  mat4 projViewModel = projectionMatrix * modelViewMatrix;
  vec4 previousProjected = projViewModel * vec4(vec3(previousPosition.xyz) + posOffset, 1.0);
  vec4 currentProjected = projViewModel * vec4(vec3(position.xyz) + posOffset, 1.0);
  vec4 nextProjected = projViewModel * vec4(vec3(nextPosition.xyz) + posOffset, 1.0);

  //get 2D screen space with W divide and aspect correction
  vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;
  vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;
  vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;
  
  float len = computedThickness;
  float orientation = direction;
  vec2 dirA = normalize(currentScreen - previousScreen);

  //starting point uses (next - current)
  vec2 dir = vec2(0.0);

  if (currentScreen == previousScreen) {
    dir = normalize(nextScreen - currentScreen);
  } 
  //ending point uses (current - previous)
  else if (currentScreen == nextScreen) {
    dir = normalize(currentScreen - previousScreen);
  }
  //somewhere in middle, needs a join
  else {
    //get directions from (C - B) and (B - A)
    vec2 dirB = normalize(nextScreen - currentScreen);
    if (miter) {
      //now compute the miter join normal and length
      vec2 tangent = normalize(dirA + dirB);
      vec2 perp = vec2(-dirA.y, dirA.x);
      vec2 miter = vec2(-tangent.y, tangent.x);
      float miterDot = dot(miter, perp);
      len = miterDot == 0.0 ? 0.0 : (computedThickness / miterDot);
      len = clamp(len, 0.0, computedThickness * miterLimit);
      dir = tangent;
    } else {
      dir = normalize(dirA + dirB);
    }
  }

  vec2 normal = vec2(-dir.y, dir.x);

  // convert pixel thickness to NDC space
  vec2 normalLength = vec2(len / 2.0);
  normalLength = normalLength * 2.0;

  // scale normal to line thickness
  normal *= normalLength;

  // Corret aspect
  normal.x /= aspect;

  vec4 finalOffset = vec4(normal * orientation, 0.0, 0.0);
  vec4 finalPosition = currentProjected + finalOffset;
  return finalPosition;
}

void main () {
  float computedThickness = thickness;
  vec3 posOffset = vec3(0.0);

  gl_Position = screenSpaceLine(posOffset, computedThickness);
  vUv = vec2(distances.x, direction * 0.5 + 0.5);

  vec3 objectNormal = vec3(0.0, 0.0, -1.0);
  // mat3 normalMatrix2 = transpose(inverse(mat3(modelViewMatrix)));
  vTotalDistance = totalDistance;
  vDistance = distances.y;
  vNormal = normalize(normalMatrix * objectNormal);
}
