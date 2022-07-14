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

  private toKey(x: number, y: number, z: number) {
    return `${[x, y, z]}`;
  }

  private addOrIncrement(key: string, m: Map<string, number>) {
    if (m.has(key)) {
      m.set(key, m.get(key) + 1);
    } else {
      m.set(key, 1);
    }
  }

  private tmp = new THREE.Vector3();
  public set(m: THREE.Matrix4, value: T) {
    m.decompose(this.position, this.rotation, this.scale);
    this.addOrIncrement(
      this.toKey(this.position.x, this.position.y, this.position.z + 1),
      this.neighborCount);
    this.addOrIncrement(
      this.toKey(this.position.x, this.position.y, this.position.z - 1),
      this.neighborCount);
    this.addOrIncrement(
      this.toKey(this.position.x, this.position.y + 1, this.position.z),
      this.neighborCount);
    this.addOrIncrement(
      this.toKey(this.position.x, this.position.y - 1, this.position.z),
      this.neighborCount);
    this.addOrIncrement(
      this.toKey(this.position.x + 1, this.position.y, this.position.z),
      this.neighborCount);
    this.addOrIncrement(
      this.toKey(this.position.x - 1, this.position.y, this.position.z),
      this.neighborCount);

    this.data.set(this.toKey(
      this.position.x, this.position.y, this.position.z),
      new MatrixAnd<T>(m, value));
  }

  public *allElements() {
    yield* this.data.values();
  }

  public *externalElements() {
    for (const [key, matrixAndT] of this.data.entries()) {
      if (this.neighborCount.get(key) < 6) {
        yield matrixAndT;
      }
    }
  }
}