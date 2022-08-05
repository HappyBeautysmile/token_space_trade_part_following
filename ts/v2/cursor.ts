import * as THREE from "three";
import { LineSegments } from "three";
import { Assets } from "./assets";

export class Cursor extends THREE.Object3D {
  private hold: string;
  private heldObject: THREE.Object3D;
  private lineSegments: THREE.LineSegments;

  constructor(private assets: Assets) {
    super();
    const points = [];
    // four left to right lines
    points.push(new THREE.Vector3(-0.5, -0.5, -0.5));
    points.push(new THREE.Vector3(0.5, -0.5, -0.5));
    points.push(new THREE.Vector3(-0.5, -0.5, 0.5));
    points.push(new THREE.Vector3(0.5, -0.5, 0.5));
    points.push(new THREE.Vector3(-0.5, 0.5, -0.5));
    points.push(new THREE.Vector3(0.5, 0.5, -0.5));
    points.push(new THREE.Vector3(-0.5, 0.5, 0.5));
    points.push(new THREE.Vector3(0.5, 0.5, 0.5));
    // four front to back lines
    points.push(new THREE.Vector3(-0.5, -0.5, -0.5));
    points.push(new THREE.Vector3(-0.5, -0.5, 0.5));
    points.push(new THREE.Vector3(-0.5, 0.5, -0.5));
    points.push(new THREE.Vector3(-0.5, 0.5, 0.5));
    points.push(new THREE.Vector3(0.5, -0.5, -0.5));
    points.push(new THREE.Vector3(0.5, -0.5, 0.5));
    points.push(new THREE.Vector3(0.5, 0.5, -0.5));
    points.push(new THREE.Vector3(0.5, 0.5, 0.5));
    // four up and down lines
    points.push(new THREE.Vector3(-0.5, -0.5, -0.5));
    points.push(new THREE.Vector3(-0.5, 0.5, -0.5));
    points.push(new THREE.Vector3(-0.5, -0.5, 0.5));
    points.push(new THREE.Vector3(-0.5, 0.5, 0.5));
    points.push(new THREE.Vector3(0.5, -0.5, -0.5));
    points.push(new THREE.Vector3(0.5, 0.5, -0.5));
    points.push(new THREE.Vector3(0.5, -0.5, 0.5));
    points.push(new THREE.Vector3(0.5, 0.5, 0.5));

    const material = new THREE.LineBasicMaterial(
      { color: "#0f0", linewidth: 1 });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    this.lineSegments = new LineSegments(geometry, material);
    this.add(this.lineSegments);
  }

  public isHolding(): boolean {
    return !!this.hold;
  }

  public getHold(): string {
    return this.hold;
  }

  public setHold(item: string) {
    if (this.heldObject) {
      this.remove(this.heldObject);
    }
    if (item) {
      this.heldObject = this.assets.getMesh(item);
      if (this.heldObject) {
        this.add(this.heldObject);
      }
    }
    this.hold = item;
  }
}