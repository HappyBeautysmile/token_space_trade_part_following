import * as THREE from "three";
import { S } from "../settings";

import { Codeable } from "./file";
import { PointCloud } from "./pointCloud";
import { PointSet } from "./pointSet";

export class Stars extends PointCloud implements Codeable, PointSet {
  constructor() {
    super();
  }

  private tmpV = new THREE.Vector3();
  getClosestDistance(p: THREE.Vector3): number {
    return this.starPositions.getClosestDistance(p);
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

  fallback(p: THREE.Vector3) {
    this.starPositions.clear();
    super.build(S.float('sr'), S.float('sr'), S.float('sr') / 10.0,
      S.float('ns'), new THREE.Color('#fff'), S.float('ss'),
      /*includeOrigin=*/false, /*initialIntensity=*/10);
    return this;
  }

}