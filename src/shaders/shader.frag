precision mediump float;

uniform vec2 resolution;
uniform vec3 color;

// varying vec2 pos;

void main() {

  // vec2 uv = pos / resolution;
  gl_FragColor = vec4(color, 1.0);  // Orange color
}