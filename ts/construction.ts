import * as THREE from "three";
import { Codec, Encode } from "./codec";
import { FileIO } from "./fileIO";

export interface Construction {
  // Adds an object to this collection.
  addCube(o: THREE.Object3D): void;
  removeCube(p: THREE.Vector3): void;
  save(): void;
}

export class ObjectConstruction implements Construction {
  public constructor(private container: THREE.Object3D) { }
  // TODO: Make this private and instead have some nicer methods for
  // inserting and deleting.  This is where code to make sure we have only
  // one block per location would go, also where Vector3 to key would go.
  private allObjects = new Map<string, THREE.Object3D>();

  public save() {
    console.log('Saving...');
    //const o = { 'size': this.allObjects.size };
    //o['objects'] = FileIO.mapToObject(this.allObjects);
    let c = new Codec();
    const o = Encode.arrayOfObject3D(this.allObjects.values())
    FileIO.saveObject(o, "what_you_built.json");
  }

  // TODO: change this to private and fix the code that breaks.
  public posToKey(p: THREE.Vector3): string {
    return `${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)}`;
  }

  public addCube(o: THREE.Object3D) {
    const key = this.posToKey(o.position);
    this.allObjects.set(key, o);
    this.container.add(o);
  }

  public removeCube(p: THREE.Vector3): void {
    const key = this.posToKey(p);
    if (this.allObjects.has(key)) {
      const o = this.allObjects.get(key);
      console.assert(o.parent === this.container, 'Invalid parent!');
      this.container.remove(o);
      this.allObjects.delete(key);
    }
  }
}