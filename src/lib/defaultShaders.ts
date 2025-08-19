export const DEFAULT_VS = `
attribute vec3 aPos; attribute vec3 aNormal; attribute vec2 aUV;
uniform mat4 uModel, uViewProj; varying vec3 vN; varying vec3 vW; varying vec2 vUV;
void main(){
  vec4 wPos = uModel * vec4(aPos,1.0);
  vW = wPos.xyz; vN = mat3(uModel) * aNormal; vUV = aUV;
  gl_Position = uViewProj * wPos;
}`.trim()

export const DEFAULT_FS = `
precision mediump float; 
varying vec3 vN; varying vec3 vW; varying vec2 vUV;
uniform float iTime; uniform vec2 iResolution; uniform vec4 iMouse;
uniform float uTime, uScale, uIntensity;
uniform vec3 uColor;
uniform bool uAnimate;

void main(){
  vec3 N = normalize(vN), L = normalize(vec3(0.6,0.8,0.5)), V = normalize(-vW);
  float diff = max(0.0, dot(N,L));
  float spec = pow(max(0.0, dot(reflect(-L,N), V)), 32.0);
  
  vec3 baseColor = uColor;
  if (uAnimate) {
    baseColor = mix(vec3(0.12,0.15,0.2), uColor, 0.5 + 0.5*sin(iTime * uScale + vec3(0.0,2.0,4.0)));
  }
  
  vec3 finalColor = baseColor * diff * uIntensity + vec3(1.0) * spec * 0.25;
  gl_FragColor = vec4(finalColor, 1.0);
}`.trim()
