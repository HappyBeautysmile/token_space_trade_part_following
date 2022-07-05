import * as THREE from "three";

export class Grid {
  static round(v: THREE.Vector3) {
    v.set(Math.round(v.x), Math.round(v.y), Math.round(v.z));
  }

  public static zero = new THREE.Vector3(0, 0, 0);
}