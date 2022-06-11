import * as THREE from "three";
import { Container } from "./construction";
import { MergedGeometryContainer } from "./mergedGeometryContainer";
import { Tick, Ticker } from "./tick";


export class UnionGeometryContainer extends THREE.Object3D implements Container {
  private childContainers = new Map<string, Container>();
  private locatedObjects = new Map<string, string>();

  constructor() {
    super();
  }

  private locationKey(location: THREE.Vector3) {
    const x = Math.round(location.x / 10);
    const y = Math.round(location.y / 10);
    const z = Math.round(location.z / 10);
    return `${x.toFixed(0)},${y.toFixed(0)},${z.toFixed(0)}`;
  }

  addObject(key: string, object: THREE.Object3D): void {
    const locationKey = this.locationKey(object.position);
    if (!this.childContainers.has(locationKey)) {
      const newContainer = new MergedGeometryContainer();
      this.childContainers.set(locationKey, newContainer);
      this.add(newContainer);
    }
    this.locatedObjects.set(key, locationKey);
    this.childContainers.get(locationKey).addObject(key, object);
  }
  removeObject(key: string): void {
    if (!this.locatedObjects.has(key)) {
      return;
    }
    const locationKey = this.locatedObjects.get(key);
    this.childContainers.get(locationKey).removeObject(key);
  }
}