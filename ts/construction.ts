import * as THREE from "three";
import { FileIO } from "./fileIO";

export class Construction {
  // TODO: Make this private and instead have some nicer methods for
  // inserting and deleting.  This is where code to make sure we have only
  // one block per location would go, also where Vector3 to key would go.
  readonly allObjects = new Map<string, THREE.Object3D>();

  public save() {
    console.log('Saving...');
    const o = { 'size': this.allObjects.size };
    o['objects'] = FileIO.mapToObject(this.allObjects);
    FileIO.saveObject(o, "what_you_built.json");
  }
}