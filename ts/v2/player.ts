import * as THREE from "three";

import { Codeable } from "./file";
import { Grid } from "./grid";

export class Player implements Codeable {
  readonly position = new THREE.Vector3();
  readonly rotation = new THREE.Quaternion();

  serialize(): Object {
    const o = {};
    o['position'] =
      { x: this.position.x, y: this.position.y, z: this.position.z };
    o['rotation'] = {
      x: this.rotation.x, y: this.rotation.y,
      z: this.rotation.z, w: this.rotation.w
    };
    return o;
  }

  deserialize(o: Object): this {
    this.position.copy(o['position']);
    this.rotation.copy(o['rotation']);
    return this;
  }

  fallback(p: THREE.Vector3): this {
    this.position.set(0, 0, 0);
    this.rotation.copy(Grid.notRotated);
    return this;
  }
}