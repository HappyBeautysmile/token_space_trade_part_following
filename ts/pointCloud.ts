import * as THREE from "three";
import { PointMapOctoTree } from "./pointMap";
import { Tick, Ticker } from "./tick";

export class PointCloud extends THREE.Object3D implements Ticker {
  readonly starPositions = new PointMapOctoTree<THREE.Vector3>(
    new THREE.Vector3(), 1e10);
  private material: THREE.ShaderMaterial;

  constructor(radius: number, radiusSd: number, ySd: number, count: number) {
    super();
    this.addStars(radius, radiusSd, ySd, count)
  }

  private static gaussian(sd: number): number {
    const n = 6;
    let x = 0;
    for (let i = 0; i < n; ++i) {
      x += Math.random();
      x -= Math.random();
    }
    return sd * (x / Math.sqrt(n));
  }

  private addStars(radius: number, radiusSd: number, ySd: number, count: number) {
    const positions: number[] = [];
    for (let i = 0; i < count; ++i) {
      const orbitalRadius = PointCloud.gaussian(radiusSd) + radius;
      const orbitalHeight = PointCloud.gaussian(ySd);
      const theta = Math.random() * Math.PI * 2;
      const v = new THREE.Vector3(
        orbitalRadius * Math.cos(theta),
        orbitalHeight,
        orbitalRadius * Math.sin(theta));
      this.starPositions.add(v, v);
      positions.push(v.x, v.y, v.z);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',
      new THREE.Float32BufferAttribute(positions, 3));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        'sizeScale': {
          value: 1.0
        },
      },
      vertexShader: `
        uniform float sizeScale;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float distance = abs(mvPosition.z);
          if (distance > 1000.0) {
            mvPosition.xyz = mvPosition.xyz * (1000.0 / distance);
          }
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = max(sizeScale * 800.0 / distance, 2.0);
          
        }`,
      fragmentShader: `
      void main() {
        vec3 c = vec3(1.0, 1.0, 1.0);
        vec2 coords = gl_PointCoord;
        float intensity = 2.0 * (0.5 - length(gl_PointCoord - 0.5));
        gl_FragColor = vec4(c.rgb * intensity, 1.0);
      }`,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: false,
      vertexColors: false,
    });

    const points = new THREE.Points(geometry, this.material);
    this.add(points);
  }

  // private worldPosition = new THREE.Vector3();
  // private worldRotation = new THREE.Quaternion();
  private worldScale = new THREE.Vector3();
  tick(t: Tick) {
    this.worldScale.setFromMatrixScale(this.matrixWorld);
    this.material.uniforms['sizeScale'].value = this.worldScale.x;
    this.material.uniformsNeedUpdate = true;
  }

}