import * as THREE from "three";

import { S } from "./settings";
import { Tick, Ticker } from "./tick";
import { StarSystem } from "./starSystem";
import { PointCloud } from "./pointCloud";

// A collection of StarSystems.  We only instantiate the StarSystem object
// when the world origin is close to it.
export class VeryLargeUniverse extends THREE.Object3D implements Ticker {
  private starCloud: PointCloud;
  private currentStarMap = new Map<THREE.Vector3, StarSystem>();
  constructor(private grips: THREE.Object3D[],
    private camera: THREE.Camera,
    private xr: THREE.WebXRManager,
    private keysDown: Set<string>) {
    super();

    this.starCloud = new PointCloud(
      0, S.float('sr'), S.float('sr') / 10, S.float('ns'),
      new THREE.Color('#ff4'), /*pointRadius=*/1.0);
    this.add(this.starCloud);
    this.position.set(0, 0, -1e6);
  }

  private p1 = new THREE.Vector3();

  private getButtonsFromGrip(index: number): number[] {
    let source: THREE.XRInputSource = null;
    const session = this.xr.getSession();
    if (session) {
      if (session.inputSources) {
        source = session.inputSources[index];
      }
      return source.gamepad.buttons.map((b) => b.value);
    } else {
      return [];
    }
  }

  private direction = new THREE.Vector3();
  private m1 = new THREE.Matrix4();
  private m2 = new THREE.Matrix4();
  private m3 = new THREE.Matrix4();
  zoomAroundWorldOrigin(zoomFactor: number) {
    // TODO: Fix this - it assumes position is initially zero (I think)
    this.position.multiplyScalar(zoomFactor);
    this.scale.multiplyScalar(zoomFactor);
  }

  tick(t: Tick) {
    const leftButtons = this.getButtonsFromGrip(0);
    const rightButtons = this.getButtonsFromGrip(1);

    if (leftButtons[4] === 1 || rightButtons[4] === 1  // A or X
      || this.keysDown.has('Equal')) {
      this.zoomAroundWorldOrigin(Math.pow(2, t.deltaS));
    }
    if (leftButtons[5] === 1 || rightButtons[5] === 1  // B or Y
      || this.keysDown.has('Minus')) {
      this.zoomAroundWorldOrigin(Math.pow(0.5, t.deltaS));
    }

    if ((leftButtons[0] && rightButtons[0]) ||  // Trigger
      this.keysDown.has('KeyW')) {
      this.camera.getWorldDirection(this.direction);
      this.direction.multiplyScalar(-t.deltaS * 1.0);
      this.position.sub(this.direction);
      this.updateMatrix();
    }

    if ((leftButtons[1] && rightButtons[1]) ||  // Squeeze
      this.keysDown.has('KeyS')) {
      this.camera.getWorldDirection(this.direction);
      this.direction.multiplyScalar(t.deltaS * 1.0);
      this.position.sub(this.direction);
      this.updateMatrix();
    }

    if (this.keysDown.has('ArrowLeft')) {
      this.camera.rotateY(2 * t.deltaS);
    }
    if (this.keysDown.has('ArrowRight')) {
      this.camera.rotateY(-2 * t.deltaS);
    }
    if (this.keysDown.has('ArrowUp')) {
      this.camera.rotateX(2 * t.deltaS);
    }
    if (this.keysDown.has('ArrowDown')) {
      this.camera.rotateX(-2 * t.deltaS);
    }

    this.camera.getWorldPosition(this.p1);
    this.worldToLocal(this.p1);
    for (const closePoint of this.starCloud.starPositions.getAllWithinRadius(
      this.p1, 1e5)) {
      if (!this.currentStarMap.has(closePoint)) {
        const starSystem = new StarSystem();
        starSystem.position.copy(closePoint);
        this.currentStarMap.set(closePoint, starSystem);
        this.add(starSystem);
      }
    }
  }
}