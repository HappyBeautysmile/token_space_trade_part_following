import * as THREE from "three";
import { PointMapOctoTree } from "./pointMap";
import { S } from "./settings";
import { Tick, Ticker } from "./tick";

export class PointCloud extends THREE.Object3D implements Ticker {
  readonly starPositions = new PointMapOctoTree<THREE.Vector3>(
    new THREE.Vector3(), 1e10);
  private material: THREE.ShaderMaterial;
  private pointIndex = new Map<THREE.Vector3, number>();
  private geometry: THREE.BufferGeometry;

  constructor(radius: number, radiusSd: number, ySd: number,
    count: number, private color: THREE.Color, private pointRadius: number,
    private visibleDistance: number) {
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

  public showStar(point: THREE.Vector3) {
    const colorAttribute =
      this.geometry.getAttribute('color');
    colorAttribute.setXYZ(
      this.pointIndex.get(point), this.color.r, this.color.g, this.color.b);
    colorAttribute.needsUpdate = true;
  }

  public hideStar(point: THREE.Vector3) {
    const colorAttribute =
      this.geometry.getAttribute('color');
    colorAttribute.setXYZ(
      this.pointIndex.get(point), 0, 0, 0);
    colorAttribute.needsUpdate = true;
  }

  private addStars(radius: number, radiusSd: number, ySd: number, count: number) {
    const positions: number[] = [];
    const colors: number[] = [];
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
      colors.push(this.color.r, this.color.g, this.color.b);
      this.pointIndex.set(v, i);
    }
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position',
      new THREE.Float32BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(
      colors, 3));

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        'sizeScale': { value: 1.0 },
      },
      vertexShader: `
        varying vec3 vColor;
        uniform float sizeScale;
        varying float vDistance;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vDistance = abs(mvPosition.z);
          if (vDistance > 1000.0) {
            mvPosition.xyz = mvPosition.xyz * (1000.0 / vDistance);
          }
          gl_Position = projectionMatrix * mvPosition;
          gl_PointSize = max(sizeScale * 800.0 / vDistance, 2.0);
          
        }`,
      fragmentShader: `
      varying vec3 vColor;
      varying float vDistance;
      void main() {
        vec2 coords = gl_PointCoord;
        float intensity = clamp(
          10.0 * (0.5 - length(gl_PointCoord - 0.5)), 0.0, 1.0);
        float brightness = 
          (${this.visibleDistance.toFixed(1)} - vDistance) /
          (${this.visibleDistance.toFixed(1)} + vDistance);
        brightness = clamp(brightness * brightness, 0.0, 1.0);
        gl_FragColor = vec4(vColor * intensity * brightness, 1.0);
      }`,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: false,
      vertexColors: true,
      clipping: false,
    });

    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3, 1e30);

    const points = new THREE.Points(this.geometry, this.material);
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