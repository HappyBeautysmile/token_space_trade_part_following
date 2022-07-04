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
    if (Controls.keysDown.has('KeyW')) {
      return -1.0;
    } else if (Controls.keysDown.has('KeyS')) {
      return 1.0;
    } else {
      return 0.0;
    }
  }
  static leftRight() {
    if (Controls.keysDown.has('KeyD')) {
      return 1.0;
    } else if (Controls.keysDown.has('KeyA')) {
      return -1.0;
    } else {
      return 0.0;
    }
  }

  static upDown() {
    if (Controls.keysDown.has('ArrowUp')) {
      return 1.0;
    } else if (Controls.keysDown.has('ArrowDown')) {
      return -1.0;
    } else {
      return 0.0;
    }
  }
  static spinLeftRight() {
    if (Controls.keysDown.has('ArrowRight')) {
      return -1.0;
    } else if (Controls.keysDown.has('ArrowLeft')) {
      return 1.0;
    } else {
      return 0.0;
    }
  }
}