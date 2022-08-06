import { IsoTransform } from "./isoTransform";

export interface Construction {
  // Adds an object to this collection.
  addCube(name: string, tx: IsoTransform): void;
  cubeAt(p: THREE.Vector3): boolean
}
