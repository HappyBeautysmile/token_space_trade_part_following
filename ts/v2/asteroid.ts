import * as THREE from "three";
import { Vector3 } from "three";
import { S } from "../settings";

import { Codeable } from "./file";

export class Asteroid extends THREE.Object3D implements Codeable {
  private asteroids = new Set<THREE.Vector3>();
  constructor() {
    super();
  }
  serialize(): Object {
    const o = {};
    const asteroidPositions = [];
    for (const p of this.asteroids) {
      asteroidPositions.push({ x: p.x, y: p.y, z: p.z });
    }
    o['asteroidPositions'] = asteroidPositions;
    return o;
  }

  private buildGeometry() {
    this.children.splice(0);
    const mesh = new THREE.InstancedMesh(
      new THREE.BoxBufferGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: '#4ff', emissive: 0.5 }),
      this.asteroids.size
    );
    let index = 0;
    for (const v of this.asteroids) {
      const m = new THREE.Matrix4();
      m.identity();
      m.makeTranslation(v.x, v.y, v.z);
      mesh.setMatrixAt(index, m);
      ++index;
    }
    this.add(mesh);
  }

  deserialize(o: Object): this {
    this.asteroids.clear();
    for (const p of o['asteroidPositions']) {
      const v = new THREE.Vector3(p.x, p.y, p.z);
      this.asteroids.add(v);
    }
    this.buildGeometry();
    return this;
  }

  private gridPosition() {
    return Math.round((Math.random() - 0.5) * 200);
  }

  fallback(p: THREE.Vector3) {
    this.asteroids.clear();
    for (let i = 0; i < S.float('ni'); ++i) {
      this.asteroids.add(new Vector3(
        this.gridPosition(), this.gridPosition(), this.gridPosition()));
    }
    this.buildGeometry();
    return this;
  }
}