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

  private addOrChange(key: string, m: Map<string, number>, delta: number) {
    if (m.has(key)) {
      m.set(key, m.get(key) + delta);
    } else {
      m.set(key, Math.max(0, delta));
    }
  }

  private applyDelta(delta: number) {
    this.addOrChange(
      this.toKey(this.position.x, this.position.y, this.position.z + 1),
      this.neighborCount, delta);
    this.addOrChange(
      this.toKey(this.position.x, this.position.y, this.position.z - 1),
      this.neighborCount, delta);
    this.addOrChange(
      this.toKey(this.position.x, this.position.y + 1, this.position.z),
      this.neighborCount, delta);
    this.addOrChange(
      this.toKey(this.position.x, this.position.y - 1, this.position.z),
      this.neighborCount, delta);
    this.addOrChange(
      this.toKey(this.position.x + 1, this.position.y, this.position.z),
      this.neighborCount, delta);
    this.addOrChange(
      this.toKey(this.position.x - 1, this.position.y, this.position.z),
      this.neighborCount, delta);
  }

  public setVector(pos: THREE.Vector3, value: T, matrix: THREE.Matrix4) {
    let m = matrix;
    if (!m) {
      m = new THREE.Matrix4();
      m.makeTranslation(pos.x, pos.y, pos.z);
    }
    const key = this.toKey(pos.x, pos.y, pos.z);
    const hasKey = this.data.has(key);
    this.data.set(key, new MatrixAnd<T>(m, value));
    if (!hasKey) this.applyDelta(1);
  }

  public set(m: THREE.Matrix4, value: T) {
    m.decompose(this.position, this.rotation, this.scale);
    this.setVector(this.position, value, m);
  }

  public reset(m: THREE.Matrix4, value: T) {
    m.decompose(this.position, this.rotation, this.scale);
    const key = this.toKey(
      this.position.x, this.position.y, this.position.z);
    if (this.data.delete(key)) this.applyDelta(-1);
  }

  public *allElements() {
    yield* this.data.values();
  }

  public *externalElements() {
    console.log(`Enumerating neighbor count...`);
    for (const [key, matrixAndT] of this.data.entries()) {
      if (this.neighborCount.get(key) < 6) {
        yield matrixAndT;
      }
    }
  }
}