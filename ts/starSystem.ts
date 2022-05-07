import * as THREE from "three";
import { ModelCloud } from "./modelCloud";
import { PlanetPlatform } from "./planetPlatform";
import { PointCloud } from "./pointCloud";
import { S } from "./settings";
import { Tick, Ticker } from "./tick";

export class StarSystem extends THREE.Object3D implements Ticker {
  private material: THREE.ShaderMaterial;

  constructor(camera: THREE.Camera) {
    super();
    this.material = StarSystem.makeStarMaterial();
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(1, 2),
      this.material);
    mesh.scale.setLength(1e3);
    this.add(mesh);

    const belt = new PointCloud(
      /*radius=*/S.float('ar'),
      /*radiusSd=*/S.float('ar') / 10, /*ySd=*/S.float('ar') / 20,
      S.float('na'), new THREE.Color('#888'),
      /*pointRadius=*/1e2);
    this.add(belt);

    const planets = new PointCloud(
      /*radius=*/S.float('ar'),
      /*radiusSd=*/S.float('ar') * 3, /*ySd=*/S.float('ar') / 2,
      10, new THREE.Color('#8ff'),
      /*pointRadius=*/1e3);
    const planetModelCloud = new ModelCloud((pos: THREE.Vector3) => {
      return new PlanetPlatform(pos, camera);
    }, planets, /*showRadius=*/1e6,
      camera)

    this.add(planets);

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
// Sinplex
float mono(in vec3 v) {
  return(sin(v.x + 17.2) * sin(v.y + 72.9) * sin(v.z + 29.1));
}

vec3 noise(in vec3 x) {
  x = mat3(
    1.0, 0.0, 0.0,
    0.5, 0.866, 0.289,
    0.5, 0.0, 0.866) * x;
  return(vec3(mono(x.xxy + x.yzz), mono(x.xyy + x.zzx + 4123.1), mono(x.yyz + x.zxx + 3213.1)));
}

vec3 brown(in vec3 v) {
  return(1.0 * noise(v) + 0.5 * noise(v * 2.0 + 827.2) + 0.33 * noise(v * 3.0 + 3182.7));
}

vec3 orange(in vec3 v) {
  return brown(brown(v * 0.4) * 3.0);
}

vec3 green(in vec3 v) {
  return orange(orange(v * 0.5) * 3.0);
}

// Lava Fragment Shader

uniform float time;
varying vec3 vColor;
varying vec3 vModelPosition;
varying vec3 vNormal;
varying vec3 vIncident;

void main() {
  vec3 c1 = green(vModelPosition * 0.9 + time * 0.2) * 0.5 + 0.5; 
  // float intensity = dot(-vIncident, vNormal);
  float intensity = 1.0;  // TODO: Fix vIncident!

  mat3 m = mat3(
      1.0, 0.5, 0.01, 
      1.0, 0.5, 0.02, 
      1.0, 0.4, 0.03);
  vec3 crgb = m * c1.rgb * pow(intensity, 0.3);

  // float whiteness = clamp(
  //   (intensity - 0.5) * 10.0 + length(crgb), 0.0, 1.0);
  float whiteness = 0.0;
  vec3 white = vec3(1.0, 1.0, 1.0) * whiteness;

  gl_FragColor = vec4(crgb + white, 1.0);
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
