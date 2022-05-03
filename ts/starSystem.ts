import * as THREE from "three";

export class StarSystem extends THREE.Object3D {
  constructor() {
    super();
    this.add(new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(1e3, 2),
      new THREE.MeshBasicMaterial({ color: '#fff' })
    ));
  }
}
