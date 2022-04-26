import * as THREE from "three";

export interface PointSet {
  add(p: THREE.Vector3): void;
  getClosest(p: THREE.Vector3): THREE.Vector3;
  elements(): Iterable<THREE.Vector3>;
}

export class PointSetLinear implements PointSet {
  private points: THREE.Vector3[] = [];
  constructor(private radius: number) {
  }

  add(p: THREE.Vector3) {
    this.points.push(p);
  }

  elements() {
    return this.points;
  }

  private p2 = new THREE.Vector3();
  private closest = new THREE.Vector3();
  getClosest(p: THREE.Vector3): THREE.Vector3 {
    let closestDistance = 2 * this.radius;
    for (const starPosition of this.points) {
      this.p2.copy(starPosition);
      this.p2.sub(p);
      if (closestDistance > this.p2.length()) {
        closestDistance = this.p2.length();
        this.closest.copy(starPosition);
      }
    }
    return this.closest;
  }
}

export class PointSetOctoTree implements PointSet {
  private points: THREE.Vector3[] = [];
  private children: PointSetOctoTree[] = null;
  private center: THREE.Vector3 = new THREE.Vector3();

  constructor(center: THREE.Vector3, readonly radius: number) {
    this.center.copy(center);
  }

  add(p: THREE.Vector3) {
    console.assert(this.insert(p));
  }

  private p1 = new THREE.Vector3;
  private insert(p: THREE.Vector3): boolean {
    // console.log(`Insert ${JSON.stringify(p)} into ${this.center}`);
    this.p1.copy(this.center);
    this.p1.sub(p);
    const r = Math.max(
      Math.abs(this.p1.x), Math.abs(this.p1.y), Math.abs(this.p1.z));
    if (r > this.radius) {
      return false;
    }
    if (this.points) {
      this.points.push(p);
      if (this.points.length > 2) {
        this.split();
      }
      return true;
    } else {
      for (const c of this.children) {
        if (c.insert(p)) {
          return true;
        }
      }
      console.log(`${JSON.stringify(p)} is not in ${JSON.stringify(this.center)}`);
      console.log(`Failed to insert.`);
    }
  }

  private split() {
    const halfRadius = this.radius / 2;
    this.children = [];
    for (const cx of [-halfRadius, halfRadius]) {
      for (const cy of [-halfRadius, halfRadius]) {
        for (const cz of [-halfRadius, halfRadius]) {
          this.children.push(new PointSetOctoTree(
            new THREE.Vector3(cx, cy, cz), halfRadius));
        }
      }
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

  private p2 = new THREE.Vector3();
  private closest = new THREE.Vector3();

  private getClosestPoint(p: THREE.Vector3): THREE.Vector3 {
    let closestDistance = this.radius * 3;
    for (const starPosition of this.points) {
      this.p2.copy(starPosition);
      this.p2.sub(p);
      if (closestDistance > this.p2.length()) {
        closestDistance = this.p2.length();
        this.closest.copy(starPosition);
      }
    }
    return this.closest;
  }

  getClosest(p: THREE.Vector3): THREE.Vector3 {
    if (this.points) {
      return this.getClosestPoint(p);
    } else {
      let closestDistance = this.radius * 4;
      let closestOcto: PointSetOctoTree;
      for (const child of this.children) {
        this.p2.copy(child.center);
        this.p2.sub(p);
        if (closestDistance > this.p2.length()) {
          closestOcto = child;
          closestDistance = this.p2.length();
        }
      }
      console.log(`Closest distance: ${closestDistance}`);
      return closestOcto.getClosest(p);
    }
  }
}
