varying vec3 vPosition;
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;

void main () {
  vUv = uv;
  vNormal = normal;
  vWorldNormal = normalize(mat3(modelMatrix) * normal.xyz);
  vPosition = position.xyz;
  vWorldPosition = (modelMatrix * vec4(position.xyz, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
}