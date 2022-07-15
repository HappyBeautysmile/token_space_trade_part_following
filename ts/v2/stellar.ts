import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { S } from "../settings";
import { Assets } from "./assets";
import { Controls } from "./controls";
import { File } from "./file";
import { NebulaSphere } from "./nebulaSphere";
import { PointCloudUnion } from "./pointSet";
import { Stars } from "./stars";

export class Stellar {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private universe = new THREE.Group();
  private player = new THREE.Group();

  private allPoints = new PointCloudUnion();
  private stars: Stars;
  private nebulae = new NebulaSphere();

  constructor() {
    this.scene.add(this.player);
    this.scene.add(this.universe);
    this.initialize();
  }

  private async initialize() {
    this.initializeGraphics();
    await this.initializeWorld();

    // Set up animation loop last - after everything is loaded.
    const clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => {
      const deltaS = Math.min(clock.getDelta(), 0.1);
      this.renderer.render(this.scene, this.camera);
      this.handleControls(deltaS);
      this.stars.handlePops(this.universe, this.allPoints);
      this.tmpV.copy(this.universe.position);
      this.tmpV.multiplyScalar(-1);
      // this.nebulae.updatePosition(this.tmpV);
    });
  }

  private initializeGraphics() {
    document.body.innerHTML = '';
    this.camera = new THREE.PerspectiveCamera(75,
      1.0, /*near=*/0.1, /*far=*/2000);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -1.5);
    this.player.add(this.camera);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(512, 512);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(VRButton.createButton(this.renderer));
    this.renderer.xr.enabled = true;
  }

  private tmpV = new THREE.Vector3();
  private distanceToClosest(): number {
    this.tmpV.copy(this.player.position);
    this.tmpV.sub(this.universe.position);
    return this.allPoints.getClosestDistance(this.tmpV);
  }

  private velocityVector = new THREE.Vector3();
  private handleControls(deltaS: number) {
    if (!Controls.hasSession()) {
      const session = this.renderer.xr.getSession();
      if (session) {
        Controls.setSession(session);
      }
    }
    const velocity = S.float('rv') * this.distanceToClosest();
    this.velocityVector.set(
      Controls.leftRight(),
      Controls.upDown(),
      Controls.forwardBack());
    if (this.velocityVector.lengthSq() > 0) {
      this.velocityVector.multiplyScalar(velocity * deltaS);
      this.velocityVector.applyQuaternion(this.player.quaternion);
      this.universe.position.sub(this.velocityVector);
    }

    const spinRate = Controls.spinLeftRight();
    if (spinRate != 0) {
      this.player.rotateY(deltaS * spinRate * 3);
    }
  }


  private async initializeWorld() {
    // this.scene.add(this.nebulae);

    const light = new THREE.DirectionalLight(new THREE.Color('#fff'),
      1.0);
    light.position.set(0, 10, 2);
    this.scene.add(light);

    console.log('Initialize World');
    const assets = await Assets.load();
    console.log('Assets loaded.');
    this.stars = new Stars(assets);
    File.load(this.stars, 'Stellar', new THREE.Vector3(0, 0, 0));
    this.universe.add(this.stars);
    this.allPoints.add(this.stars);
    return;
  }
}

const startButton = document.createElement('div');
startButton.innerHTML = 'Start';
startButton.onclick = () => {
  new Stellar();
}
document.body.appendChild(startButton);