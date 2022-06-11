import * as THREE from "three";
import { Item } from "./assets";
import { Codec, Encode, Decode } from "./codec";
import { Debug } from "./debug";
import { FileIO } from "./fileIO";
import { InWorldItem } from "./inWorldItem";
import { S } from "./settings";
import { UnionGeometryContainer } from "./unionGeometryContainer";

export interface Construction {
  // Adds an object to this collection.
  addCube(o: InWorldItem): void;
  removeCube(p: THREE.Vector3): Item;
  cubeAt(p: THREE.Vector3): boolean
  save(): void;
  saveToLocal(): void;
  loadFromLocal(): void;
}

export interface Container {
  addObject(key: string, object: THREE.Object3D): void;
  removeObject(key: string): void;
}

class GroupContainer implements Container {
  private objects = new Map<string, THREE.Object3D>();
  constructor(private container: THREE.Object3D) { }
  addObject(key: string, object: THREE.Object3D): void {
    this.container.add(object);
    this.objects.set(key, object);
  }
  removeObject(key: string): void {
    this.container.remove(this.objects.get(key));
    this.objects.delete(key);
  }
}

export class ObjectConstruction implements Construction {
  private container: Container;
  public constructor(container: THREE.Object3D, private renderer: THREE.Renderer) {
    if (S.float('m')) {
      const geometryContainer = new UnionGeometryContainer();
      this.container = geometryContainer;
      container.add(geometryContainer);
    } else {
      this.container = new GroupContainer(container);
    }
  }
  // TODO: Make this private and instead have some nicer methods for
  // inserting and deleting.  This is where code to make sure we have only
  // one block per location would go, also where Vector3 to key would go.
  private items = new Map<string, InWorldItem>();
  private objects = new Map<string, THREE.Object3D>();

  public save() {
    console.log('Saving...');
    let c = new Codec();
    const o = Encode.arrayOfInWorldItems(this.items.values())
    FileIO.saveObjectAsJson(o, "what_you_built.json");
    //FileIO.saveImage(this.renderer.domElement, "test.jpg");
  }

  public saveToLocal() {
    let c = new Codec();
    const o = Encode.arrayOfInWorldItems(this.items.values())
    window.localStorage.setItem("items", JSON.stringify(o));
  }

  public loadFromLocal() {
    const loaded = window.localStorage.getItem("items");
    if (loaded) {
      for (const inWorldItem of JSON.parse(loaded)) {
        const iwi = Decode.toInWorldItem(inWorldItem);
        if (!this.cubeAt(iwi.position)) {
          this.addCube(iwi);
        }
      }
    }
  }

  private posToKey(p: THREE.Vector3): string {
    return `${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)}`;
  }

  public addCube(o: InWorldItem) {
    const key = this.posToKey(o.position);
    this.items.set(key, o);
    const object = o.getMesh();
    Debug.assert(!!object);
    object.position.copy(o.position);
    object.quaternion.copy(o.quaternion);
    this.objects.set(key, object);
    this.container.addObject(key, object);
  }

  // Return Item if there is an item at the location.  Otherwise, return null.
  public removeCube(p: THREE.Vector3): Item {
    const key = this.posToKey(p);
    let item: Item = null;
    let o = new THREE.Object3D();
    if (this.objects.has(key)) {
      o = this.objects.get(key);
      this.container.removeObject(key);
      item = this.items.get(key).item;
      this.items.delete(key);
      this.objects.delete(key);
    }
    return item;
  }

  public cubeAt(p: THREE.Vector3): boolean {
    const key = this.posToKey(p);
    return this.objects.has(key)
  }
}
