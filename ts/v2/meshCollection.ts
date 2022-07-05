import * as THREE from "three";
import { Matrix4 } from "three";
import { Grid } from "./grid";
import { PointMapOctoTree } from "./octoTree";
import { PointSet } from "./pointSet";


export class MeshCollection extends THREE.Object3D implements PointSet {
  private rocks = new PointMapOctoTree<THREE.Vector3>(Grid.zero, 1e3);

  private materialMap = new Map<string, THREE.Material>();
  private geometryMap = new Map<string, THREE.BufferGeometry>();
  private matrixMap = new Map<string, THREE.Matrix4[]>();
  private meshMap = new Map<string, THREE.InstancedMesh>();

  constructor() {
    super();
    this.defineItem('cube', new THREE.BoxBufferGeometry(1, 1),
      new THREE.MeshPhongMaterial(
        { color: '#88f', shininess: 0.6, emissive: 0.5 }));
    this.defineItem('sphere', new THREE.IcosahedronBufferGeometry(0.5, 3),
      new THREE.MeshPhongMaterial(
        { color: '#88f', shininess: 0.6, emissive: 0.5 }));
  }


  private tmpV = new THREE.Vector3();
  getClosestDistance(p: THREE.Vector3): number {
    this.tmpV.copy(p);
    this.tmpV.sub(this.position);  // Astroid relative to System
    this.tmpV.sub(this.parent.position);  // System relative to Universe
    const distance = this.rocks.getClosestDistance(this.tmpV);
    return distance;
  }

  private defineItem(name: string, geometry: THREE.BufferGeometry,
    material: THREE.Material) {
    this.geometryMap.set(name, geometry);
    this.materialMap.set(name, material);
  };

  private addOrSet<T>(key: string, value: T, map: Map<string, T[]>) {
    if (map.has(key)) {
      map.get(key).push(value);
    } else {
      map.set(key, [value]);
    }
  }

  public addItem(name: string,
    position: THREE.Vector3, rotation: THREE.Quaternion) {
    const m = new Matrix4();
    m.compose(position, rotation, Grid.one);
    this.addOrSet(name, m, this.matrixMap);
    this.rocks.add(position, position);
  }

  public buildGeometry() {
    this.children.splice(0);
    this.meshMap.clear();
    for (const [name, matricies] of this.matrixMap.entries()) {
      const instancedMesh = new THREE.InstancedMesh(
        this.geometryMap.get(name), this.materialMap.get(name),
        matricies.length);
      for (let i = 0; i < matricies.length; ++i) {
        instancedMesh.setMatrixAt(i, matricies[i]);
      }
      this.meshMap.set(name, instancedMesh);
      this.add(instancedMesh);
    }
  }

  serialize(): Object {
    const o = {};
    const p = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    for (const [name, matricies] of this.matrixMap.entries()) {
      const rockPositions = [];
      for (const matrix of matricies) {
        matrix.decompose(p, q, s);
        rockPositions.push({ x: p.x, y: p.y, z: p.z });

      }
      o[`${name}Positions`] = rockPositions;
    }
    return o;
  }

  deserialize(o: Object): this {
    this.rocks.clear();
    for (const name of this.geometryMap.keys()) {
      const key = `${name}Positions`;
      const positions = o[key];
      if (!positions) {
        continue;
      }
      for (const p of positions) {
        const v = new THREE.Vector3(p.x, p.y, p.z);
        this.addItem(name, v, Grid.notRotated);
      }
    }
    this.buildGeometry();
    return this;
  }
}