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
import { ButtonDispatcher } from "./buttonDispatcher";
import { Computer } from "./computer";

export class Hand extends THREE.Object3D {
  private cube: THREE.Object3D;

  private debug: THREE.Object3D;
  private debugMaterial: THREE.MeshStandardMaterial;
  private lineGeometry = new THREE.BufferGeometry();
  private linePoints: THREE.Vector3[] = [
    new THREE.Vector3(), new THREE.Vector3()
  ];
  private line = new THREE.Line(this.lineGeometry,
    new THREE.LineBasicMaterial({ color: '#aa9' }));

  private computerAdded = false;
  private listener = new THREE.AudioListener();
  private sound: THREE.Audio;
  private audioLoader = new THREE.AudioLoader();
  constructor(private grip: GripLike, private item: Item,
    private index: number, private xr: THREE.WebXRManager,
    private place: Place,
    private keysDown: Set<string>, private construction: Construction,
    private inventory: Inventory, private computer: Computer) {
    super();

    // If you want to see where the "grip" is, uncomment this code.
    this.debug = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(0.02, 3),
      new THREE.MeshPhongMaterial({ color: 'pink' })
    );
    this.add(this.debug);

    if (grip && this) {
      grip.add(this);
    }
    else {
      Debug.log("ERROR: grip or this not defined.")
    }

    this.line.visible = false;
    this.add(this.line);

    this.setCube(item);
    this.initialize();

    // create an AudioListener and add it to the camera
    this.add(this.listener);

    // create a global audio source
    this.sound = new THREE.Audio(this.listener);

