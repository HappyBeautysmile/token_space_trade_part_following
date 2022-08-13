import * as THREE from "three";

import { Content, OctoMass } from "./octoMass";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { InstancePack } from "./instancePack";
import { Grid } from "../v2/grid";

class OctoScene {
  private scene = new THREE.Scene();
  private universe = new THREE.Group();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;

  private octoMass = new OctoMass(
    new THREE.Vector3(), 1 << 12, new Content(8));

  private targetIsSet = false;
  private negativeTarget = new THREE.Vector3();
  private cubes: InstancePack;

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
      this.universe.position.lerp(this.negativeTarget, 0.02);
      this.renderer.render(this.scene, this.camera);
    });

    this.cubes = new InstancePack(
      new THREE.BoxBufferGeometry(0.5, 0.5, 0.5),
      new THREE.MeshBasicMaterial({
        color: '#fff', blending: THREE.AdditiveBlending, depthTest: false
      }));
    this.universe.add(this.cubes);
  }

  // Maps an octomass position to an index in the
  // instancepack.
  private visibleObjects = new Map<THREE.Vector3, number>();
  private visibleLocation = new Map<number, THREE.Vector3>();

  // A "recycle bin" for available matrix positions.
  private freePositions = new Set<number>();

  private t = new THREE.Vector3();
  private t2 = new THREE.Vector3();

  private colorMap: THREE.Color[] = [
    new THREE.Color('#008'),
    new THREE.Color('#044'),
    new THREE.Color('#080'),
    new THREE.Color('#084'),
    new THREE.Color('#088'),
    new THREE.Color('#444'),
    new THREE.Color('#800'),
    new THREE.Color('#804'),
    new THREE.Color('#808'),
    new THREE.Color('#844'),
    new THREE.Color('#880'),
    new THREE.Color('#884'),
    new THREE.Color('#888'),
  ];


  private updateVisible() {
    let closestDistance = 0;

    const toDelete = new Set<THREE.Vector3>();
    for (const v of this.visibleObjects.keys()) {
      toDelete.add(v);
    }

    this.t2.copy(this.universe.position);
    this.t2.multiplyScalar(-1);
    let poppedIn = 0;
    let minDiameter = Infinity;
    for (const o of this.octoMass.elementsNear(this.t2)) {
      const diameter = 2 * o.radius;
      minDiameter = Math.min(minDiameter, diameter);
      if (this.visibleObjects.has(o.center)) {
        toDelete.delete(o.center);
        continue;
      }
      ++poppedIn;
      let position = 0;
      if (this.freePositions.size > 0) {
        for (const p of this.freePositions) {
          position = p;
          break;
        }
        this.freePositions.delete(position);
      } else {
        position = this.cubes.getCount();
      }
      this.cubes.setMatrixAt(position,
        InstancePack.makeMatrix(o.center, diameter));
      const colorIndex = Math.round(Math.log2(diameter));
      console.log(`x: ${o.center.x}; p: ${position}; Color index: ${colorIndex}`);
      this.cubes.setColorAt(position,
        this.colorMap[colorIndex]);
      this.visibleObjects.set(o.center, position);
      this.visibleLocation.set(position, o.center);

      if (!this.targetIsSet) {
        this.t.copy(o.center);
        this.t.add(this.universe.position);
        if (this.t.length() > closestDistance) {
          this.negativeTarget.copy(o.center);
          this.negativeTarget.multiplyScalar(-1);
          closestDistance = this.t.length();
        }
      }
    }
    if (!this.targetIsSet) {
      this.negativeTarget.multiplyScalar(-1);
      console.log(`Headed for ${this.negativeTarget.x}`);
      this.camera.lookAt(this.negativeTarget);
      this.negativeTarget.multiplyScalar(-1);
      this.targetIsSet = true;
    }
    for (const p of toDelete) {
      const k = this.visibleObjects.get(p);
      this.cubes.setMatrixAt(k, Grid.zeroMatrix);
      this.visibleLocation.delete(k);
      this.visibleObjects.delete(p);
      this.freePositions.add(k);
    }
    // if (poppedIn > 0) {
    //   console.log(`Popped: ${poppedIn}; Deleting ${toDelete.size}; Min diameter: ${minDiameter}; Visible: ${this.visibleLocation.size}`);
    // }
  }
}

new OctoScene();


