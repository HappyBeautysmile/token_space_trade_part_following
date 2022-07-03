import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

export class Stellar {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  constructor() {
    this.initializeGraphics();
  }

  initializeGraphics() {
    document.body.innerHTML = '';
    this.camera = new THREE.PerspectiveCamera(75,
      1.0, /*near=*/0, /*far=*/2000);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -1.5);
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(512, 512);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(VRButton.createButton(this.renderer));
    this.renderer.xr.enabled = true;

    this.renderer.setAnimationLoop(() => {
      this.renderer.render(this.scene, this.camera);
    });
  }
}

const startButton = document.createElement('div');
startButton.innerHTML = 'Start';
startButton.onclick = () => {
  new Stellar();
}
document.body.appendChild(startButton);