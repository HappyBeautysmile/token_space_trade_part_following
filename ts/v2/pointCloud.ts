import * as THREE from "three";

import { PointMapOctoTree } from "./octoTree";

export class PointCloud extends THREE.Object3D {
  readonly starPositions = new PointMapOctoTree<THREE.Vector3>(
    new THREE.Vector3(), 1e10);
  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;
  private starIndex = new Map<THREE.Vector3, number>();

  constructor() {
    super();
  }

  build(radius: number, radiusSd: number, ySd: number,
    count: number, color: THREE.Color, pointRadius: number,
    includeOrigin, initialIntensity: number) {
    if (includeOrigin) {
      const origin = new THREE.Vector3();
      this.starPositions.add(origin, origin);
    }
    this.generateStarPositions(radius, radiusSd, ySd, count);
    this.addStars(color, pointRadius, initialIntensity);
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

  public setStarAlpha(p: THREE.Vector3, alpha: number) {
    if (!this.starIndex.has(p)) {
      throw new Error("No such point.");
    }
    const alphaAttribute = this.geometry.getAttribute('alpha');
    const index = this.starIndex.get(p);
    alphaAttribute.setX(index, alpha);
    alphaAttribute.needsUpdate = true;
    this.geometry.setAttribute('alpha', alphaAttribute);
    console.log(`Alpha: ${index} = ${alphaAttribute.getX(index)}`)
  }

  private addStar(
    pos: THREE.Vector3,
    color: THREE.Color,
    pointRadius: number,
    index: number[],
    vertices: number[],
    colors: number[],
    dxy: number[],
    r: number[],
    alpha: number[],
  ) {

    const o = Math.round(vertices.length / 3);
    index.push(o + 0, o + 1, o + 2, o + 2, o + 3, o + 0);
    const c = new THREE.Color(
      Math.random() * 0.2 + 0.8 * color.r,
      Math.random() * 0.2 + 0.8 * color.g,
      Math.random() * 0.2 + 0.8 * color.b);
    for (let i = 0; i < 4; ++i) {
      vertices.push(pos.x, pos.y, pos.z);
      colors.push(c.r, c.g, c.b);
      vertices.push();
    }
    dxy.push(-1, -1, 1, -1, 1, 1, -1, 1);
    r.push(pointRadius, pointRadius, pointRadius, pointRadius);
    alpha.push(1.0, 1.0, 1.0, 1.0);
  }

  private generateStarPositions(
    radius: number, radiusSd: number,
    ySd: number, count: number) {
    for (let i = 0; i < count; ++i) {
      const orbitalRadius = PointCloud.gaussian(radiusSd) + radius;
      const orbitalHeight = PointCloud.gaussian(ySd);
      const theta = Math.random() * Math.PI * 2;
      const pos = new THREE.Vector3(
        orbitalRadius * Math.cos(theta),
        orbitalHeight,
        orbitalRadius * Math.sin(theta));
      this.starPositions.add(pos, pos);
    }
  }

  public addStars(color: THREE.Color, pointRadius: number,
    initialIntensity: number) {
    const index: number[] = [];
    const vertices: number[] = [];
    const colors: number[] = [];
    const dxy: number[] = [];
    const r: number[] = [];
    const alpha: number[] = [];

    let starIndex = 0;
    for (const v of this.starPositions.elements()) {
      this.addStar(v, color, pointRadius, index, vertices, colors, dxy,
        r, alpha);
      this.starIndex.set(v, starIndex);
      ++starIndex;
    }

    this.children.splice(0);
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(vertices), 3));
    this.geometry.setAttribute('color',
      new THREE.BufferAttribute(new Float32Array(colors), 3));
    this.geometry.setAttribute('dxy',
      new THREE.BufferAttribute(new Float32Array(dxy), 2));
    this.geometry.setAttribute('r',
      new THREE.BufferAttribute(new Float32Array(r), 1));
    this.geometry.setAttribute('alpha',
      new THREE.BufferAttribute(new Float32Array(alpha), 1));
    this.geometry.setIndex(index);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        'sizeScale': { value: 1.0 },
      },
      vertexShader: `
        attribute vec2 dxy;
        attribute float r;
        attribute float alpha;
        varying vec3 vColor;
        varying vec2 vDxy;
        varying float vIntensity;
        void main() {
          vDxy = dxy;
          vColor = color;
          vIntensity = ${initialIntensity.toFixed(2)} * alpha;
          float sizeScale = 1.0;

          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          float distance = length(worldPosition.xyz / worldPosition.w);
          if (distance > 500.0 * r) {
            sizeScale *= distance / (500.0 * r);
            vIntensity *= 1.0 / sizeScale;
          }
          if (distance > 100.0) {
            worldPosition.xyz *= 100.0 / distance;
            sizeScale *= 100.0 / distance;
          }
          vec4 mvPosition = viewMatrix * worldPosition;
          mvPosition += sizeScale * r * vec4(dxy, 0.0, 0.0);

          gl_Position = projectionMatrix * mvPosition;
        }`,
      fragmentShader: `
      varying float vIntensity;
      varying vec3 vColor;
      varying vec2 vDxy;
      void main() {
        float intensity = vIntensity * clamp(10.0 - 10.0 * length(vDxy),
          0.0, 1.0);
        gl_FragColor = vec4(vColor * intensity, 1.0);
      }`,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      depthWrite: false,
      transparent: false,
      vertexColors: true,
      clipping: false,
      clipIntersection: false,
      clippingPlanes: [],
      side: THREE.DoubleSide,
    });

    this.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e30);

    const points = new THREE.Mesh(this.geometry, this.material);
    this.add(points);
  }
}