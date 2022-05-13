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

export class Hand extends THREE.Object3D {
  private cube: THREE.Object3D;
  private leftHand: boolean;

  private debug: THREE.Object3D;
  private debugMaterial: THREE.MeshStandardMaterial;

  constructor(private grip: THREE.Object3D, private item: Item,
    private index: number, private xr: THREE.WebXRManager,
    private place: Place,
    private keysDown: Set<string>, private construction: Construction,
    private inventory: Inventory) {
    super();
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
    this.chestPlayer.copy(this.place.camera.position);
    this.chestPlayer.y -= 0.5;
    this.chestPlayer = new Vector3(0, this.chestPlayer.y, 0);

    this.directionPlayer.copy(this.grip.position);
    this.directionPlayer.sub(this.chestPlayer);

    this.cube.position.copy(this.directionPlayer);
    this.cube.position.multiplyScalar(15);

    // Debug.log("this.cube.quaterion=" + JSON.stringify(this.cube.quaternion));
    // Debug.log("this.place.playerGroup.quaternion=" + JSON.stringify(this.place.playerGroup.quaternion));
    // Debug.log("this.grip.quaternion=" + JSON.stringify(this.grip.quaternion));

    this.cube.position.sub(this.place.playerGroup.position);
    this.cube.rotation.copy(this.grip.rotation);
  }

  private sourceLogged = false;
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
      if (!this.sourceLogged) {
        if (source.handedness == "left") {
          this.leftHand = true;
        }
        else {
          this.leftHand = false;
        }

        Debug.log(`Has a source. left:${this.leftHand} ${source.handedness}`);
        this.sourceLogged = true;
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
        this.setCube(this.inventory.nextItem());
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
    return removedCube;
  }

  private p = new THREE.Vector3();
  private async initialize() {
    this.grip.addEventListener('squeeze', () => {
      Debug.log('squeeze');
      const removedCube = this.deleteCube();
      Debug.log('About to add');
      this.inventory.addItem(removedCube);
      Debug.log('Add done.');
    });

    this.grip.addEventListener('selectstart', () => {
      Debug.log('selectstart');
      this.deleteCube();
      const p = new THREE.Vector3();
      p.copy(this.cube.position);
      this.place.playerToUniverse(p);
      this.place.quantizePosition(p);
      const rotation = new THREE.Quaternion();
      rotation.copy(this.cube.quaternion);
      rotation.multiply(this.place.playerGroup.quaternion);
      this.place.quantizeQuaternion(rotation);
      const inWorldItem = new InWorldItem(this.item,
        p, rotation);
      this.construction.addCube(inWorldItem);
      Debug.log('About to remove.');
      this.inventory.removeItem(this.item);
      Debug.log('Remove done.');
    });

    // this.grip.addEventListener('selectend', () => {

    // });
  }
}
