import * as THREE from "three";
import { Tick } from "./tick";

export class StarSystem extends THREE.Object3D {
  private material: THREE.ShaderMaterial;
  constructor() {
    super();
    this.material = StarSystem.makeStarMaterial();
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(1, 2),
      this.material);
    mesh.scale.setLength(1e3);
    this.add(mesh);
  }

  static makeStarMaterial() {
    return new THREE.ShaderMaterial({
      vertexShader: `
// Paint Vertex Shader
varying vec3 vColor;
varying vec3 vNormal;
varying vec3 vIncident;
varying vec3 vModelPosition;

void main() {
  vModelPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vIncident = normalize(worldPosition.xyz - cameraPosition.xyz);
  vColor = vec3(1.0, 0.4, 0.8);
  vNormal = normalMatrix * normal;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
}`,
      fragmentShader: `
// Simplex Fragment Shader Code
// https://github.com/KdotJPG/OpenSimplex2/blob/master/glsl/OpenSimplex2.glsl

vec4 permute(vec4 t) {
  return t * (t * 34.0 + 133.0);
}
vec3 grad(float hash) {
  vec3 cube = mod(floor(hash / vec3(1.0, 2.0, 4.0)), 2.0) * 2.0 - 1.0;
  vec3 cuboct = cube;
  cuboct[int(hash / 16.0)] = 0.0;
  float type = mod(floor(hash / 8.0), 2.0);
  vec3 rhomb = (1.0 - type) * cube + type * (cuboct + cross(cube, cuboct));
  vec3 grad = cuboct * 1.22474487139 + rhomb;
  grad *= (1.0 - 0.042942436724648037 * type) * 32.80201376986577;
  return grad;
}

vec4 openSimplex2Base(vec3 X) {
  vec3 v1 = round(X);
  vec3 d1 = X - v1;
  vec3 score1 = abs(d1);
  vec3 dir1 = step(max(score1.yzx, score1.zxy), score1);
  vec3 v2 = v1 + dir1 * sign(d1);
  vec3 d2 = X - v2;
  vec3 X2 = X + 144.5;
  vec3 v3 = round(X2);
  vec3 d3 = X2 - v3;
  vec3 score2 = abs(d3);
  vec3 dir2 = step(max(score2.yzx, score2.zxy), score2);
  vec3 v4 = v3 + dir2 * sign(d3);
  vec3 d4 = X2 - v4;
  
  vec4 hashes = permute(mod(vec4(v1.x, v2.x, v3.x, v4.x), 289.0));
  hashes = permute(mod(hashes + vec4(v1.y, v2.y, v3.y, v4.y), 289.0));
  hashes = mod(permute(mod(hashes + vec4(v1.z, v2.z, v3.z, v4.z), 289.0)), 48.0);
  
  vec4 a = max(0.5 - vec4(dot(d1, d1), dot(d2, d2), dot(d3, d3), dot(d4, d4)), 0.0);
  vec4 aa = a * a; vec4 aaaa = aa * aa;
  vec3 g1 = grad(hashes.x); vec3 g2 = grad(hashes.y);
  vec3 g3 = grad(hashes.z); vec3 g4 = grad(hashes.w);
  vec4 extrapolations = vec4(dot(d1, g1), dot(d2, g2), dot(d3, g3), dot(d4, g4));
  
  vec3 derivative = -8.0 * mat4x3(d1, d2, d3, d4) * (aa * a * extrapolations)
      + mat4x3(g1, g2, g3, g4) * aaaa;
  
  return vec4(derivative, dot(aaaa, extrapolations));
}

vec4 openSimplex2_Conventional(vec3 X) {
  vec4 result = openSimplex2Base(dot(X, vec3(2.0/3.0)) - X);
  return vec4(dot(result.xyz, vec3(2.0/3.0)) - result.xyz, result.w);
}

// Lava Fragment Shader

uniform float time;
varying vec3 vColor;
varying vec3 vModelPosition;
varying vec3 vNormal;
varying vec3 vIncident;

vec4 brown(in vec3 x) {
  return (
    openSimplex2_Conventional(x) 
    + openSimplex2_Conventional(x * 2.0)
    + openSimplex2_Conventional(x * 4.0)
    + openSimplex2_Conventional(x * 8.0)
  );
}

void main() {
  vec4 c1 = brown(vModelPosition * 0.3); 
  c1 = brown(vec3(c1.xy * 0.05, time*0.1)) * 0.05 + 0.5;
  float intensity = dot(-vIncident, vNormal);

  mat3 m = mat3(
      1.0, 0.5, 0.01, 
      1.0, 0.5, 0.02, 
      1.0, 0.4, 0.03);
  vec3 crgb = m * c1.rgb * pow(intensity, 0.3);

  float whiteness = clamp(
    (intensity - 0.5) * 10.0 + length(crgb), 0.0, 1.0);
  vec3 white = vec3(1.0, 1.0, 1.0) * whiteness;


  gl_FragColor = vec4(crgb + white, 1.0) * 0.4;
}
      `,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: true,
      transparent: false,
      vertexColors: false,
      uniforms: {
        time: { value: 0.0 }
      }
    })
  }
  tick(t: Tick) {
    if (this.material !== null) {
      this.material.uniforms['time'].value = t.elapsedS;
      this.material.uniformsNeedUpdate = true;
    }
  }
}
