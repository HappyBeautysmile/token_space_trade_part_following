import * as THREE from "three";

export class TwoHands {
  private leftGrip: THREE.Object3D;
  private rightGrip: THREE.Object3D;
  private leftSource: THREE.XRInputSource;
  private rightSource: THREE.XRInputSource;
  private numHands = 0;

  public static async make(xr: THREE.WebXRManager): Promise<TwoHands> {
    return new Promise<TwoHands>((resolve) => {
      const th = new TwoHands(xr, resolve);
    });
  }

  private constructor(xr: THREE.WebXRManager,
    doneCallback: (o: TwoHands) => void) {
    this.registerConnection(xr.getControllerGrip(0), doneCallback);
    this.registerConnection(xr.getControllerGrip(1), doneCallback);
  }

  private registerConnection(grip: THREE.Object3D,
    doneCallback: (o: TwoHands) => void) {
    grip.addEventListener('connected', (ev) => {
      const data: THREE.XRInputSource = ev.data;
      if (data.handedness == 'left') {
        this.leftGrip = grip;
        this.leftSource = data;
        this.leftGrip.add(new THREE.Mesh(new THREE.IcosahedronBufferGeometry(0.05, 3),
          new THREE.MeshPhongMaterial({ color: '#88f' })));
        ++this.numHands;
        if (this.numHands == 2) {
          doneCallback(this);
        }
      } else {
        this.rightGrip = grip;
        this.rightSource = data;
        this.rightGrip.add(new THREE.Mesh(new THREE.IcosahedronBufferGeometry(0.05, 3),
          new THREE.MeshPhongMaterial({ color: '#f88' })));
        ++this.numHands;
        if (this.numHands == 2) {
          doneCallback(this);
        }
      }
    });
  }

  public isInitialized() {
    return this.numHands === 2;
  }

  public getLeftPosition(target: THREE.Vector3) {
    if (this.leftGrip) {
      this.leftGrip.getWorldPosition(target);
    }
  }

  public getRightPosition(target: THREE.Vector3) {
    if (this.rightGrip) {
      this.rightGrip.getWorldPosition(target);
    }
  }

}