    // load a sound and set it as the Audio object's buffer
    const audioLoader = new THREE.AudioLoader();
  }

  // We create these private temporary variables here so we aren't
  // creating new objects on every frame.  This reduces the amount of
  // garbage collection.  Ideally we'd do this for other things in
  // `tick` as well.
  private chestPlayer = new THREE.Vector3();
  private directionPlayer = new THREE.Vector3();
  private setCubePosition() {
    this.place.camera.getWorldPosition(this.chestPlayer);
    this.chestPlayer.y += S.float('hr');
    this.chestPlayer.x = 0;
    this.chestPlayer.z = 0;
    this.grip.getWorldPosition(this.directionPlayer);
    this.directionPlayer.sub(this.chestPlayer);

    this.cube.position.copy(this.directionPlayer);
    this.cube.position.multiplyScalar(15);
    this.place.worldToPlayer(this.cube.position);
    this.cube.rotation.copy(this.grip.rotation);
  }

  private r = new THREE.Ray();
  private worldNormalMatrix = new THREE.Matrix3;


  private setRay() {
    this.getWorldPosition(this.r.origin);
    this.r.direction.set(0, -1, 0);
    this.worldNormalMatrix.getNormalMatrix(this.matrixWorld);
    this.r.direction.applyMatrix3(this.worldNormalMatrix);
  }

  // Returns true if ray is over something.
  private castRay() {
    this.setRay();
    const distance = ButtonDispatcher.closestApproach(this.r);
    if (distance !== undefined) {
      this.linePoints[0].set(0, 0, 0);
      this.linePoints[1].set(0, -distance, 0);
      this.lineGeometry.setFromPoints(this.linePoints);
      this.line.visible = true;
    } else {
      this.line.visible = false;
    }
  }

  private sendRay() {
    this.setRay();
    ButtonDispatcher.cast(this.r);
  }

  private lastButtons;
  private v = new THREE.Vector3();
  private source: THREE.XRInputSource = null;
  public tick(t: Tick) {
    this.setCubePosition();
    this.castRay();
    const session = this.xr.getSession();
    if (session) {
      if (session.inputSources && session.inputSources.length > this.index) {
        this.source = session.inputSources[this.index];
      }
    }

    if (this.source) {
      if (this.grip.getHandedness() === 'left' && !this.computerAdded) {
        this.add(this.computer);
        this.computer.translateX(0.0);
        this.computer.translateY(0.2);
        this.computer.rotateZ(-Math.PI / 4);
        this.computerAdded = true;
      }

      //this.debugMaterial.color = new THREE.Color('blue');
      const rateUpDown = 5;
      const rateMove = 10;
      const rotRate = 2;
      const axes = this.source.gamepad.axes.slice(0);
      if (axes.length >= 4) {
        //this.debugMaterial.color = new THREE.Color('green');
        if (!axes[2] && !axes[3]) {
          // Sticks are not being touched.
        } else {
          //this.debugMaterial.color = new THREE.Color('orange');
          this.debug.scale.set(1.1 + axes[2], 1.1 + axes[3], 1.0);
          if (this.grip.getHandedness() === 'left') {
            this.v.set(Math.pow(axes[2], 3), 0, Math.pow(axes[3], 3));
            this.v.multiplyScalar(rateMove * t.deltaS);
            this.place.movePlayerRelativeToCamera(this.v);
          } else if (this.grip.getHandedness() === 'right') {
            this.v.set(0, -Math.pow(axes[3], 3), 0);
            this.v.multiplyScalar(rateUpDown * t.deltaS);
            this.place.movePlayerRelativeToCamera(this.v);
            this.place.playerGroup.rotateY(-axes[2] * rotRate * t.deltaS);
          }
        }
      }
      const buttons = this.source.gamepad.buttons.map((b) => b.value);
      if (buttons[0] === 1 && this.lastButtons[0] != 1) { // trigger
        //this.debugMaterial.color = new THREE.Color('red');
      }
      if (buttons[1] === 1 && this.lastButtons[1] != 1) { // squeeze
        //this.debugMaterial.color = new THREE.Color('yellow');
      }
      if (buttons[2] === 1 && this.lastButtons[2] != 1) { // 
        Debug.log(`Button 2 pressed on ${this.source.handedness} hand.`)
      }
      if (buttons[3] === 1 && this.lastButtons[3] != 1) { // stick button
        //this.debugMaterial.color = new THREE.Color('blue');
        this.construction.save();
        this.construction.saveToLocal();
      }
      if (buttons[4] === 1 && this.lastButtons[4] != 1) { // A or X
        const i = this.inventory.nextItem();
        if (i) {
          this.setCube(i);
        }
        else {
          this.setCube(Assets.itemsByName.get('guide'));
        }
      }
      if (buttons[5] === 1 && this.lastButtons[5] != 1) { // B or Y
        if (this.item.paintable) {
          Assets.replaceMaterial(this.cube, Assets.nextMaterial());
        }
      }
      this.lastButtons = buttons;
    }
  }

  // sets the cube that is in the hand
  public setCube(item: Item) {
    if (this.cube) {
      this.place.playerGroup.remove(this.cube);
    }
    this.cube = Assets.meshes.get(item.modelName).clone();
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

    this.grip.setSelectStartCallback(() => { // add block or click
      Debug.log('selectstart');
      if (this.line.visible) {
        this.sendRay();
        return;
      }
      const itemQty = this.inventory.getItemQty();
      if (itemQty.has(this.item)) {
        if (itemQty.get(this.item) > 0) {
          this.deleteCube();
          const p = new THREE.Vector3();
          p.copy(this.cube.position);
          this.place.playerToUniverse(p);
          this.place.quantizePosition(p);
          const rotation = new THREE.Quaternion();
          this.grip.getWorldQuaternion(rotation);
          this.place.quantizeQuaternion(rotation);
          const inWorldItem = new InWorldItem(this.item,
            p, rotation);
          inWorldItem.replaceMaterial(Assets.getFirstMaterial(this.cube));
          this.construction.addCube(inWorldItem);
          this.inventory.removeItem(this.item);
          if (!itemQty.has(this.item)) {
            this.setCube(Assets.itemsByName.get('guide'));
          }
          const listener = new THREE.AudioListener();
          this.computer.add(listener);

          // create a global audio source
          const sound = new THREE.Audio(listener);

          // load a sound and set it as the Audio object's buffer
          const audioLoader = new THREE.AudioLoader();
          const num = Math.ceil(Math.random() * 5).toFixed(0);
          const soundname = `sounds/mine${num}.ogg`;
          audioLoader.load(soundname, function (buffer) {
            sound.setBuffer(buffer);
            sound.setLoop(false);
            sound.setVolume(0.5);
            sound.play();
          });
        }
      }
    });
  }
}