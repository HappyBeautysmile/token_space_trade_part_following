import * as THREE from "three";
import { Debug } from "./debug";

// Groups representing the universe, the player, and the camera.
// This class is used to control movement of the player through the environment.
// For now we're implementing it so the player moves through the universe.
// To improve rendering quality, we may need to change this so the universe
// moves around the player.
export class Place {
  constructor(readonly universeGroup: THREE.Group,
    readonly playerGroup: THREE.Group,
    readonly camera: THREE.Camera) { }

  private p = new THREE.Vector3();
  private cameraNormalMatrix = new THREE.Matrix3();

  // Moves the player relative to the camera's orientation.
  public movePlayerRelativeToCamera(motion: THREE.Vector3) {
    this.cameraNormalMatrix.getNormalMatrix(this.camera.matrixWorld);

    this.p.copy(motion);
    this.p.applyMatrix3(this.cameraNormalMatrix);
    this.playerGroup.position.add(this.p);

    Debug.log(`Camera: ${JSON.stringify(this.camera.position)}`);
  }

  public rotatePlayerRelativeToWorldY(rotation: number) {
    this.playerGroup.rotation.y += rotation;
  }

  // Converts a posiiton in the player space to universe space.
  public playerToUniverse(v: THREE.Vector3) {
    this.playerGroup.localToWorld(v);
    this.universeGroup.worldToLocal(v);
  }
  public worldToUniverse(v: THREE.Vector3) {
    this.universeGroup.worldToLocal(v);
  }
}