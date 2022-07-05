import * as THREE from "three";
import { S } from "../settings";

export class NebulaSphere extends THREE.Object3D {
  private material: THREE.ShaderMaterial;
  constructor() {
    super();
    this.material = this.makeMaterial();
    const mesh = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(1000, 3),
      this.material
    );
    this.add(mesh);
  }

  public updatePosition(pos: THREE.Vector3) {
    this.material.uniforms['pos'].value.copy(pos);
    this.material.uniformsNeedUpdate = true;
  }

  private makeMaterial(): THREE.ShaderMaterial {
    const material = new THREE.ShaderMaterial(
      {
        vertexShader: `
        varying vec3 vDirection;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vec4 mvPosition = viewMatrix * worldPosition;
          gl_Position = projectionMatrix * mvPosition;
          vDirection = worldPosition.xyz / length(worldPosition.xyz);
        }`,
        fragmentShader: `
#define kDistanceToScreen 1.0
#define kRaySteps ${S.float('rs').toFixed(0)}
#define kRayLength 10.0
#define kOrbitRadius 3.0

varying vec3 vDirection;

float noise3to1(in vec3 p) {
  const mat3 m = mat3(
    1.0, 0.0, 0.0,
    0.5, 1.2, 0.0,
    0.0, 0.0, 1.0);

  vec3 s = m * p;

  return sin(s.x) * sin(s.y) * sin(s.z);
}

vec3 noise3to3(in vec3 p) {
  return vec3(
    noise3to1(p.xyz + vec3(1, 2, 3) * vec3(0.9, 0.7, 1.3)),
    noise3to1(p.zyx + vec3(7, 9, 8) * vec3(0.5, 1.2, 1.1)),
    noise3to1(p.yxz + vec3(3, 2, 5) * vec3(0.8, 0.3, 1.5)));
}

vec3 brown(in vec3 p) {
  return 0.5 * noise3to3(p) + 0.2 * noise3to3(p * 3.0) + 0.1 * noise3to3(p * 5.0);

}

vec3 grey(in vec3 p) {
  return brown(brown(p * 0.1) * 5.0);
}

vec3 noise(in vec3 x) {
  float thickness2 = 25.0;
  float p = smoothstep(0.0, thickness2, thickness2 - (x.y * x.y));
  float radius = length(x);
  float q = smoothstep(8.0, 7.0, radius);
  return grey(x) * p * q;
}

uniform vec3 pos;
void main()
{
    vec3 step = vDirection * kRayLength / float(kRaySteps);
    vec3 col = vec3(0.0,0.0,0.0);
    vec3 scaledPos = pos * ${(8.0 / S.float('sr'))};
    for (int i = 0; i <= kRaySteps; ++i) {
      col += noise(scaledPos + step * float(i + 1));
    }
    col = smoothstep(0.0, 1.0, 5.0 * col / float(kRaySteps));
    gl_FragColor = vec4(col,1.0);
}`,
        uniforms: {
          pos: {
            value: new THREE.Vector3()
          }
        },
        depthWrite: false,
        depthTest: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }
    );

    return material;
  }

}