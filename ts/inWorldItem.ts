import * as THREE from "three";

import { Assets, Item } from "./assets";
import { Debug } from "./debug";

// Represents an item which exists in the universe.
export class InWorldItem {
  private meshPrototype: THREE.Mesh;

  // TODO: instead of passing position and quaternion, perhaps we
  // need an ItemProperties class. E.g. the base color of the model.
  constructor(readonly item: Item,
    readonly position: THREE.Vector3,
    readonly quaternion: THREE.Quaternion) {
    Debug.assert(Assets.meshes.has(item.name),
      'Unknown item.  Call Assets.init first.');
    this.meshPrototype = Assets.meshes.get(item.name);
  }

  // Returns a clone of the model prototype.
  // Caller needs to set the position of this object and add it to the scene
  // graph.
  public getMesh(): THREE.Mesh {
    return this.meshPrototype.clone();
  }

  public replaceMaterial(mat: THREE.Material) {
    Assets.replaceMaterial(this.meshPrototype, mat);
  }
}