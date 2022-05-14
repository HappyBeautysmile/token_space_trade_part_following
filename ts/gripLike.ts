import * as THREE from "three";
import { Tick, Ticker } from "./tick";

export type GripEventType = 'squeeze' | 'selectstart';

export interface GripLike extends THREE.Object3D {
  setSelectStartCallback(callback: () => void): void;
  setSqueezeCallback(callback: () => void): void;
  getButtons(): number[];
  getStick(): number;
}

export class GripGrip extends THREE.Object3D implements GripLike, Ticker {
  private grip: THREE.Object3D;
  constructor(index: number, private xr: THREE.WebXRManager) {
    super();
    this.grip = xr.getControllerGrip(index);
  }

  tick(t: Tick) {
    this.position.copy(this.grip.position);
    this.rotation.copy(this.grip.rotation);
    this.quaternion.copy(this.grip.quaternion);
    this.matrix.copy(this.grip.matrix);
  }
  setSelectStartCallback(callback: () => void) {
    this.grip.addEventListener('selectstart', callback);
  }
  setSqueezeCallback(callback: () => void) {
    this.grip.addEventListener('squeeze', callback);
  }
  getButtons(): number[] {
    throw new Error("Not implemented.");
  }
  getStick(): number {
    throw new Error("Not implemented.");
  }
}

export class MouseGrip extends THREE.Object3D implements GripLike {
  private group = new THREE.Group();
  private callbacks = new Map<GripEventType, () => void>();
  private pointer = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();
  constructor(private canvas: HTMLCanvasElement,
    private camera: THREE.Camera,
    private keysDown: Set<string>) {
    super();
    this.callbacks.set('selectstart', () => { });
    this.callbacks.set('squeeze', () => { });
    this.canvas.addEventListener('mouseover', (ev: MouseEvent) => {
      this.onPointerMove(ev);
    });
    this.canvas.addEventListener('mousedown', (ev: MouseEvent) => {
      switch (ev.button) {
        case 0: // Left button
          this.callbacks.get('selectstart')();
          break;
        case 2: // Right button
          this.callbacks.get('squeeze')();
          break;
      }
    });
  }

  onPointerMove(event: MouseEvent) {
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;
    // update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.group.position.copy(this.raycaster.ray.direction);
    // Distance from camera to hand = 0.6 meters
    this.group.position.setLength(0.6);
    this.group.position.add(this.raycaster.ray.origin);
  }

  setSelectStartCallback(callback: () => void) {
    throw new Error("Not implemented.");
  }
  setSqueezeCallback(callback: () => void) {
    throw new Error("Not implemented.");
  }
  getButtons(): number[] {
    throw new Error("Not implemented.");
  }
  getStick(): number {
    throw new Error("Not implemented.");
  }
}
