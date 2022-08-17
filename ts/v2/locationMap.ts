import * as THREE from "three";

export interface LocationMap<T> {
  has(position: THREE.Vector3): boolean;
  has3(x: number, y: number, z: number): boolean;
  set(position: THREE.Vector3, value: T): void;
  set3(x: number, y: number, z: number, value: T): void;
  get(position: THREE.Vector3): T;
  get3(x: number, y: number, z: number): T;
  delete(position: THREE.Vector3): boolean;
  values(): Iterable<T>;
  entries(): Iterable<[THREE.Vector3, T]>;
  getSize(): number;
}