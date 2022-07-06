export interface Construction {
  // Adds an object to this collection.
  addCube(name: string,
    position: THREE.Vector3, rotation: THREE.Quaternion): void;
  cubeAt(p: THREE.Vector3): boolean
}
