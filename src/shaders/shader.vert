attribute vec3 position;
attribute vec2 uv;
uniform mat4 uModelViewMatrix;
uniform mat4 uPerspectiveMatrix;

varying vec2 vUv;

void main() {
    gl_Position = uPerspectiveMatrix * uModelViewMatrix * vec4(position, 1.0);
    vUv = uv;
}