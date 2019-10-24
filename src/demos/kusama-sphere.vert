varying vec3 vPosition;
varying vec2 vUv;

void main () {
  vUv = uv;
  vPosition = position.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xyz, 1.0);
}