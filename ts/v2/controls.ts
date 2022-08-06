import * as THREE from "three";
import { XRHandedness } from "three";
import { Grid } from "./grid";
import { IsoTransform } from "./isoTransform";
import { TwoHands } from "./twoHands";

export class StartStopEvent {
  constructor(
    readonly handedness: THREE.XRHandedness,
    readonly state: 'start' | 'end',
    readonly type: 'squeeze' | 'grip',
    readonly worldPosition: IsoTransform) { }
}

export type StartStopEventHandler = (ev: StartStopEvent) => void;


export class Controls {
  constructor(
    private camera: THREE.PerspectiveCamera,
    private canvas: HTMLCanvasElement,
    private xr: THREE.WebXRManager,
    private player: THREE.Object3D) {
    const km = new Set<string>();
    document.body.addEventListener('keydown', (ke: KeyboardEvent) => {
      km.add(ke.code);
    });
    document.body.addEventListener('keyup', (ke: KeyboardEvent) => {
      km.delete(ke.code);
    });
    this.keysDown = km;

    canvas.addEventListener('mousemove', (ev: MouseEvent) => {
      // calculate pointer position in normalized device coordinates
      // (-1 to +1) for both components
      this.pointer.x = (ev.clientX / canvas.width) * 2 - 1;
      this.pointer.y = - (ev.clientY / canvas.height) * 2 + 1;
    });

    const leftPosition = new IsoTransform();
    const rightPosition = new IsoTransform();

    canvas.addEventListener('mousedown', (ev: MouseEvent) => {
      if (!!this.startStopCallback) {
        this.setPositions(
          leftPosition, rightPosition, this.camera);
        this.startStopCallback(
          new StartStopEvent('left', 'start', 'grip', leftPosition));
      }
    });
    canvas.addEventListener('mouseup', (ev: MouseEvent) => {
      if (!!this.startStopCallback) {
        this.setPositions(
          leftPosition, rightPosition, this.camera);
        this.startStopCallback(
          new StartStopEvent('left', 'end', 'grip', leftPosition));
      }
    });
    this.initialize();
  }

  private async initialize() {
    this.twoHands = await TwoHands.make(this.xr, this.player);
    this.addListeners('left', this.twoHands.getLeftGrip(), this.twoHands.getLeftGrip());
    this.addListeners('right', this.twoHands.getRightGrip(), this.twoHands.getRightGrip());
    return;
  }

  readonly keysDown: Set<string>
  private twoHands: TwoHands;

  private startStopCallback: StartStopEventHandler = undefined;
  public setStartStopCallback(cb: StartStopEventHandler) {
    this.startStopCallback = cb;
  }

  public forwardBack() {
    let result = 0;
    if (!!this.leftSource) {
      result = this.leftSource.gamepad.axes[3];
    }
    if (this.keysDown.has('KeyW')) {
      result += -1.0;
    }
    if (this.keysDown.has('KeyS')) {
      result += 1.0;
    }
    return result;
  }
  public leftRight() {
    let result = 0;
    if (!!this.leftSource) {
      result = this.leftSource.gamepad.axes[2];
    }
    if (this.keysDown.has('KeyD')) {
      result += 1.0;
    }
    if (this.keysDown.has('KeyA')) {
      result += -1.0;
    }
    return result;
  }

  public upDown() {
    let result = 0;
    if (!!this.rightSource) {
      result = -this.rightSource.gamepad.axes[3];
    }
    if (this.keysDown.has('ArrowUp')) {
      result += 1.0;
    }
    if (this.keysDown.has('ArrowDown')) {
      result += -1.0;
    }
    return result;
  }
  public spinLeftRight() {
    let result = 0;
    if (!!this.rightSource) {
      result = -Math.pow(this.rightSource.gamepad.axes[2], 3);
    }
    if (this.keysDown.has('ArrowRight')) {
      result += -1.0;
    }
    if (this.keysDown.has('ArrowLeft')) {
      result += 1.0;
    }
    return result;
  }

  private pointer = new THREE.Vector2();
  private raycaster = new THREE.Raycaster();

  private scaleTen(v: THREE.Vector3, o: THREE.Vector3) {
    v.sub(o);
    v.multiplyScalar(10);
    v.add(o);
  }

  private setCursorPosition(physicalPosition: IsoTransform) {
    this.camera.getWorldPosition(this.tmp);
    this.tmp.y -= 0.15;  // Shoulders 15cm below eyes.
    this.scaleTen(physicalPosition.position, this.tmp);
  }

  private tmp = new THREE.Vector3();
  public setPositions(left: IsoTransform, right: IsoTransform,
    camera: THREE.PerspectiveCamera) {
    if (this.twoHands) {
      this.twoHands.getLeftPosition(left);
      this.setCursorPosition(left);
      this.twoHands.getRightPosition(right);
      this.setCursorPosition(right);
    } else {
      this.raycaster.setFromCamera(this.pointer, camera);
      left.position.copy(this.raycaster.ray.direction);
      left.position.multiplyScalar(10);
      left.position.add(this.raycaster.ray.origin);
      right.position.set(0, 0, 0);
      right.quaternion.copy(Grid.notRotated);
    }
  }

  private session: THREE.XRSession = undefined;
  private leftSource: THREE.XRInputSource = undefined;
  private rightSource: THREE.XRInputSource = undefined;

  private tmpVector = new THREE.Vector3();
  public setSession(session: THREE.XRSession) {
    this.session = session;
    if (session.inputSources && session.inputSources.length >= 2) {
      for (const source of session.inputSources) {
        if (source.handedness === 'left') {
          this.leftSource = source;
        } else {
          this.rightSource = source;
        }
      }
    }
  }

  private addListeners(side: XRHandedness,
    grip: THREE.Object3D, gripLocation: THREE.Object3D) {
    const p = new IsoTransform();

    grip.addEventListener('selectstart', (ev) => {
      if (!!this.startStopCallback) {
        gripLocation.getWorldPosition(p.position);
        gripLocation.getWorldQuaternion(p.quaternion);
        this.setCursorPosition(p);
        this.startStopCallback(
          new StartStopEvent(side, 'start', 'grip', p));
      }
    });
    grip.addEventListener('selectend', (ev) => {
      if (!!this.startStopCallback) {
        gripLocation.getWorldPosition(p.position);
        gripLocation.getWorldQuaternion(p.quaternion);
        this.setCursorPosition(p);
        this.startStopCallback(
          new StartStopEvent(side, 'end', 'grip', p));
      }
    });
  }

  public hasSession(): boolean {
    return !!this.session && !!this.leftSource;
  }
}