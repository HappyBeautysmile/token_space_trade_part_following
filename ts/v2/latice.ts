import * as THREE from "three";

export class Latice<T> {
  private keyToCode = new Map<T, number>();
  private codeToKey = new Map<number, T>();
  readonly origin = new THREE.Vector3();
  private data: Uint8Array;

  // `origin` is the lower left corner of the region in space.
  // `edgeSize` is the number of buckets.  So, if you want a cube 
  // centered at the origin with a radius of 10, you would specify:
  // new Latice<YourType>(new THRE.Vector3(-10, -10, -10), 21);
  // This allows for positions from -10 to +10 (inclusive) which
  // is a total of 21 positions.
  constructor(origin: THREE.Vector3, private edgeSize: number) {
    this.origin.copy(origin);
    this.data = new Uint8Array(edgeSize * edgeSize * edgeSize);
    this.codeToKey.set(0, null);
  }

  private getIndex(x: number, y: number, z: number): number {
    return x + y * this.edgeSize + z * this.edgeSize * this.edgeSize;
  }

  private getIndexFromVector(v: THREE.Vector3) {
    return this.getIndex(
      Math.round(v.x), Math.round(v.y), Math.round(v.z));
  }

  Get(pos: THREE.Vector3): T {
    const index = this.getIndexFromVector(pos);
    return this.codeToKey.get(this.data[index]);
  }

  Set(pos: THREE.Vector3, value: T) {
    let code: number;
    if (!this.keyToCode.has(value)) {
      code = this.codeToKey.size;
      this.keyToCode.set(value, code);
      this.codeToKey.set(code, value);
    } else {
      code = this.keyToCode.get(value);
    }
    const index = this.getIndexFromVector(pos);
    this.data[index] = code;
  }
}
