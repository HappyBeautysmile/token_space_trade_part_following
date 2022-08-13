import * as THREE from "three";
import { InstancedMesh } from "three";

export class InstancePack extends THREE.Object3D {
  // Instances per pack
  private static kPackSize = 10000;

  private packs: THREE.InstancedMesh[] = [];
  private count = 0;

  constructor(readonly geometry: THREE.BufferGeometry,
    readonly material: THREE.Material) {
    super();
  }

  getCount(): number {
    return this.count;
  }

  private getPackForIndex(index: number): InstancedMesh {
    const packIndex = Math.floor(index / InstancePack.kPackSize);
    while (packIndex >= this.packs.length) {
      const pack = new THREE.InstancedMesh(
        this.geometry, this.material, InstancePack.kPackSize);
      pack.count = 0;
      this.packs.push(pack);
      this.add(pack);
      console.log(`Allocating new packs for index ${index} (pack: ${packIndex})`);
    }
    this.count = Math.max(this.count, index + 1);
    return this.packs[packIndex];
  }

  setMatrixAt(index: number, matrix: THREE.Matrix4) {
    const pack = this.getPackForIndex(index);
    const packOffset = index % InstancePack.kPackSize;
    pack.setMatrixAt(packOffset, matrix);
    pack.count = Math.max(pack.count, packOffset + 1);
  }

  setColorAt(index: number, color: THREE.Color) {
    const pack = this.getPackForIndex(index);
    const packOffset = index % InstancePack.kPackSize;
    pack.setColorAt(packOffset, color);
    pack.count = Math.max(pack.count, packOffset + 1);
    pack.instanceColor.needsUpdate = true;
  }

  static makeMatrix(position: THREE.Vector3, scale: number) {
    const m = new THREE.Matrix4();
    m.set(
      scale, 0, 0, position.x,
      0, scale, 0, position.y,
      0, 0, scale, position.z,
      0, 0, 0, 1);
    return m;
  }
}