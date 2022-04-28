import * as THREE from "three";

export interface PointSet {
  add(p: THREE.Vector3): void;
  elements(): Iterable<THREE.Vector3>;
  getAllWithinRadius(p: THREE.Vector3, radius: number): Iterable<THREE.Vector3>;
}

export class PointSetLinear implements PointSet {
  private points: THREE.Vector3[] = [];
  constructor() {
  }

  add(p: THREE.Vector3) {
    this.points.push(p);
  }

  elements() {
    return this.points;
  }

  private p2 = new THREE.Vector3();
  *getAllWithinRadius(p: THREE.Vector3, radius: number): Iterable<THREE.Vector3> {

    for (const starPosition of this.points) {
      this.p2.copy(starPosition);
      this.p2.sub(p);
      if (radius >= this.p2.length()) {
        yield starPosition;
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
    return distance <= this.radius + other.radius;
  }

  contains(point: THREE.Vector3) {
    this.p.copy(point);
    this.p.sub(this.center);
    const distance = Math.max(
      Math.abs(this.p.x),
      Math.abs(this.p.y),
      Math.abs(this.p.z));
    return distance <= this.radius;
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

export class PointSetOctoTree implements PointSet {
  private points: THREE.Vector3[] = [];
  private children: PointSetOctoTree[] = null;
  private bounds: AABB;

  constructor(center: THREE.Vector3, radius: number) {
    this.bounds = new AABB(center, radius);
  }

  add(p: THREE.Vector3) {
    console.assert(this.insert(p));
  }

  private p1 = new THREE.Vector3;
  private insert(p: THREE.Vector3): boolean {
    if (!this.bounds.contains(p)) {
      return false;
    }
    if (this.points) {
      this.points.push(p);
      if (this.points.length > 64) {
        this.split();
      }
      return true;
    } else {
      for (const c of this.children) {
        if (c.insert(p)) {
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
      this.children.push(new PointSetOctoTree(c.center, c.radius));
    }
    for (const p of this.points) {
      for (const c of this.children) {
        if (c.insert(p)) {
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

  private *getAllWithinAABB(aabb: AABB): Iterable<THREE.Vector3> {
    if (this.bounds.intersects(aabb)) {
      if (this.points) {
        yield* this.points;
      } else {
        for (const child of this.children) {
          yield* child.getAllWithinAABB(aabb);
        }
      }
    }
  }

  *getAllWithinRadius(p: THREE.Vector3, radius: number):
    Iterable<THREE.Vector3> {
    const aabb = new AABB(p, radius);
    for (const pp of this.getAllWithinAABB(aabb)) {
      this.p1.copy(pp);
      this.p1.sub(p);
      if (this.p1.length() <= radius) {
        yield pp;
      }
    }
  }

}
