import * as THREE from "three";
import { LocationMap } from "./locationMap";

export class SimpleLocationMap<T> implements LocationMap<T> {
  private vectors = new Map<string, THREE.Vector3>();
  private data = new Map<string, T>();
  constructor() { }

  // Perhaps premature, but we cache the previous key for the somewhat
  // common case of calling "has" and then "delete"
  private previousV = new THREE.Vector3();
  private previousKey: string = this.toKey3(0, 0, 0);
  private toKey(position: THREE.Vector3): string {
    if (position.equals(this.previousV)) {
      return this.previousKey;
    }
    this.previousV.copy(position);
    this.previousKey = this.toKey3(position.x, position.y, position.z);
    return this.previousKey;
  }

  private toKey3(x: number, y: number, z: number) {
    return x.toFixed(0) + "," + y.toFixed(0) + "," + z.toFixed(0);
  }

  public has(position: THREE.Vector3): boolean {
    return this.data.has(this.toKey(position));
  }

  public has3(x: number, y: number, z: number): boolean {
    return this.data.has(this.toKey3(x, y, z));
  }

  public set(position: THREE.Vector3, value: T): void {
    const key = this.toKey(position);
    this.data.set(key, value);
    if (!this.vectors.has(key)) {
      const v = new THREE.Vector3(position.x, position.y, position.z);
      this.vectors.set(key, v);
    }
  }

  public set3(x: number, y: number, z: number, value: T): void {
    const key = this.toKey3(x, y, z);
    this.data.set(key, value);
    if (!this.vectors.has(key)) {
      const v = new THREE.Vector3(x, y, z);
      this.vectors.set(key, v);
    }
  }

  public get(position: THREE.Vector3): T {
    return this.data.get(this.toKey(position))
  }

  public get3(x: number, y: number, z: number): T {
    return this.data.get(this.toKey3(x, y, z));
  }

  public delete(position: THREE.Vector3): boolean {
    return this.data.delete(this.toKey(position));
  }

  public *values(): Iterable<T> {
    yield* this.data.values();
  }

  public *entries(): Iterable<[THREE.Vector3, T]> {
    for (const [key, value] of this.data.entries()) {
      yield [this.vectors.get(key), value];
    }
  }

  public getSize(): number {
    return this.data.size;
  }

  public clone(): SimpleLocationMap<T> {
    const result = new SimpleLocationMap<T>();
    for (const [pos, value] of this.entries()) {
      result.set(pos, value);
    }
    return result;
  }
}