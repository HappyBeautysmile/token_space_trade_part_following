import * as THREE from "three";
import { Debug } from "./debug";

export interface PointMap<T> {
  add(p: THREE.Vector3, value: T): void;
  elements(): Iterable<T>;
  getAllWithinRadius(p: THREE.Vector3, radius: number): Iterable<T>;
}

class PointKey<T> {
  constructor(readonly point: THREE.Vector3,
    readonly value: T) { }
}

export class PointMapLinear<T> implements PointMap<T> {
  private points: PointKey<T>[] = [];
  constructor() {
  }

  add(p: THREE.Vector3, value: T) {
    this.points.push(new PointKey(p, value));
  }

  *elements() {
    for (const kv of this.points) {
      yield kv.value;
    }
  }

  private p2 = new THREE.Vector3();
  *getAllWithinRadius(p: THREE.Vector3, radius: number): Iterable<T> {
    for (const kv of this.points) {
      this.p2.copy(kv.point);
      this.p2.sub(p);
      if (radius >= this.p2.length()) {
        yield kv.value;
      }
    }
  }
}

export class AABB {
  // Represents an Axis Aligned Bounding Box cube.
  constructor(readonly center: THREE.Vector3, readonly radius: number) {
  }

  private p = new THREE.Vector3();
  intersects(other: AABB): boolean {
    this.p.copy(other.center);
    this.p.sub(this.center);
    const distance = Math.max(
      Math.abs(this.p.x),
      Math.abs(this.p.y),
      Math.abs(this.p.z));
    return distance <= this.radius + other.radius + 0.001;
  }

  contains(point: THREE.Vector3) {
    this.p.copy(point);
    this.p.sub(this.center);
    const distance = Math.max(
      Math.abs(this.p.x),
      Math.abs(this.p.y),
      Math.abs(this.p.z));
    return distance <= this.radius + 0.001;
  }

  split(): AABB[] {
    const halfRadius = this.radius / 2;

    const children = [];
    for (const cx of [-halfRadius, halfRadius]) {
      for (const cy of [-halfRadius, halfRadius]) {
        for (const cz of [-halfRadius, halfRadius]) {
          const aabb = new AABB(
            new THREE.Vector3(
              cx + this.center.x,
              cy + this.center.y,
              cz + this.center.z), halfRadius);
          // console.log(`AABB: ${JSON.stringify(aabb)}`);
          children.push(aabb);
        }
      }
    }
    return children;
  }
}

export class PointMapOctoTree<T> implements PointMap<T> {
  private points: PointKey<T>[] = [];
  private children: PointMapOctoTree<T>[] = null;
  private bounds: AABB;

  constructor(center: THREE.Vector3, radius: number) {
    this.bounds = new AABB(center, radius);
  }

  add(p: THREE.Vector3, value: T) {
    Debug.assert(this.insert(p, value));
  }

  private p1 = new THREE.Vector3;
  private insert(p: THREE.Vector3, value: T): boolean {
    if (!this.bounds.contains(p)) {
      return false;
    }
    if (this.points) {
      this.points.push(new PointKey(p, value));
      if (this.points.length > 64) {
        this.split();
      }
      return true;
    } else {
      for (const c of this.children) {
        if (c.insert(p, value)) {
          return true;
        }
      }
      console.log(`${JSON.stringify(p)} is not in ${JSON.stringify(this.bounds)}`);
      console.log(`Failed to insert.`);
    }
  }

  private split() {
    const childBoxes = this.bounds.split();
    this.children = [];
    for (const c of childBoxes) {
      this.children.push(new PointMapOctoTree(c.center, c.radius));
    }
    for (const kv of this.points) {
      for (const c of this.children) {
        if (c.insert(kv.point, kv.value)) {
          break;
        }
      }
    }
    this.points = null;
  }

  *elements() {
    if (this.points) {
      return this.points;
    } else {
      for (const child of this.children) {
        yield* child.elements();
      }
    }
  }

  private *getAllWithinAABB(aabb: AABB): Iterable<PointKey<T>> {
    if (this.bounds.intersects(aabb)) {
      if (this.points) {
        for (const kv of this.points) {
          yield kv;
        }
      } else {
        for (const child of this.children) {
          yield* child.getAllWithinAABB(aabb);
        }
      }
    }
  }

  *getAllWithinRadius(p: THREE.Vector3, radius: number):
    Iterable<T> {
    const aabb = new AABB(p, radius);
    for (const kv of this.getAllWithinAABB(aabb)) {
      this.p1.copy(kv.point);
      this.p1.sub(p);
      if (this.p1.length() <= radius) {
        yield kv.value;
      }
    }
  }

}
