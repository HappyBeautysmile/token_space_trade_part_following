import * as THREE from "three";
import { Place } from "./place";
import { Tick } from "./tick";
import { Debug } from "./debug";
import { InHandObject } from "./inHandObject";

export class Hand extends THREE.Object3D {

  private static AllObjects = new Map<string, THREE.Object3D>();

  //private cube: THREE.Object3D;
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
    this.debug = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(0.02, 0.02, 0.5), this.debugMaterial);
    this.debug.position.set(0, 0, -1);
    this.add(this.debug);

    grip.add(this);
    this.setCube(initialObject);
    this.place.playerGroup.add(this.cube);

    // const cube = new THREE.Mesh(
    //   new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
    //   new THREE.MeshStandardMaterial({ color: '#987' }));
    // //cube.position.z = -0.2;
    // this.add(cube);

    // const lineMaterial = new THREE.LineBasicMaterial({ color: '#d00' });
    // const lineGeometry = new THREE.BufferGeometry()
    //   .setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, -0.5, 0)]);
    // const line = new THREE.Line(lineGeometry, lineMaterial);
    // this.add(line);
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
    this.cube.position.multiplyScalar(10);
    this.cube.position.add(this.grip.position);
    //this.place.playerToUniverse(this.cube.position);
    //this.place.worldToUniverse(this.cube.position);
    this.cube.rotation.copy(this.grip.rotation);
  }

  private v = new THREE.Vector3();
  public tick(t: Tick) {
    this.setCubePosition();
    let source: THREE.XRInputSource = null;
    const session = this.xr.getSession();
    if (session) {
      //this.debugMaterial.color = new THREE.Color('red');
      if (session.inputSources) {
        //this.debugMaterial.color = new THREE.Color('brown');
        source = session.inputSources[this.index];
      }
    }

    if (source) {
      //this.debugMaterial.color = new THREE.Color('blue');
      const rate = 3;
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
            // this.universeGroup.rotateY(axes[2] * rate * t.deltaS)
          }
        }
      }
      const buttons = source.gamepad.buttons.map((b) => b.value);
      if (buttons[0] === 1) { // trigger
        this.debugMaterial.color = new THREE.Color('red');
      }
      if (buttons[1] === 1) { // squeeze
        this.debugMaterial.color = new THREE.Color('yellow');
      }
      if (buttons[3] === 1) { // stick
        //this.debugMaterial.color = new THREE.Color('blue');
        this.place.stop();
      }
      if (buttons[4] === 1) { // A or X
        Debug.log(`Camera: ${JSON.stringify(this.place.camera.position)}`);
        Debug.log(`Chest Player: ${JSON.stringify(this.chestPlayer)}`);
        Debug.log(`Direction Player: ${JSON.stringify(this.directionPlayer)}`);
      }
      if (buttons[5] === 1) { // B or Y
        // const newMat = new THREE.MeshPhongMaterial({ color: new THREE.Color(Math.random(), Math.random(), Math.random()) });
        // this.cube.material = newMat;
      }
    }
  }

  public setCube(o: THREE.Object3D) {
    if (this.cube) {
      this.place.playerGroup.remove(this.cube);
    }
    this.templateCube = o;
    this.cube = new InHandObject(o, this.place);
    this.place.playerGroup.add(this.cube);
  }

  private posToKey(p: THREE.Vector3): string {
    return `${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)}`;
  }

  private p = new THREE.Vector3();
  private async initialize() {
    this.grip.addEventListener('squeeze', () => {
      this.p.copy(this.cube.position);
      this.place.playerToUniverse(this.p);
      this.place.quantizePosition(this.p);
      const key = this.posToKey(this.p);
      if (Hand.AllObjects.has(key)) {
        this.place.universeGroup.remove(Hand.AllObjects.get(key));
        Hand.AllObjects.delete(key);  // TODO: it seems this isn't working.  If you put two objects in the same place you can't delete by squeezing twice.
      }
    });

    this.grip.addEventListener('selectstart', () => {
      const o = this.templateCube.clone();
      o.position.copy(this.cube.position);
      o.rotation.copy(this.cube.rotation);
      const p = o.position;
      this.place.playerToUniverse(p);
      this.place.quantizePosition(p);
      this.place.quantizeRotation(o.rotation);
      this.place.universeGroup.add(o);
      const key = this.posToKey(o.position);
      Hand.AllObjects.set(key, o);
    });

    this.grip.addEventListener('selectend', () => {

    });
  }
}
