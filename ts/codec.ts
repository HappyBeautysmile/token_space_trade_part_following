import { assert } from "console";
import * as THREE from "three";
import { Assets } from "./assets";
import { Debug } from "./debug";
import { InWorldItem } from "./inWorldItem";

export class Encode {
  static inWorldItem(o: InWorldItem): Object {
    const result = {};
    result['position'] = o.position;
    result['quarternion'] = o.quaternion;
    result['modelName'] = o.item.modelName;
    return result;
  }
  static arrayOfInWorldItems(cubes: Iterable<InWorldItem>): Object[] {
    const result = [];
    for (const cube of cubes) {
      result.push(Encode.inWorldItem(cube));
    }
    return result;
  }
}

export class Decode {
  static object3D(o: Object): THREE.Object3D {
    const model = Assets.models.get(o['modelName']).clone();
    Debug.assert(!!model, `No model for ${o['modelName']}`);
    // TODO: Material loading isn't working.
    // const material = Codec.findMaterialByName(o['materialName']);
    // Debug.assert(!!material, `No material for ${o['materialName']}`)
    let mesh = model.clone();
    mesh.position.set(
      o['position'].x, o['position'].y, o['position'].z);
    const quaternion = new THREE.Quaternion();
    Object.assign(quaternion, o['quaternion'])
    mesh.applyQuaternion(quaternion);
    return mesh;
  }

  static arrayOfObject3D(obs: Object[]): THREE.Object3D[] {
    const result: THREE.Object3D[] = [];
    for (const o of obs) {
      result.push(Decode.object3D(o));
    }
    return result;
  }
}

export class Codec {
  public static findMaterialByName(name: string) {
    for (const material of Assets.materials) {
      if (material.userData["materialName"] == name) {
        Debug.assert(material.type === "Material");
        return material;
      }
    };
    return null;
  }

}