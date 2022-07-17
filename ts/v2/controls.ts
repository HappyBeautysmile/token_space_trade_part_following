import * as THREE from "three";

export class Controls {
  static keysDown: Set<string> = (() => {
    const km = new Set<string>();
    document.body.addEventListener('keydown', (ke: KeyboardEvent) => {
      km.add(ke.code);
    });
    document.body.addEventListener('keyup', (ke: KeyboardEvent) => {
      km.delete(ke.code);
    });
    return km;
  })();

  static forwardBack() {
    let result = 0;
    if (!!Controls.leftSource) {
      result = Controls.leftSource.gamepad.axes[3];
    }
    if (Controls.keysDown.has('KeyW')) {
      result += -1.0;
    }
    if (Controls.keysDown.has('KeyS')) {
      result += 1.0;
    }
    return result;
  }
  static leftRight() {
    let result = 0;
    if (!!Controls.leftSource) {
      result = Controls.leftSource.gamepad.axes[2];
    }
    if (Controls.keysDown.has('KeyD')) {
      result += 1.0;
    }
    if (Controls.keysDown.has('KeyA')) {
      result += -1.0;
    }
    return result;
  }

  static upDown() {
    let result = 0;
    if (!!Controls.rightSource) {
      result = -Controls.rightSource.gamepad.axes[3];
    }
    if (Controls.keysDown.has('ArrowUp')) {
      result += 1.0;
    }
    if (Controls.keysDown.has('ArrowDown')) {
      result += -1.0;
    }
    return result;
  }
  static spinLeftRight() {
    let result = 0;
    if (!!Controls.rightSource) {
      result = -Math.pow(Controls.rightSource.gamepad.axes[2], 3);
    }
    if (Controls.keysDown.has('ArrowRight')) {
      result += -1.0;
    }
    if (Controls.keysDown.has('ArrowLeft')) {
      result += 1.0;
    }
    return result;
  }

  static pointer = new THREE.Vector2();
  static raycaster = new THREE.Raycaster();
  static initialized = false;

  private static initialize() {
    const canvas: HTMLCanvasElement = document.getElementsByTagName('canvas')[0];
    canvas.addEventListener('mousemove', (ev: MouseEvent) => {
      // calculate pointer position in normalized device coordinates
      // (-1 to +1) for both components
      Controls.pointer.x = (ev.clientX / canvas.width) * 2 - 1;
      Controls.pointer.y = - (ev.clientY / canvas.height) * 2 + 1;
    });
  }

  static setPositions(left: THREE.Vector3, right: THREE.Vector3,
    camera: THREE.PerspectiveCamera) {
    if (!Controls.initialized) {
      Controls.initialize();
    }
    // TODO: if grips have not been set.
    Controls.raycaster.setFromCamera(Controls.pointer, camera);
    left.copy(Controls.raycaster.ray.direction);
    left.add(Controls.raycaster.ray.origin);
    right.set(0, 0, 0);
  }

  private static session: THREE.XRSession = undefined;
  private static leftSource: THREE.XRInputSource = undefined;
  private static rightSource: THREE.XRInputSource = undefined;
  static setSession(session: THREE.XRSession) {
    Controls.session = session;
    if (session.inputSources && session.inputSources.length >= 2) {
      for (const source of session.inputSources) {
        if (source.handedness === 'left') {
          Controls.leftSource = source;
        } else {
          Controls.rightSource = source;
        }
      }
    }
  }

  static hasSession(): boolean {
    return !!Controls.session && !!Controls.leftSource;
  }
}