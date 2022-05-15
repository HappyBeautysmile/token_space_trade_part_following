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
  private velocity = new THREE.Vector3();

  // Moves the player relative to the camera's orientation.
  public movePlayerRelativeToCamera(motion: THREE.Vector3) {
    this.cameraNormalMatrix.getNormalMatrix(this.camera.matrixWorld);

    this.p.copy(motion);
    this.p.applyMatrix3(this.cameraNormalMatrix);
    this.velocity.add(this.p);
    // Debug.log(`p=${JSON.stringify(this.p)}`);
    // Debug.log(`velocity=${JSON.stringify(this.velocity)}`);
    // Debug.log(`motion=${JSON.stringify(motion)}`);
    //this.playerGroup.position.add(this.p);
    this.universeGroup.position.sub(this.p);
    //Debug.log(`Camera: ${JSON.stringify(this.camera.position)}`);
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
  public worldToPlayer(v: THREE.Vector3) {
    this.playerGroup.worldToLocal(v);
  }

  // Quantizes the Euler angles to be cube-aligned
  public quantizeRotation(v: THREE.Euler) {
    const q = Math.PI / 2;
    v.x = q * Math.round(v.x / q);
    v.y = q * Math.round(v.y / q);
    v.z = q * Math.round(v.z / q);
  }

  // Quantizes the Quaternion angles to be cube-aligned
  public quantizeQuaternion(quaternion: THREE.Quaternion) {
    const v = new THREE.Euler();
    v.setFromQuaternion(quaternion);
    this.quantizeRotation(v);
    quaternion.setFromEuler(v);
  }

  // Quantize position to 1 meter 3D grid.
  public quantizePosition(p: THREE.Vector3) {
    p.x = Math.round(p.x);
    p.y = Math.round(p.y);
    p.z = Math.round(p.z);
  }

  public stop() {
    this.velocity = new THREE.Vector3(0, 0, 0);
  }
}