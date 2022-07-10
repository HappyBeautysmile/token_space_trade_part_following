import * as THREE from "three";

export class MatrixAnd<T> {
  constructor(readonly m: THREE.Matrix4, readonly value: T) { }
}

export class NeighborCount<T> {
  constructor() { }

  private position = new THREE.Vector3();
  private rotation = new THREE.Quaternion();
  private scale = new THREE.Vector3();

  private neighborCount = new Map<string, number>();
  private data = new Map<string, MatrixAnd<T>>();

  private toKey(position: THREE.Vector3) {
    return `${[position.x, position.y, position.z]}`;
  }

  private tmp = new THREE.Vector3();
  public set(m: THREE.Matrix4, value: T) {
    m.decompose(this.position, this.rotation, this.scale);
    for (let dx = -1; dx <= 1; ++dx) {
      for (let dy = -1; dy <= 1; ++dy) {
        for (let dz = -1; dz <= 1; ++dz) {
          this.tmp.copy(this.position);
          this.tmp.x += dx;
          this.tmp.y += dy;
          this.tmp.z += dz;
          const key = this.toKey(this.tmp)
          if (this.neighborCount.has(key)) {
            this.neighborCount.set(key, this.neighborCount.get(key) + 1);
          } else {
            this.neighborCount.set(key, 1);
          }
        }
      }
    }
    this.data.set(this.toKey(this.position),
      new MatrixAnd<T>(m, value));
  }

  public *allElements() {
    yield* this.data.values();
  }

  public *externalElements() {
    for (const [key, matrixAndT] of this.data.entries()) {
      if (this.neighborCount.get(key) < 27) {
        yield matrixAndT;
      }
    }
  }
}