import * as THREE from "three";

export class Latice<T> {
  private keyToCode = new Map<T, number>();
  private codeToKey = new Map<number, T>();
  readonly origin = new THREE.Vector3();
  private data: Uint8Array;
  constructor(origin: THREE.Vector3, private edgeSize: number) {
    this.origin.copy(origin);
    this.data = new Uint8Array(edgeSize * edgeSize * edgeSize);
    this.codeToKey.set(0, null);
  }

  private getIndex(x: number, y: number, z: number): number {
    return x + y * this.edgeSize + z * this.edgeSize * this.edgeSize;
  }

  Get(pos: THREE.Vector3): T {
    const x = Math.round(pos.x - this.origin.x);
    const y = Math.round(pos.y - this.origin.y);
    const z = Math.round(pos.z - this.origin.z);
    return this.codeToKey.get(this.data[this.getIndex(x, y, z)]);
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

  }
}
