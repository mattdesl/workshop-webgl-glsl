precision mediump float;

attribute vec3 aPosition;

varying vec3 vPosition;

uniform mat4 uProjection;
uniform mat4 uView;

void main() {
    vPosition = aPosition;
    gl_Position = uProjection * uView * vec4(aPosition, 1.0);
}