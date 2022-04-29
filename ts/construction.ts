import * as THREE from "three";
import { Codec } from "./codec";
import { FileIO } from "./fileIO";

export class Construction {
  // TODO: Make this private and instead have some nicer methods for
  // inserting and deleting.  This is where code to make sure we have only
  // one block per location would go, also where Vector3 to key would go.
  readonly allObjects = new Map<string, THREE.Object3D>();

  public save() {
    console.log('Saving...');
    //const o = { 'size': this.allObjects.size };
    //o['objects'] = FileIO.mapToObject(this.allObjects);
    let c = new Codec();
    const o = c.toSaveFormat(this.allObjects)
    FileIO.saveObject(o, "what_you_built.json");
  }

  // TODO: change this to private and fix the code that breaks.
  public posToKey(p: THREE.Vector3): string {
    return `${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)}`;
  }

  public addCube(o: THREE.Object3D) {
    const key = this.posToKey(o.position);
    this.allObjects.set(key, o);
  }

  public removeCube(o: THREE.Object3D) {

  }

}