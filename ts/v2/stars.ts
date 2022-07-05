import * as THREE from "three";
import { S } from "../settings";

import { Codeable, File } from "./file";
import { PointCloud } from "./pointCloud";
import { PointCloudUnion, PointSet } from "./pointSet";
import { System } from "./system";

export class Stars extends PointCloud implements Codeable, PointSet {
  private activeSystems = new Map<THREE.Vector3, System>();

  constructor() {
    super(true);
  }

  private tmpV = new THREE.Vector3();
  getClosestDistance(p: THREE.Vector3): number {
    this.tmpV.copy(p);
    this.tmpV.sub(this.position);
    return this.starPositions.getClosestDistance(this.tmpV);
  }

  private tmpSet = new Set<THREE.Vector3>();
  public handlePops(universe: THREE.Object3D, allPoints: PointCloudUnion) {
    this.tmpV.copy(universe.position);
    this.tmpV.multiplyScalar(-1);
    const previousSize = this.activeSystems.size;
    this.tmpSet.clear();
    for (const star of this.starPositions.getAllWithinRadius(
      this.tmpV, S.float('sp'))) {
      this.tmpSet.add(star);
    }
    const toRemove: THREE.Vector3[] = [];
    for (const k of this.activeSystems.keys()) {
      if (!this.tmpSet.has(k)) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) {
      const oldSystem = this.activeSystems.get(k);
      this.remove(oldSystem);
      allPoints.delete(oldSystem);
      this.activeSystems.delete(k);
    }
    for (const k of this.tmpSet) {
      if (!this.activeSystems.has(k)) {
        const system = new System();
        const name = `System:${Math.round(k.x)},${Math.round(k.y)},${Math.round(k.z)}`;
        File.load(system, name, k);
        this.activeSystems.set(k, system);
        this.add(system);
        system.position.copy(k);
        allPoints.add(system);
      }
    }
    if (previousSize != this.activeSystems.size) {
      console.log(`New size: ${this.activeSystems.size}`);
    }
    for (const activeSystem of this.activeSystems.values()) {
      activeSystem.handlePops(universe, allPoints);
    }
  }

  serialize(): Object {
    const o = {};
    const positions = [];
    for (const p of this.starPositions.elements()) {
      positions.push({ x: p.x, y: p.y, z: p.z });
    }
    o['starPositions'] = positions;
    return o;
  }

  deserialize(o: Object): this {
    this.starPositions.clear();
    for (const p of o['starPositions']) {
      const v = new THREE.Vector3(p.x, p.y, p.z);
      this.starPositions.add(v, v);
    }
    this.addStars(new THREE.Color('#fff'), S.float('ss'),
    /*initialIntensity=*/50);
    return this;
  }

  private zero = new THREE.Vector3();
  fallback(p: THREE.Vector3) {
    this.starPositions.clear();
    super.build(p,
      S.float('sr'), S.float('sr'), S.float('sr') / 10.0,
      S.float('ns'), new THREE.Color('#fff'), S.float('ss'),
      /*includeOrigin=*/false, /*initialIntensity=*/10);
    return this;
  }

}