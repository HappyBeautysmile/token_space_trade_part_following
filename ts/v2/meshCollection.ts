import * as THREE from "three";
import { Matrix4 } from "three";
import { Tick, Ticker } from "../tick";
import { Assets } from "./assets";
import { Construction } from "./construction";
import { Grid } from "./grid";
import { Latice } from "./latice";
import { NeighborCount } from "./neighborCount";
import { PointMapOctoTree } from "./octoTree";
import { PointSet } from "./pointSet";

export class MeshCollection extends THREE.Object3D
  implements PointSet, Construction, Ticker {
  private rocks = new PointMapOctoTree<THREE.Vector3>(Grid.zero, 1e3);

  // Maps item names to corresponding materials and geometry.
  // This is used to create the appropriate Instanced Meshes.
  private materialMap = new Map<string, THREE.Material>();
  private geometryMap = new Map<string, THREE.BufferGeometry>();
  // The instances of InstancedMesh created for each item.
  private meshMap = new Map<string, THREE.InstancedMesh>();

  private cubes: Latice<string>;

  private t = new THREE.Vector3();
  private r = new THREE.Quaternion();
  private s = new THREE.Vector3();

  private origin = new THREE.Vector3;

  constructor(assets: Assets, radius: number) {
    super();
    const r = Math.ceil(radius);
    this.origin.set(-r, -r, -r);
    this.cubes = new Latice<string>(this.origin, r);

    for (const name of assets.names()) {
      const mesh = assets.getMesh(name);
      // console.log(`Mesh: ${mesh.name}`);
      let oldMaterial = mesh.material as THREE.Material;
      let newMaterial = oldMaterial;
      if (oldMaterial.type === 'MeshPhysicalMaterial') {
        let m = oldMaterial as THREE.MeshPhysicalMaterial;
        // console.log(m);
        newMaterial = new THREE.MeshPhongMaterial({
          color: m.color,
          shininess: 1.0,
          emissive: m.emissive,
        });
      }
      const geometry = mesh.geometry.clone();
      mesh.matrix.decompose(this.t, this.r, this.s);
      geometry.scale(this.s.x, this.s.y, this.s.z);
      this.defineItem(name, geometry, newMaterial);
    }
  }

  private tmpV = new THREE.Vector3();
  public getClosestDistance(p: THREE.Vector3): number {
    this.tmpV.copy(p);
    this.tmpV.sub(this.position);  // Astroid relative to System
    this.tmpV.sub(this.parent.position);  // System relative to Universe
    const distance = this.rocks.getClosestDistance(this.tmpV);
    return distance;
  }

  private dirty = false;
  public addCube(name: string,
    position: THREE.Vector3, rotation: THREE.Quaternion) {
    const m = new Matrix4();
    m.compose(position, rotation, Grid.one);
    this.cubes.Set(position, name);
    this.rocks.add(position, position);
    const key = this.locationKey(position);
    if (this.cubeMap.has(key)) {
      throw new Error("There is already a cube here.");
    }
    this.cubeMap.set(this.locationKey(position), name);
    this.dirty = true;
  }

  public removeCube(position: THREE.Vector3): string {
    const key = this.locationKey(position);
    if (this.cubeMap.has(key)) {
      this.cubes.Set(position, null);
      const name = this.cubeMap.get(key);
      this.cubeMap.delete(key);
      this.dirty = true;
      return name;
    }
  }

  public cubeAt(p: THREE.Vector3): boolean {
    return this.cubeMap.has(this.locationKey(p));
  }

  public buildGeometry() {
    this.children.splice(0);
    this.meshMap.clear();

    const nc = new NeighborCount<string>();
    // console.log('Building mesh collection.');

    // Populate the neighbor mesh
    for (const [name, material] of this.materialMap.entries()) {
      const instancedMesh = new THREE.InstancedMesh(
        this.geometryMap.get(name), this.materialMap.get(name),
        matricies.length);
      instancedMesh.count = 0;
      for (let i = 0; i < matricies.length; ++i) {
        // TODO: If it's not a "solid" cube, we shouldn't add it.
        nc.set(matricies[i], name);
      }
      this.meshMap.set(name, instancedMesh);
      this.add(instancedMesh);
    }

    for (const mav of nc.externalElements()) {
      const name = mav.value;
      const matrix = mav.m;
      const instancedMesh = this.meshMap.get(name);
      const i = instancedMesh.count++;
      instancedMesh.setMatrixAt(i, matrix);
    }
  }

  tick(t: Tick) {
    if (this.dirty) {
      this.buildGeometry();
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
        this.addCube(name, v, Grid.notRotated);
      }
    }
    this.buildGeometry();
    return this;
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

  private cubeMap = new Map<string, string>();
  private locationKey(v: THREE.Vector3) {
    return `${[v.x.toFixed(0), v.y.toFixed(0), v.z.toFixed(0)]}`;
  }

}