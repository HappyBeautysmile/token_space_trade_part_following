import * as THREE from "three";

export class IsoTransform {
  static readonly scale = new THREE.Vector3(1, 1, 1);
  readonly position = new THREE.Vector3();
  readonly quaternion = new THREE.Quaternion();
  constructor(position: THREE.Vector3 = undefined,
    quaternion: THREE.Quaternion = undefined) {
    if (!!position) this.position.copy(position);
    if (!!quaternion) this.quaternion.copy(quaternion);
  }

  copy(other: IsoTransform) {
    this.position.copy(other.position);
    this.quaternion.copy(other.quaternion);
  }
}