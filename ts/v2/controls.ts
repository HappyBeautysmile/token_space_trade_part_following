import { Session } from "inspector";

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