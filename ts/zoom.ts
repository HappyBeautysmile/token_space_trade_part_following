import * as THREE from "three";

export class Zoom {

  private static d = new THREE.Vector3;
  private static seed = new THREE.Vector3();
  private static other = new THREE.Vector3();

  public static makePerpendicular(l: THREE.Vector3, r: THREE.Vector3):
    THREE.Vector3[] {
    this.d.copy(r);
    this.d.sub(l);

    this.seed.set(-this.d.y, this.d.x, 0);
    this.seed.cross(this.d);
    this.seed.setLength(this.d.length());

    this.other.copy(this.d);
    this.other.cross(this.seed);
    this.other.setLength(this.d.length());

    return [
      new THREE.Vector3(
        l.x + this.seed.x, l.y + this.seed.y, l.z + this.seed.z),
      new THREE.Vector3(
        l.x + this.other.x, l.y + this.other.y, l.z + this.other.z)
    ];
  }

  public static makeZoomMatrix(
    l1: THREE.Vector3, r1: THREE.Vector3,
    l2: THREE.Vector3, r2: THREE.Vector3): THREE.Matrix4 {

    const [a1, b1] = Zoom.makePerpendicular(l1, r1);
    const [a2, b2] = Zoom.makePerpendicular(l2, r2);

    const initialPosition = new THREE.Matrix4();
    initialPosition.set(
      l1.x, r1.x, a1.x, b1.x,
      l1.y, r1.y, a1.y, b1.y,
      l1.z, r1.z, a1.z, b1.z,
      1, 1, 1, 1);

    const newPosition = new THREE.Matrix4();
    newPosition.set(
      l2.x, r2.x, a2.x, b2.x,
      l2.y, r2.y, a2.y, b2.y,
      l2.z, r2.z, a2.z, b2.z,
      1, 1, 1, 1);

    initialPosition.invert();
    newPosition.multiplyMatrices(newPosition, initialPosition);

    return newPosition;
  }
}
