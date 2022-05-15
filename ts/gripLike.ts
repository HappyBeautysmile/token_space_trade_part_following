import * as THREE from "three";
import { Tick, Ticker } from "./tick";

export type GripEventType = 'squeeze' | 'selectstart';

export interface GripLike extends THREE.Object3D {
  setSelectStartCallback(callback: () => void): void;
  setSqueezeCallback(callback: () => void): void;
  getButtons(): number[];
  getStick(): number;
}

export class GripGrip extends THREE.Object3D implements GripLike {
  private grip: THREE.Object3D;
  constructor(index: number, private xr: THREE.WebXRManager) {
    super();
    this.grip = xr.getControllerGrip(index);
    this.add(this.grip);

    // If you want to see where the "grip" is, uncomment this code.
    const ball = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(0.02, 3),
      new THREE.MeshPhongMaterial({ color: 'pink' })
    );
    this.add(ball);
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
  private callbacks = new Map<GripEventType, () => void>();
  private pointer = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();
  constructor(private canvas: HTMLCanvasElement,
    private camera: THREE.Camera,
    private keysDown: Set<string>) {
    super();
    canvas.oncontextmenu = () => false;
    this.callbacks.set('selectstart', () => { });
    this.callbacks.set('squeeze', () => { });
    this.canvas.addEventListener('mousemove', (ev: MouseEvent) => {
      this.onPointerMove(ev);
    });
    this.canvas.addEventListener('mousedown', (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      switch (ev.button) {
        case 0: // Left button
          this.callbacks.get('selectstart')();
          break;
        case 2: // Right button
          this.callbacks.get('squeeze')();
          break;
      }
    });
    // If you want to see where the "grip" is, uncomment this code.
    // const ball = new THREE.Mesh(
    //   new THREE.IcosahedronBufferGeometry(0.02, 3),
    //   new THREE.MeshPhongMaterial({ color: 'pink' })
    // );
    // this.add(ball);
  }

  onPointerMove(event: MouseEvent) {
    this.pointer.x = (event.clientX / this.canvas.width) * 2 - 1;
    this.pointer.y = - (event.clientY / this.canvas.height) * 2 + 1;
    // update the picking ray with the camera and pointer position
    this.raycaster.setFromCamera(this.pointer, this.camera);
    this.position.copy(this.raycaster.ray.direction);
    // Distance from camera to hand = 0.6 meters
    this.position.setLength(0.6);
    this.position.add(this.raycaster.ray.origin);
  }

  setSelectStartCallback(callback: () => void) {
    this.callbacks.set('selectstart', callback);
  }
  setSqueezeCallback(callback: () => void) {
    this.callbacks.set('squeeze', callback);
  }
  getButtons(): number[] {
    throw new Error("Not implemented.");
  }
  getStick(): number {
    throw new Error("Not implemented.");
  }
}
