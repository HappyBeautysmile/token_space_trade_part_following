import * as THREE from "three";
import { PointCloud } from "./pointCloud";

import { Tick, Ticker } from "./tick";

export type ModelFactory = (pos: THREE.Vector3) => THREE.Object3D;

export class ModelCloud extends THREE.Object3D implements Ticker {
  constructor(private factory: ModelFactory, private cloud: PointCloud,
    private showRadius: number, private camera: THREE.Object3D) {
    super();
    this.add(cloud);
  }

  private currentStarMap = new Map<THREE.Vector3, THREE.Object3D>();
  private p1 = new THREE.Vector3();

  tick(t: Tick) {
    this.camera.getWorldPosition(this.p1);
    this.worldToLocal(this.p1);

    const currentStars = new Set<THREE.Vector3>();
    for (const k of this.currentStarMap.keys()) {
      currentStars.add(k);
    }

    for (const closePoint of this.cloud.getAllWithinRadius(
      this.p1, this.showRadius)) {
      if (!this.currentStarMap.has(closePoint)) {
        const starSystem = this.factory(closePoint);
        starSystem.position.copy(closePoint);
        this.currentStarMap.set(closePoint, starSystem);
        this.add(starSystem);
        // Hide the star when we show the model.
        this.cloud.hideStar(closePoint);
        console.log(`Pop in: ${JSON.stringify(closePoint)}`)
      } else {
        currentStars.delete(closePoint);
      }
    }
    for (const tooFar of currentStars) {
      console.log(`Pop out: ${JSON.stringify(tooFar)}`)
      const starToRemove = this.currentStarMap.get(tooFar);
      this.remove(starToRemove);
      this.currentStarMap.delete(tooFar);
      this.cloud.showStar(tooFar);
    }
  }
}