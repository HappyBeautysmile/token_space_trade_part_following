import * as THREE from "three";

import { Assets, Item } from "./assets";
import { Debug } from "./debug";

// Represents an item which exists in the universe.
export class InWorldItem {
  private mesh: THREE.Mesh;

  // TODO: instead of passing position and quaternion, perhaps we
  // need an ItemProperties class. E.g. the base color of the model.
  constructor(readonly item: Item,
    readonly position: THREE.Vector3,
    readonly quaternion: THREE.Quaternion) {
    Debug.assert(Assets.meshes.has(item.name),
      'Unknown item.  Call Assets.init first.');
    this.mesh = Assets.meshes.get(item.name).clone();
  }

  // Returns a clone of the model prototype.
  // Caller needs to set the position of this object and add it to the scene
  // graph.
  public getMesh(): THREE.Mesh {
    return this.mesh.clone();
  }

  public clone(): InWorldItem {
    const p = new THREE.Vector3(this.position.x, this.position.y, this.position.z);
    const q = new THREE.Quaternion(this.quaternion.x, this.quaternion.y, this.quaternion.z, this.quaternion.w);
    let iwi = new InWorldItem(this.item, p, q);
    // let geo = this.mesh.geometry;
    // let mat = this.mesh.material;
    // iwi.mesh = new THREE.Mesh(geo, mat);
    iwi.mesh = this.mesh.clone();
    return iwi
  }

  public replaceMaterial(mat: THREE.Material) {
    Assets.replaceMaterial(this.mesh, mat);
  }
}