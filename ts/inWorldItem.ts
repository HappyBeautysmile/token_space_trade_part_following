import * as THREE from "three";

import { Assets, Item } from "./assets";

// Represents an item which exists in the universe.
export class InWorldItem {
  private modelPrototype: THREE.Object3D;

  // TODO: instead of passing position and quaternion, perhaps we
  // need an ItemProperties class. E.g. the base color of the model.
  constructor(readonly item: Item,
    readonly position: THREE.Vector3,
    readonly quaternion: THREE.Quaternion) {
    console.assert(Assets.models.has(item.name),
      'Unknown item.  Call Assets.init first.');
    this.modelPrototype = Assets.models.get(item.name);
  }

  // Returns a clone of the model prototype.
  // Caller needs to set the position of this object and add it to the scene
  // graph.
  public getObject(): THREE.Object3D {
    return this.modelPrototype.clone();
  }
}