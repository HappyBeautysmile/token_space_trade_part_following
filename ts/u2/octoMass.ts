import * as THREE from "three";

export class Content {
  constructor(readonly mass: number) { }
}


export class OctoMass {

  private children: OctoMass[] = null;

  constructor(
    readonly center: THREE.Vector3,
    readonly radius: number, readonly content: Content) {
  }

  private capacity(): number {
    return this.radius * this.radius * this.radius * 8;
  }

  // Sets the children of this OctoMass
  private subdivide() {
    const childMass = new Float32Array(8);
    const childCapacity = this.capacity() / 8;
    let remainingMass = this.content.mass;

    const numPidgeons = 2; // 8 * (1 + Math.log2(this.radius));
    const massPerPidgeon = Math.ceil(this.content.mass / numPidgeons);

    while (remainingMass > 0) {
      const pigeonMass = Math.min(massPerPidgeon, remainingMass);
      const slot = Math.trunc(Math.random() * 8);
      const oldMass = childMass[slot];
      const delta = Math.min(pigeonMass, childCapacity - oldMass);
      childMass[slot] += delta;
      remainingMass -= delta;
    }

    this.children = [];
    const hr = this.radius / 2;  // half radius
    for (const dx of [-hr, hr]) {
      for (const dy of [-hr, hr]) {
        for (const dz of [-hr, hr]) {
          const center = new THREE.Vector3(dx, dy, dz);
          center.add(this.center);
          this.children.push(
            new OctoMass(center, hr,
              new Content(childMass[this.children.length])));
        }
      }
    }
  }

  private static tmp = new THREE.Vector3();
  public *elementsNear(pos: THREE.Vector3): Iterable<OctoMass> {
    if (this.content.mass == 0) {
      return;
    }
    OctoMass.tmp.copy(pos);
    OctoMass.tmp.sub(this.center);
    if (this.radius <= 0.5 ||
      OctoMass.tmp.length() / this.radius > 500) {
      yield this;
    } else {
      if (!this.children) {
        this.subdivide();
      }
      for (const c of this.children) {
        yield* c.elementsNear(pos);
      }
    }
  }
}