import * as THREE from "three";
import { PointMapOctoTree } from "./pointMap";
import { S } from "./settings";
import { Tick, Ticker } from "./tick";

export class PointCloud extends THREE.Object3D implements Ticker {
  readonly starPositions = new PointMapOctoTree<THREE.Vector3>(
    new THREE.Vector3(), 1e10);
  private material: THREE.ShaderMaterial;

  constructor(radius: number, radiusSd: number, ySd: number,
    count: number, private color: THREE.Color, private pointRadius: number) {
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
        'sizeScale': { value: 1.0 },
        'uColor': { value: this.color },
      },
      vertexShader: `
        uniform float sizeScale;
        varying float vDistance;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDistance = abs(mvPosition.z);
          if (vDistance > 1000.0) {
            mvPosition.xyz = mvPosition.xyz * (1000.0 / vDistance);
          }
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = max(sizeScale * 800.0 / vDistance, 2.0);
          
        }`,
      fragmentShader: `
      uniform vec3 uColor;
      varying float vDistance;
      void main() {
        vec2 coords = gl_PointCoord;
        float intensity = clamp(
          10.0 * (0.5 - length(gl_PointCoord - 0.5)), 0.0, 1.0);
        float brightness = clamp(${S.float('pbf').toFixed(1)} / vDistance, 0.1, 1.0);
        vec3 color = uColor;
        gl_FragColor = vec4(uColor * intensity * brightness, 1.0);
      }`,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: false,
      vertexColors: false,
      clipping: false,
    });

    const points = new THREE.Points(geometry, this.material);
    this.add(points);
  }

  // private worldPosition = new THREE.Vector3();
  // private worldRotation = new THREE.Quaternion();
  private worldScale = new THREE.Vector3();
  tick(t: Tick) {
    this.worldScale.setFromMatrixScale(this.matrixWorld);
    this.material.uniforms['sizeScale'].value =
      this.worldScale.x * this.pointRadius;
    this.material.uniformsNeedUpdate = true;
  }

}