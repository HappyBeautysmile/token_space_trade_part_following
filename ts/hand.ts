import * as THREE from "three";
import { Place } from "./place";
import { Tick } from "./tick";

export class Hand extends THREE.Object3D {

  private static AllObjects = new Map<string, THREE.Object3D>();

  private cube: THREE.Object3D;

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
    this.cube = initialObject;
    this.place.universeGroup.add(this.cube);

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

  // Quantizes the Euler angles to be cube-aligned
  private quantizeRotation(v: THREE.Euler) {
    const q = Math.PI / 2;
    v.x = q * Math.round(v.x / q);
    v.y = q * Math.round(v.y / q);
    v.z = q * Math.round(v.z / q);
  }

  private quantizePosition(p: THREE.Vector3) {
    p.x = Math.round(p.x);
    p.y = Math.round(p.y);
    p.z = Math.round(p.z);
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
      if (buttons[0] === 1) {
        this.debugMaterial.color = new THREE.Color('brown');
      }
      if (buttons[1] === 1) {
        this.debugMaterial.color = new THREE.Color('red');
      }
      if (buttons[2] === 1) {
        this.debugMaterial.color = new THREE.Color('orange');
      }
      if (buttons[3] === 1) {
        this.debugMaterial.color = new THREE.Color('yellow');
      }
    }
  }

  public setCube(o: THREE.Object3D) {
    this.place.universeGroup.remove(this.cube);
    this.cube = o;
    this.place.universeGroup.add(this.cube);
  }

  private posToKey(p: THREE.Vector3): string {
    return `${p.x.toFixed(0)},${p.y.toFixed(0)},${p.z.toFixed(0)}`;
  }

  private async initialize() {
    this.grip.addEventListener('squeeze', () => {
      const p = this.cube.position;
      this.quantizePosition(p);
      const key = this.posToKey(p);
      if (Hand.AllObjects.has(key)) {
        this.place.universeGroup.remove(Hand.AllObjects.get(key));
        Hand.AllObjects.delete(key);
      }
    });

    this.grip.addEventListener('selectstart', () => {
      const o = this.cube.clone();

      const p = o.position;
      this.quantizePosition(p);
      this.quantizeRotation(o.rotation);
      this.place.universeGroup.add(o);
      const key = this.posToKey(o.position);
      Hand.AllObjects.set(key, o);
    });

    this.grip.addEventListener('selectend', () => {

    });
  }
}
