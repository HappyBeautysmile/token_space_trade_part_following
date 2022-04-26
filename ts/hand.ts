import * as THREE from "three";
import { Place } from "./place";
import { Tick } from "./tick";
import { Debug } from "./debug";
import { Assets } from "./assets";
import { InHandObject } from "./inHandObject";

export class Hand extends THREE.Object3D {

  private static AllObjects = new Map<string, THREE.Object3D>();

  private cube: THREE.Object3D;
  private templateCube: THREE.Object3D;

  private debug: THREE.Object3D;
  private debugMaterial: THREE.MeshStandardMaterial;

  constructor(private grip: THREE.Object3D, initialObject: THREE.Object3D,
    private index: number, private xr: THREE.WebXRManager,
    private place: Place,
    private leftHand: boolean) {
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

    this.setCube(initialObject);
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
        Debug.log(`Has a source. left:${this.leftHand}`);
        this.sourceLogged = true;
      }
      //this.debugMaterial.color = new THREE.Color('blue');
      const rate = 3;
      const rotRate = 1;
      const axes = source.gamepad.axes.slice(0);
      if (axes.length >= 4) {
        //this.debugMaterial.color = new THREE.Color('green');
        if (!axes[2] || !axes[3]) {
          // Sticks are not being touched.
        } else {
          //this.debugMaterial.color = new THREE.Color('orange');
          this
          if (this.leftHand) {
            this.v.set(axes[2], 0, axes[3]);
            this.v.multiplyScalar(rate * t.deltaS);
            this.place.movePlayerRelativeToCamera(this.v);
          }
          else {
            this.v.set(0, -axes[3], 0);
            this.v.multiplyScalar(rate * t.deltaS);
            this.place.movePlayerRelativeToCamera(this.v);
            // // rotate playerGroup around camera
            // let moveVector = new THREE.Vector3(
            //   this.place.camera.position.x - this.place.playerGroup.position.x,
            //   this.place.camera.position.y - this.place.playerGroup.position.y,
            //   this.place.camera.position.z - this.place.playerGroup.position.z,
            // );
            // this.place.playerGroup.position.add(moveVector);
            this.place.playerGroup.rotateY(-axes[2] * rotRate * t.deltaS);
            // moveVector = new THREE.Vector3().sub(moveVector);
            // this.place.playerGroup.position.add(moveVector);
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
      if (buttons[3] === 1 && this.lastButtons[3] != 1) { // stick
        //this.debugMaterial.color = new THREE.Color('blue');
        this.place.stop();
      }
      if (buttons[4] === 1 && this.lastButtons[4] != 1) { // A or X
        Debug.log(`Camera: ${JSON.stringify(this.place.camera.position)}`);
        Debug.log(`Chest Player: ${JSON.stringify(this.chestPlayer)}`);
        Debug.log(`Direction Player: ${JSON.stringify(this.directionPlayer)}`);
      }
      if (buttons[5] === 1 && this.lastButtons[5] != 1) { // B or Y
        Assets.nextColor(this.cube);
      }
      this.lastButtons = buttons;
    }
  }

  public setCube(o: THREE.Object3D) {
    if (this.cube) {
      this.place.playerGroup.remove(this.cube);
    }
    this.templateCube = o.clone();
    //this.cube = new InHandObject(o, this.place);
    this.cube = o.clone();
    this.place.playerGroup.add(this.cube);
  }

  private posToKey(p: THREE.Vector3): string {
    return `${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)}`;
  }

  private deleteCube() {
    this.p.copy(this.cube.position);
    this.place.playerToUniverse(this.p);
    this.place.quantizePosition(this.p);
    const key = this.posToKey(this.p);
    if (Hand.AllObjects.has(key)) {
      this.place.universeGroup.remove(Hand.AllObjects.get(key));
      Hand.AllObjects.delete(key);
    }
  }

  private p = new THREE.Vector3();
  private async initialize() {
    this.grip.addEventListener('squeeze', () => {
      this.deleteCube();
    });

    this.grip.addEventListener('selectstart', () => {
      this.deleteCube();
      const o = this.cube.clone();
      //Debug.log("this.cube.quaternion=" + JSON.stringify(this.cube.quaternion));
      o.position.copy(this.cube.position);
      o.rotation.copy(this.cube.rotation);
      //Debug.log("o.quaternion=" + JSON.stringify(o.quaternion));
      o.applyQuaternion(this.place.playerGroup.quaternion);
      //Debug.log("post applyQuarternion o.quaternion=" + JSON.stringify(o.quaternion));
      const p = o.position;
      this.place.playerToUniverse(p);
      this.place.quantizePosition(p);
      this.place.quantizeRotation(o.rotation);
      //Debug.log("post quantize o.quaternion=" + JSON.stringify(o.quaternion));
      this.place.universeGroup.add(o);
      const key = this.posToKey(o.position);
      Hand.AllObjects.set(key, o);
    });

    // this.grip.addEventListener('selectend', () => {

    // });
  }
}
