import * as THREE from "three";
import { Place } from "./place";
import { Tick } from "./tick";
import { Debug } from "./debug";
import { Assets, Item } from "./assets";
import { InHandObject } from "./inHandObject";
import { Vector3 } from "three";
import { FileIO } from "./fileIO";
import { Construction } from "./construction";
import { InWorldItem } from "./inWorldItem";
import { Inventory } from "./player";
import { GripLike } from "./gripLike";
import { S } from "./settings";

export class Hand extends THREE.Object3D {
  private cube: THREE.Object3D;
  private leftHand: boolean;

  private debug: THREE.Object3D;
  private debugMaterial: THREE.MeshStandardMaterial;

  constructor(private grip: GripLike, private item: Item,
    private index: number, private xr: THREE.WebXRManager,
    private place: Place,
    private keysDown: Set<string>, private construction: Construction,
    private inventory: Inventory) {
    super();
    this.leftHand = null;
    this.debugMaterial = new THREE.MeshStandardMaterial({ color: '#f0f' });
    // this.debug = new THREE.Mesh(
    //   new THREE.CylinderBufferGeometry(0.02, 0.02, 0.5), this.debugMaterial);
    // this.debug.position.set(0, 0, -1);
    // this.add(this.debug);

    if (grip && this) {
      grip.add(this);
    }
    else {
      Debug.log("ERROR: grip or this not defined.")
    }

    this.setCube(item);
    this.initialize();
  }

  // We create these private temporary variables here so we aren't
  // creating new objects on every frame.  This reduces the amount of
  // garbage collection.  Ideally we'd do this for other things in
  // `tick` as well.
  private chestPlayer = new THREE.Vector3();
  private directionPlayer = new THREE.Vector3();
  private setCubePosition() {
    // The center of the chest is 50cm below the camera.
    this.place.camera.getWorldPosition(this.chestPlayer);
    this.chestPlayer.y += S.float('hr');
    this.grip.getWorldPosition(this.directionPlayer);
    this.directionPlayer.sub(this.chestPlayer);

    this.cube.position.copy(this.directionPlayer);
    this.cube.position.multiplyScalar(15);
    this.place.worldToPlayer(this.cube.position);
    this.cube.rotation.copy(this.grip.rotation);
  }

  private lastButtons;
  private v = new THREE.Vector3();
  public tick(t: Tick) {
    this.setCubePosition();
    let source: THREE.XRInputSource = null;
    const session = this.xr.getSession();
    if (session) {
      if (session.inputSources && session.inputSources.length > this.index) {
        source = session.inputSources[this.index];
      }
    }

    if (source) {
      if (!this.leftHand) {
        this.leftHand = source.handedness == "left";
      }
      //this.debugMaterial.color = new THREE.Color('blue');
      const rateUpDown = 5;
      const rateMove = 10;
      const rotRate = 2;
      const axes = source.gamepad.axes.slice(0);
      if (axes.length >= 4) {
        //this.debugMaterial.color = new THREE.Color('green');
        if (!axes[2] || !axes[3]) {
          // Sticks are not being touched.
        } else {
          //this.debugMaterial.color = new THREE.Color('orange');
          this
          if (this.leftHand) {
            this.v.set(Math.pow(axes[2], 3), 0, Math.pow(axes[3], 3));
            this.v.multiplyScalar(rateMove * t.deltaS);
            this.place.movePlayerRelativeToCamera(this.v);
          }
          else {
            this.v.set(0, -Math.pow(axes[3], 3), 0);
            this.v.multiplyScalar(rateUpDown * t.deltaS);
            this.place.movePlayerRelativeToCamera(this.v);
            this.place.playerGroup.rotateY(-axes[2] * rotRate * t.deltaS);
          }
        }
      }
      const buttons = source.gamepad.buttons.map((b) => b.value);
      if (buttons[0] === 1 && this.lastButtons[0] != 1) { // trigger
        //this.debugMaterial.color = new THREE.Color('red');
      }
      if (buttons[1] === 1 && this.lastButtons[1] != 1) { // squeeze
        //this.debugMaterial.color = new THREE.Color('yellow');
      }
      if (buttons[2] === 1 && this.lastButtons[2] != 1) { // 
        Debug.log(`Button 2 pressed on ${source.handedness} hand.`)
      }
      if (buttons[3] === 1 && this.lastButtons[3] != 1) {
        //this.debugMaterial.color = new THREE.Color('blue');
        this.construction.save();
      }
      if (buttons[4] === 1 && this.lastButtons[4] != 1) { // A or X
        const i = this.inventory.nextItem();
        if (i) {
          this.setCube(i);
        }
        else {
          // TODO: change the hand to something that can't place.
        }
      }
      if (buttons[5] === 1 && this.lastButtons[5] != 1) { // B or Y
        Assets.replaceMaterial(this.cube, Assets.nextMaterial());
        //Assets.nextMaterial();
      }
      this.lastButtons = buttons;
    }
  }

  // sets the cube that is in the hand
  public setCube(item: Item) {
    if (this.cube) {
      this.place.playerGroup.remove(this.cube);
    }
    this.cube = Assets.models.get(item.modelName).clone();
    this.place.playerGroup.add(this.cube);
    this.item = item;
  }

  // delete a cube from the world 
  private deleteCube() {
    this.p.copy(this.cube.position);
    this.place.playerToUniverse(this.p);
    this.place.quantizePosition(this.p);
    const removedCube = this.construction.removeCube(this.p);
    if (removedCube) {
      this.inventory.addItem(removedCube);
    }
  }

  private eulerString(q: THREE.Quaternion) {
    const v = new THREE.Euler();
    v.setFromQuaternion(q);
    return `[${(v.x * 180 / Math.PI).toFixed(0)},${(v.y * 180 / Math.PI).toFixed(0)},${(v.z * 180 / Math.PI).toFixed(0)}]`;
  }

  private p = new THREE.Vector3();
  private async initialize() {
    this.grip.setSqueezeCallback(() => {
      this.deleteCube();
    });

    this.grip.setSelectStartCallback(() => {
      Debug.log('selectstart');
      const itemQty = this.inventory.getItemQty();
      if (itemQty.has(this.item)) {
        if (itemQty.get(this.item) > 0) {
          this.deleteCube();
          const p = new THREE.Vector3();
          p.copy(this.cube.position);
          this.place.playerToUniverse(p);
          this.place.quantizePosition(p);
          const rotation = new THREE.Quaternion();
          rotation.copy(this.grip.quaternion);
          Debug.log(`copy of grip${JSON.stringify(rotation)}`);
          rotation.multiply(this.place.playerGroup.quaternion);
          Debug.log(`multiplied${JSON.stringify(rotation)}`);
          const before = this.eulerString(rotation);
          const beforeQ = rotation;
          this.place.quantizeQuaternion(rotation);
          const after = this.eulerString(rotation);
          Debug.log(`${before} -> ${after}`);
          Debug.log(`quantized {JSON.stringify(rotation)}`);
          const inWorldItem = new InWorldItem(this.item,
            p, rotation);
          this.construction.addCube(inWorldItem);
          Debug.log('About to remove.');
          this.inventory.removeItem(this.item);
          Debug.log('Remove done.');
        }
      }

    });

    // this.grip.addEventListener('selectend', () => {

    // });
  }
}
