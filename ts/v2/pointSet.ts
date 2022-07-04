import * as THREE from "three";

import { PointCloud } from "./pointCloud";


export interface PointSet {
  getClosestDistance(p: THREE.Vector3): number;
}

export class PointCloudUnion implements PointSet {
  private pointSets = new Set<PointSet>();

  constructor() {
  }

  add(ps: PointSet) {
    this.pointSets.add(ps);
  }

  delete(ps: PointSet) {
    this.pointSets.delete(ps);
  }

  getClosestDistance(p: THREE.Vector3): number {
    let closestDistance = Infinity;
    for (const ps of this.pointSets) {
      const distance = ps.getClosestDistance(p);
      if (distance < closestDistance) {
        closestDistance = distance;
      }
    }
    return closestDistance;
  }

}