import * as THREE from "three";
import { Tick, Ticker } from "./tick";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { VeryLargeUniverse } from "./veryLargeUniverse";

export class Game {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private grips: THREE.Object3D[] = [];

  constructor() {
    this.camera = new THREE.PerspectiveCamera(75,
      1.0, 0.1, 2000);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -1.5);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(512, 512);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(VRButton.createButton(this.renderer));
    this.renderer.xr.enabled = true;

    const clock = new THREE.Clock();
    let elapsedS = 0.0;
    this.renderer.setAnimationLoop(() => {
      const deltaS = Math.min(clock.getDelta(), 0.1);
      elapsedS += deltaS;
      const tick = new Tick(elapsedS, deltaS);
      this.tickEverything(this.scene, tick);
      this.renderer.render(this.scene, this.camera);
    });

    this.getGrips();
    const vlu = new VeryLargeUniverse(this.grips, this.camera, this.renderer.xr);
    this.scene.add(vlu);
  }

  getGrips() {
    for (const i of [0, 1]) {
      const grip = this.renderer.xr.getControllerGrip(i);
      this.scene.add(grip);
      this.grips.push(grip);
    }
  }

  private tickEverything(o: THREE.Object3D, tick: Tick) {
    if (o['tick']) {
      (o as any as Ticker).tick(tick);
    }
    for (const child of o.children) {
      this.tickEverything(child, tick);
    }
  }

}