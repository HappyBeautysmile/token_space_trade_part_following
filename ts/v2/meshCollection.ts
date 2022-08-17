import * as THREE from "three";
import { Matrix4 } from "three";
import { Tick, Ticker } from "../tick";
import { Assets } from "./assets";
import { Construction } from "./construction";
import { Grid } from "./grid";
import { IsoTransform } from "./isoTransform";
import { Latice } from "./latice";
import { LocationMap } from "./locationMap";
import { NeighborCount } from "./neighborCount";
import { PointMapOctoTree } from "./octoTree";
import { PointSet } from "./pointSet";
import { SimpleLocationMap } from "./simpleLocationMap";

class NameAndRotation {
  constructor(readonly name: string, readonly quaternion: THREE.Quaternion) {
  }
}

export class MeshCollection extends THREE.Object3D
  implements PointSet, Construction, Ticker {
  private rocks = new PointMapOctoTree<IsoTransform>(Grid.zero, 1e3);

  // Maps item names to corresponding materials and geometry.
  // This is used to create the appropriate Instanced Meshes.
  private materialMap = new Map<string, THREE.Material>();
  private geometryMap = new Map<string, THREE.BufferGeometry>();
  // The instances of InstancedMesh created for each item.
  private meshMap = new Map<string, THREE.InstancedMesh>();

  private cubes: Latice<string>;
  private quaternions = new SimpleLocationMap<THREE.Quaternion>();

  private t = new THREE.Vector3();
  private r = new THREE.Quaternion();
  private s = new THREE.Vector3();

  constructor(assets: Assets, radius: number) {
    super();
    const r = Math.ceil(radius);
    // Add a 5-cell padding.
    const origin = new THREE.Vector3(-r - 5, -r - 5, -r - 5);
    const edgeSize = 2 * r + 1 + 10;
    this.cubes = new Latice<string>(origin, edgeSize);

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

      // TODO: Consider MeshToonMaterial

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
  public addCube(name: string, tx: IsoTransform) {
    this.cubes.Set(tx.position, name);
    this.rocks.add(tx.position, tx);
    this.dirty = true;
  }

  public removeCube(position: THREE.Vector3): string {
    const name = this.cubes.Get(position);
    if (!!name) {
      this.cubes.Set(position, null);
      this.dirty = true;
      return name;
    }
    return null;
  }

  public cubeAt(p: THREE.Vector3): boolean {
    return !!this.cubes.Get(p);
  }

  public get(p: THREE.Vector3): string {
    return this.cubes.Get(p);
  }

  public buildGeometry() {
    this.children.splice(0);
    this.meshMap.clear();

    const nc = new NeighborCount();
    // console.log('Building mesh collection.');
    for (const cubeEntry of this.cubes.Entries()) {
      let tx: IsoTransform = new IsoTransform(
        cubeEntry.position, this.quaternions.get(cubeEntry.position));
      nc.set(tx, cubeEntry.value);
    }

    // Populate the neighbor mesh
    for (const [name, material] of this.materialMap.entries()) {
      const instancedMesh = new THREE.InstancedMesh(
        this.geometryMap.get(name), this.materialMap.get(name),
        nc.getCount(name));
      instancedMesh.count = 0;
      this.meshMap.set(name, instancedMesh);
      this.add(instancedMesh);
    }

    for (const mav of nc.externalElements()) {
      const name = mav.value;
      const tx = mav.tx;
      const instancedMesh = this.meshMap.get(name);
      if (instancedMesh) {
        const i = instancedMesh.count++;
        instancedMesh.setMatrixAt(i, tx.MakeMatrix());
      } else {
        console.log(`Error: no mesh for ${name}`);
      }
    }
  }

  tick(t: Tick) {
    if (this.dirty) {
      console.time(`Rebuilding`);
      this.buildGeometry();
      console.timeEnd(`Rebuilding`);
      this.dirty = false;
    }
  }

  serialize(): Object {
    const o = {};
    const positionMap = new Map<string, Object[]>();
    for (const laticeEntry of this.cubes.Entries()) {
      const name = laticeEntry.value;
      const p = laticeEntry.position;
      if (!positionMap.has(name)) positionMap.set(name, []);
      positionMap.get(name).push({ x: p.x, y: p.y, z: p.z });
    }
    for (const [name, rockPositions] of positionMap.entries()) {
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
        this.addCube(name, new IsoTransform(v, Grid.randomRotation()));
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
}