import * as THREE from "three";

export class StartStopEvent {
  constructor(
    readonly handedness: THREE.XRHandedness,
    readonly state: 'start' | 'end',
    readonly type: 'squeeze' | 'grip',
    readonly worldPosition: THREE.Vector3) { }
}

export type StartStopEventHandler = (ev: StartStopEvent) => void;


export class Controls {
  constructor(
    private camera: THREE.PerspectiveCamera,
    private canvas: HTMLCanvasElement) {
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

    const leftPosition = new THREE.Vector3();
    const rightPosition = new THREE.Vector3();

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
  }

  readonly keysDown: Set<string>

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

  public setPositions(left: THREE.Vector3, right: THREE.Vector3,
    camera: THREE.PerspectiveCamera) {
    // TODO: if grips have not been set.
    this.raycaster.setFromCamera(this.pointer, camera);
    left.copy(this.raycaster.ray.direction);
    left.multiplyScalar(10);
    left.add(this.raycaster.ray.origin);

    right.set(0, 0, 0);
  }

  private session: THREE.XRSession = undefined;
  private leftSource: THREE.XRInputSource = undefined;
  private rightSource: THREE.XRInputSource = undefined;
  private leftGrip: THREE.Group;
  private rightGrip: THREE.Group;
  private tmpVector = new THREE.Vector3();
  public setSession(session: THREE.XRSession,
    leftGrip: THREE.Group, rightGrip: THREE.Group) {
    this.session = session;
    this.leftGrip = leftGrip;
    this.rightGrip = rightGrip;
    if (session.inputSources && session.inputSources.length >= 2) {
      for (const source of session.inputSources) {
        if (source.handedness === 'left') {
          this.leftSource = source;
        } else {
          this.rightSource = source;
        }
      }
    }
    this.leftGrip.addEventListener('selectstart', (ev) => {
      if (!!this.startStopCallback) {
        this.leftGrip.getWorldPosition(this.tmpVector);
        this.startStopCallback(
          new StartStopEvent('left', 'start', 'grip', this.tmpVector));
      }
    });
    this.leftGrip.addEventListener('selectend', (ev) => {
      if (!!this.startStopCallback) {
        this.leftGrip.getWorldPosition(this.tmpVector);
        this.startStopCallback(
          new StartStopEvent('left', 'end', 'grip', this.tmpVector));
      }
    });
  }

  public hasSession(): boolean {
    return !!this.session && !!this.leftSource;
  }
}