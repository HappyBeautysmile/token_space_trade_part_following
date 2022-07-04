import * as THREE from "three";

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

  *elements(): Iterable<T> {
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

  clear() {
    this.points.splice(0);
    this.children = null;
  }

  add(p: THREE.Vector3, value: T) {
    this.insert(p, value);
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

  *elements(): Iterable<T> {
    if (this.points) {
      for (const kv of this.points) {
        yield kv.value;
      }
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

  private tmpV = new THREE.Vector3();

  // private getClosestKV(p: THREE.Vector3): PointKey<T> {
  //   let closestDistance = Infinity;
  //   let closestKV: PointKey<T> = undefined;
  //   if (this.points) {
  //     for (const kv of this.points) {
  //       this.tmpV.copy(p);
  //       this.tmpV.sub(kv.point);
  //       const distance = this.tmpV.length();
  //       if (distance < closestDistance) {
  //         closestKV = kv;
  //         closestDistance = distance;
  //       }
  //     }
  //     return closestKV;
  //   } else {
  //     // First, traverse children to find the right bucket
  //     let bucket: PointMapOctoTree<T> = this;
  //     while (!!bucket.children) {
  //       for (const child of bucket.children) {
  //         if (child.bounds.contains(p)) {
  //           bucket = child;
  //           break;
  //         }
  //       }
  //     }
  //     // Second, find the closest in that bucket
  //     closestKV = bucket.getClosestKV(p);

  //     // Third, find all points within that radius
  //     this.tmpV.copy(p);
  //     this.tmpV.sub(closestKV.point);
  //     const aabb = new AABB(p, this.tmpV.length());
  //     for (const kv of this.getAllWithinAABB(aabb)) {
  //       this.tmpV.copy(kv.point);
  //       this.tmpV.sub(p);
  //       const distance = this.tmpV.length();
  //       if (distance < closestDistance) {
  //         closestDistance = distance;
  //         closestKV = kv;
  //       }
  //     }
  //     // Return the closest of those points
  //     return closestKV;
  //   }
  // }

  // getClosest(p: THREE.Vector3): T {
  //   return this.getClosestKV(p).value;
  // }

  public getClosestDistance(p: THREE.Vector3): number {
    let closestDistance = Infinity;
    if (this.points) {
      for (const kv of this.points) {
        this.tmpV.copy(p);
        this.tmpV.sub(kv.point);
        const distance = this.tmpV.length();
        if (distance < closestDistance) {
          closestDistance = distance;
        }
      }
      return closestDistance;
    } else {
      // First, traverse children to find the right bucket
      let bucket: PointMapOctoTree<T> = this;
      while (!!bucket.children) {
        for (const child of bucket.children) {
          if (child.bounds.contains(p)) {
            bucket = child;
            break;
          }
        }
      }
      // If the bucket is empty, just return something approximate.
      if (bucket.points.length == 0) {
        return bucket.bounds.radius * 2;
      }

      // Second, find the closest in that bucket
      closestDistance = bucket.getClosestDistance(p);

      // Third, find all points within that radius
      const aabb = new AABB(p, closestDistance);
      for (const kv of this.getAllWithinAABB(aabb)) {
        this.tmpV.copy(kv.point);
        this.tmpV.sub(p);
        const distance = this.tmpV.length();
        if (distance < closestDistance) {
          closestDistance = distance;
        }
      }
      // Return the closest of those points
      return closestDistance;
    }
  }

}