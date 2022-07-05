import * as THREE from "three";
import { Vector3 } from "three";
import { S } from "../settings";

import { Codeable } from "./file";
import { Grid } from "./grid";
import { PointMapOctoTree } from "./octoTree";
import { PointSet } from "./pointSet";

export class Asteroid extends THREE.Object3D implements Codeable, PointSet {
  private rocks = new PointMapOctoTree<THREE.Vector3>(Grid.zero, 1e3);
  constructor() {
    super();
  }
  serialize(): Object {
    const o = {};
    const rockPositions = [];
    for (const p of this.rocks.elements()) {
      rockPositions.push({ x: p.x, y: p.y, z: p.z });
    }
    o['rockPositions'] = rockPositions;
    return o;
  }

  private tmpV = new THREE.Vector3();
  getClosestDistance(p: THREE.Vector3): number {
    this.tmpV.copy(p);
    this.tmpV.sub(this.position);  // Astroid relative to System
    this.tmpV.sub(this.parent.position);  // System relative to Universe
    const distance = this.rocks.getClosestDistance(this.tmpV);
    return distance;
  }

  private buildGeometry() {
    this.children.splice(0);
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxBufferGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: '#4ff', emissive: 0.5 }),
      this.rocks.getSize()
    );
    let index = 0;
    for (const v of this.rocks.elements()) {
      const m = new THREE.Matrix4();
      m.identity();
      m.makeTranslation(v.x, v.y, v.z);
      mesh.setMatrixAt(index, m);
      ++index;
    }
    this.add(mesh);
  }

  deserialize(o: Object): this {
    this.rocks.clear();
    for (const p of o['rockPositions']) {
      const v = new THREE.Vector3(p.x, p.y, p.z);
      this.rocks.add(v, v);
    }
    this.buildGeometry();
    return this;
  }

  private gridPosition() {
    return Math.round((Math.random() - 0.5) * 200);
  }

  fallback(p: THREE.Vector3) {
    this.rocks.clear();
    for (let i = 0; i < S.float('ni'); ++i) {
      const pos = new Vector3(
        this.gridPosition(), this.gridPosition(), this.gridPosition());
      this.rocks.add(pos, pos);
    }
    this.buildGeometry();
    return this;
  }
}