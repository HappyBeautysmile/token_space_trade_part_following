import * as THREE from "three";
import { Debug } from "./debug";

export type ButtonCallback = () => void;


class Button {
  constructor(readonly o: THREE.Object3D,
    readonly localPosition: THREE.Vector3,
    readonly radius: number) { }

  private static globalPosition = new THREE.Vector3();
  private static p = new THREE.Vector3();
  // Returns null if `ray` misses this.  Otherwise returns
  // the distance of the closest approach.  `ray` is in world space.
  closestApproach(ray: THREE.Ray): number {
    Button.globalPosition.copy(this.localPosition);
    this.o.localToWorld(Button.globalPosition);

    ray.closestPointToPoint(Button.globalPosition, Button.p);
    Button.p.sub(Button.globalPosition);
    const distance = Button.p.length();
    if (distance <= this.radius) {
      return distance;
    } else {
      return undefined;
    }
  }
}

export class ButtonDispatcher {
  // This class is purely static. Do not instantiate it.
  private constructor() { };

  private static callbacks = new Map<Button, ButtonCallback>();

  static registerButton(
    o: THREE.Object3D, localPosition: THREE.Vector3, radius: number,
    callback: ButtonCallback) {
    Debug.log(`localPosition=${JSON.stringify(localPosition)} radius=${radius}`);
    const button = new Button(o, localPosition, radius);
    ButtonDispatcher.callbacks.set(button, callback);
  }

  static closestApproach(ray: THREE.Ray): number {
    let closest: number = undefined;
    for (const button of ButtonDispatcher.callbacks.keys()) {
      let distance = button.closestApproach(ray);
      if (distance < closest || closest === undefined) {
        closest = distance;
      }
    }
    return closest;
  }

  static cast(ray: THREE.Ray) {
    let closest = 1e12;
    let bestCallback: ButtonCallback = null;
    for (const [button, callback] of ButtonDispatcher.callbacks.entries()) {
      let distance = button.closestApproach(ray);
      if (distance < closest) {
        closest = distance;
        bestCallback = callback;
      }
    }
    if (bestCallback) {
      bestCallback();
    }
  }

}