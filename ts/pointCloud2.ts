import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils";
import { PointCloud } from "./pointCloud";
import { PointMapOctoTree } from "./pointMap";
import { S } from "./settings";
import { Tick, Ticker } from "./tick";

export class PointCloud2 extends THREE.Object3D implements PointCloud, Ticker {
  readonly starPositions = new PointMapOctoTree<THREE.Vector3>(
    new THREE.Vector3(), 1e10);

  private material: THREE.ShaderMaterial;
  private geometry: THREE.BufferGeometry;

  constructor(radius: number, radiusSd: number, ySd: number,
    count: number, private color: THREE.Color, private pointRadius: number,
    private visibleDistance: number, includeOrigin = false) {
    super();
    if (includeOrigin) {
      const origin = new THREE.Vector3();
      this.starPositions.add(origin, origin);
    }
    this.addStars(radius, radiusSd, ySd, count, pointRadius);
  }

  public showStar(point: THREE.Vector3) {
    // TODO: Not implemented
  }

  public hideStar(point: THREE.Vector3) {
    // TODO: Not implemented
  }

  public getAllWithinRadius(point: THREE.Vector3, radius: number)
    : Iterable<THREE.Vector3> {
    return this.starPositions.getAllWithinRadius(point, radius);
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

  private addStar(
    x: number, y: number, z: number, pointRadius: number,
    index: number[],
    vertices: number[],
    colors: number[],
    dxy: number[],
    r: number[]
  ) {
    const pos = new THREE.Vector3(x, y, z);
    this.starPositions.add(pos, pos);
    const o = Math.round(vertices.length / 3);
    index.push(o + 0, o + 1, o + 2, o + 2, o + 3, o + 0);
    const c = new THREE.Color(
      Math.random() * 0.2 + 0.8 * this.color.r,
      Math.random() * 0.2 + 0.8 * this.color.g,
      Math.random() * 0.2 + 0.8 * this.color.b);
    for (let i = 0; i < 4; ++i) {
      vertices.push(x, y, z);
      colors.push(c.r, c.g, c.b);
      vertices.push();
    }
    dxy.push(-1, -1, 1, -1, 1, 1, -1, 1);
    r.push(pointRadius, pointRadius, pointRadius, pointRadius)
  }

  private addStars(radius: number, radiusSd: number, ySd: number, count: number,
    pointRadius: number) {
    const index: number[] = [];
    const vertices: number[] = [];
    const colors: number[] = [];
    const dxy: number[] = [];
    const r: number[] = [];

    for (let i = 0; i < count; ++i) {
      const orbitalRadius = PointCloud2.gaussian(radiusSd) + radius;
      const orbitalHeight = PointCloud2.gaussian(ySd);
      const theta = Math.random() * Math.PI * 2;
      this.addStar(
        orbitalRadius * Math.cos(theta),
        orbitalHeight,
        orbitalRadius * Math.sin(theta),
        pointRadius,
        index, vertices, colors, dxy, r);
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(vertices), 3));
    this.geometry.setAttribute('color',
      new THREE.BufferAttribute(new Float32Array(colors), 3));
    this.geometry.setAttribute('dxy',
      new THREE.BufferAttribute(new Float32Array(dxy), 2));
    this.geometry.setAttribute('r',
      new THREE.BufferAttribute(new Float32Array(r), 1));
    this.geometry.setIndex(index);

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        'sizeScale': { value: 1.0 },
      },
      vertexShader: `
        attribute vec2 dxy;
        attribute float r;
        varying vec3 vColor;
        varying vec2 vDxy;
        varying float vIntensity;
        void main() {
          vDxy = dxy;
          vColor = color;
          vIntensity = 1.0;
          float sizeScale = 1.0;

          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          float distance = length(worldPosition.xyz / worldPosition.w);
          if (distance > 500.0 * r) {
            sizeScale *= distance / (500.0 * r);
            vIntensity = 1.0 / sizeScale;
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
        float intensity = vIntensity * clamp(10.0 - 10.0 * length(vDxy), 0.0, 1.0);
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