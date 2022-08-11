import * as THREE from "three";

import { Content, OctoMass } from "./octoMass";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

class OctoScene {
  private scene = new THREE.Scene();
  private universe = new THREE.Group();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private octoMass = new OctoMass(
    new THREE.Vector3(), 1 << 12, new Content(4000));

  private closestSet = false;
  private closest = new THREE.Vector3();

  constructor() {
    document.body.innerHTML = '';
    this.scene.add(this.universe);
    this.camera = new THREE.PerspectiveCamera(75,
      1.0, /*near=*/0.1, /*far=*/20e9);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -1.5);
    this.scene.add(this.camera);
    this.renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true });
    this.renderer.setSize(512, 512);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(VRButton.createButton(this.renderer));
    this.renderer.xr.enabled = true;

    this.renderer.setAnimationLoop(() => {
      this.updateVisible();
      this.universe.position.lerp(this.closest, 0.002);
      this.renderer.render(this.scene, this.camera);
    });
  }

  private visibleObjects = new Map<THREE.Vector3, THREE.Object3D>();

  private t = new THREE.Vector3();
  private t2 = new THREE.Vector3();

  private updateVisible() {
    let closestDistance = 0;

    const toDelete = new Set<THREE.Vector3>();
    for (const v of this.visibleObjects.keys()) {
      toDelete.add(v);
    }

    this.t2.copy(this.universe.position);
    this.t2.multiplyScalar(-1);
    let poppedIn = 0;
    for (const o of this.octoMass.elementsNear(this.t2)) {
      if (this.visibleObjects.has(o.center)) {
        toDelete.delete(o.center);
        continue;
      }
      ++poppedIn;
      const diameter = 2 * o.radius;
      const cube = new THREE.Mesh(
        new THREE.BoxBufferGeometry(diameter, diameter, diameter),
        new THREE.MeshBasicMaterial(
          { color: '#fed' })
      );
      cube.position.copy(o.center);
      this.universe.add(cube);
      if (!this.closestSet) {
        this.t.copy(o.center);
        this.t.add(this.universe.position);
        if (this.t.length() > closestDistance) {
          this.closest.copy(o.center);
          this.closest.multiplyScalar(-1);
          closestDistance = this.t.length();
        }
      }
      this.visibleObjects.set(o.center, cube);
    }
    if (!this.closestSet) {
      this.closest.multiplyScalar(-1);
      this.camera.lookAt(this.closest);
      this.closest.multiplyScalar(-1);
      this.closestSet = true;
    }
    if (poppedIn > 0) {
      console.log(`Popped: ${poppedIn}; Deleting ${toDelete.size}`);
    }
    for (const k of toDelete) {
      this.universe.remove(this.visibleObjects.get(k));
      this.visibleObjects.delete(k);
    }
  }
}

new OctoScene();


