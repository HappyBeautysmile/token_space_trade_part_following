import * as THREE from "three";
import { Codec, Encode } from "./codec";
import { Debug } from "./debug";
import { FileIO } from "./fileIO";
import { InWorldItem } from "./inWorldItem";
import { MergedGeometryContainer } from "./megedGeometryContainer";

export interface Construction {
  // Adds an object to this collection.
  addCube(o: InWorldItem): void;
  removeCube(p: THREE.Vector3): void;
  save(): void;
}

export class ObjectConstruction implements Construction {
  public constructor(private container: THREE.Object3D) { }
  // TODO: Make this private and instead have some nicer methods for
  // inserting and deleting.  This is where code to make sure we have only
  // one block per location would go, also where Vector3 to key would go.
  private items = new Map<string, InWorldItem>();
  private objects = new Map<string, THREE.Object3D>();

  public save() {
    console.log('Saving...');
    //const o = { 'size': this.allObjects.size };
    //o['objects'] = FileIO.mapToObject(this.allObjects);
    let c = new Codec();
    const o = Encode.arrayOfInWorldItems(this.items.values())
    FileIO.saveObject(o, "what_you_built.json");
  }

  private posToKey(p: THREE.Vector3): string {
    return `${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)}`;
  }

  // TODO: Change the input type to InWorldItem.
  public addCube(o: InWorldItem) {
    const key = this.posToKey(o.position);
    this.items.set(key, o);
    const object = o.getObject();
    object.position.copy(o.position);
    object.quaternion.copy(o.quaternion);
    Debug.assert(!!object);
    this.objects.set(key, object);
    this.container.add(object);
  }

  // TODO: Return the InWorldItem.
  public removeCube(p: THREE.Vector3): void {
    const key = this.posToKey(p);
    if (this.objects.has(key)) {
      const o = this.objects.get(key);
      Debug.assert(o.parent === this.container, 'Invalid parent!');
      this.container.remove(o);
      this.items.delete(key);
      this.objects.delete(key);
    }
  }
}

export class MergedConstruction implements Construction {
  private mergedContainer = new MergedGeometryContainer();
  public constructor(container: THREE.Object3D) {
    container.add(this.mergedContainer);
  }
  private items = new Map<string, InWorldItem>();

  public save() {
    console.log('Saving...');
    let c = new Codec();
    const o = Encode.arrayOfInWorldItems(this.items.values())
    FileIO.saveObject(o, "what_you_built.json");
  }

  private posToKey(p: THREE.Vector3): string {
    return `${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)}`;
  }

  // TODO: Change the input type to InWorldItem.
  public addCube(o: InWorldItem) {
    const key = this.posToKey(o.position);
    this.items.set(key, o);
    const object = o.getObject();
    Debug.assert(!!object);
    object.position.copy(o.position);
    object.quaternion.copy(o.quaternion);
    this.mergedContainer.mergeIn(key, object);
  }

  // TODO: Return the InWorldItem.
  public removeCube(p: THREE.Vector3): void {
    const key = this.posToKey(p);
    this.mergedContainer.removeKey(key);
  }
}