import * as THREE from "three";
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { Player } from "./player";
import { S } from "../settings";
import { Assets } from "./assets";
import { Controls } from "./controls";
import { Cursor } from "./cursor";
import { File } from "./file";
import { NebulaSphere } from "./nebulaSphere";
import { PointCloudUnion } from "./pointSet";
import { Stars } from "./stars";
import { Grid } from "./grid";
import { Tick, Ticker } from "../tick";

export class Stellar {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private universe = new THREE.Group();
  private playerGroup = new THREE.Group();
  private player = new Player();

  private allPoints = new PointCloudUnion();
  private stars: Stars;
  private cursors = new Map<THREE.XRHandedness, Cursor>();
  private leftPosition = new THREE.Vector3();
  private rightPosition = new THREE.Vector3();
  private controls: Controls = undefined;

  constructor() {
    this.scene.add(this.playerGroup);
    this.scene.add(this.universe);
    this.initialize();
  }

  private async initialize() {
    this.initializeGraphics();
    await this.initializeWorld();

    // Set up animation loop last - after everything is loaded.
    const clock = new THREE.Clock();
    let elapsedS = 0;
    let frameCount = 0;
    this.renderer.setAnimationLoop(() => {
      const deltaS = Math.min(clock.getDelta(), 0.1);
      elapsedS += deltaS;
      ++frameCount;
      this.renderer.render(this.scene, this.camera);
      this.handleControls(deltaS);
      this.stars.handlePops(this.universe, this.allPoints);
      this.tmpV.copy(this.universe.position);
      this.tmpV.multiplyScalar(-1);
      // this.nebulae.updatePosition(this.tmpV);
      if (!!this.controls) {
        this.controls.setPositions(this.leftPosition, this.rightPosition,
          this.camera);
        this.setWorldToPlayer(
          this.leftPosition, this.cursors.get('left').position)
        this.setWorldToPlayer(
          this.rightPosition, this.cursors.get('right').position)
      }
      this.scene.traverseVisible((o) => {
        if (o['tick']) {
          (o as any as Ticker).tick(new Tick(elapsedS, deltaS, frameCount));
        }
      })
    });
  }

  private setWorldToPlayer(pos: THREE.Vector3, target: THREE.Vector3) {
    target.copy(pos);
    this.playerGroup.worldToLocal(target);
  }

  private initializeGraphics() {
    document.body.innerHTML = '';
    this.camera = new THREE.PerspectiveCamera(75,
      1.0, /*near=*/0.1, /*far=*/20e9);
    this.camera.position.set(0, 1.7, 0);
    this.camera.lookAt(0, 1.7, -1.5);
    this.playerGroup.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({ logarithmicDepthBuffer: true });
    this.renderer.setSize(512, 512);
    document.body.appendChild(this.renderer.domElement);
    document.body.appendChild(VRButton.createButton(this.renderer));
    this.renderer.xr.enabled = true;
  }

  private tmpV = new THREE.Vector3();
  private distanceToClosest(): number {
    this.tmpV.copy(this.playerGroup.position);
    this.tmpV.sub(this.universe.position);
    return this.allPoints.getClosestDistance(this.tmpV);
  }

  private velocityVector = new THREE.Vector3();
  private q = new THREE.Quaternion();
  private yAxis = new THREE.Vector3(0, 1, 0);
  private handleControls(deltaS: number) {
    if (!this.controls.hasSession()) {
      const session = this.renderer.xr.getSession();
      if (session) {
        this.controls.setSession(session);
      }
    }
    const velocity = S.float('rv') * this.distanceToClosest();
    this.velocityVector.set(
      this.controls.leftRight(),
      this.controls.upDown(),
      this.controls.forwardBack());
    if (this.velocityVector.lengthSq() > 0) {
      this.velocityVector.multiplyScalar(velocity * deltaS);
      this.velocityVector.applyQuaternion(this.playerGroup.quaternion);
      this.player.position.add(this.velocityVector);
    }

    const spinRate = this.controls.spinLeftRight();
    if (spinRate != 0) {
      this.q.setFromAxisAngle(this.yAxis, deltaS * spinRate * 3);
      this.player.rotation.multiply(this.q);
    }

    this.universe.position.copy(this.player.position);
    this.universe.position.multiplyScalar(-1);
    this.playerGroup.quaternion.copy(this.player.rotation);
  }

  private async initializeWorld() {
    // this.scene.add(this.nebulae);
    const canvas = document.getElementsByTagName('canvas')[0];
    this.controls = new Controls(this.camera, canvas,
      this.renderer.xr, this.playerGroup);

    const light = new THREE.DirectionalLight(new THREE.Color('#fff'),
      1.0);
    light.position.set(0, 10, 2);
    this.scene.add(light);

    const ambient = new THREE.AmbientLight('#def', 0.5);
    this.scene.add(ambient);

    console.log('Initialize World');
    const assets = await Assets.load();
    console.log('Assets loaded.');
    this.stars = new Stars(assets, this.controls);
    File.load(this.stars, 'Stellar', new THREE.Vector3(0, 0, 0));
    this.universe.add(this.stars);
    this.allPoints.add(this.stars);
    this.cursors.set('left', new Cursor());
    this.cursors.set('right', new Cursor());
    this.playerGroup.add(this.cursors.get('left'));
    this.playerGroup.add(this.cursors.get('right'));

    File.load(this.player, 'Player', new THREE.Vector3(0, 0, 0));
    setInterval(() => { File.save(this.player, 'Player') }, 1000);
    return;
  }
}

const startButton = document.createElement('div');
startButton.innerHTML = 'Start';
startButton.onclick = () => {
  new Stellar();
}
document.body.appendChild(startButton);