import * as THREE from "three";

import { LocationMap } from "./locationMap";
import { SimpleLocationMap } from "./simpleLocationMap";

class Action<T> {
  private position;
  private constructor(position: THREE.Vector3, private value: T) {
    if (!position) {
      this.position = null;
    } else {
      this.position = new THREE.Vector3();
      this.position.copy(position);
    }
  }

  static makeMark<T>() {
    return new Action<T>(null, null);
  }

  static makeDelete<T>(position: THREE.Vector3) {
    return new Action<T>(position, null);
  }

  static makeSet<T>(position: THREE.Vector3, value: T) {
    return new Action<T>(position, value);
  }

  isMark(): boolean {
    return this.position === null;
  }

  apply(m: LocationMap<T>) {
    if (!this.position) {
      throw new Error("This is a mark and cannot be applied.");
    } else if (!this.value) {
      m.delete(this.position);
    } else {
      m.set(this.position, this.value);
    }
  }
}


export class JournalingLocationMap<T> implements LocationMap<T> {
  private data = new SimpleLocationMap<T>();
  private undoActions: Action<T>[] = [];
  constructor() { }

  setMark(): void {
    this.undoActions.push(Action.makeMark<T>());
  }

  // Reverts the underlying state to the previous mark and deletes that
  // mark. 
  undoToMark(): void {
    if (this.undoActions.length === 0) {
      throw new Error("Nothing to undo!");
    }
    do {
      const a = this.undoActions.pop();
      if (a.isMark()) {
        return;
      }
      a.apply(this.data);
    } while (true);
  }

  has(position: THREE.Vector3): boolean {
    return this.data.has(position);
  }
  has3(x: number, y: number, z: number): boolean {
    return this.data.has3(x, y, z);
  }

  private addUndo3(x: number, y: number, z: number) {
    if (!this.data.has3(x, y, z)) {
      this.undoActions.push(Action.makeDelete<T>(new THREE.Vector3(x, y, z)));
    } else {
      const oldValue = this.data.get3(x, y, z);
      this.undoActions.push(
        Action.makeSet<T>(new THREE.Vector3(x, y, z), oldValue));
    }
  }

  set(position: THREE.Vector3, value: T): void {
    this.addUndo3(position.x, position.y, position.z);
    this.data.set(position, value);
  }
  set3(x: number, y: number, z: number, value: T): void {
    this.addUndo3(x, y, z);
    this.data.set3(x, y, z, value);
  }
  get(position: THREE.Vector3): T {
    return this.data.get(position);
  }
  get3(x: number, y: number, z: number): T {
    return this.data.get3(x, y, z);
  }
  delete(position: THREE.Vector3): boolean {
    this.addUndo3(position.x, position.y, position.z);
    return this.data.delete(position);
  };
  values(): Iterable<T> {
    return this.data.values();
  }
  entries(): Iterable<[THREE.Vector3, T]> {
    return this.data.entries();
  }
  getSize(): number {
    return this.data.getSize();
  }
}