precision mediump float;

uniform vec2 resolution;
uniform vec3 color;

varying vec2 vUv;

void main() {
  gl_FragColor = vec4(vUv, 1.0, 1.0);  // Orange color
}