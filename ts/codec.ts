import { assert } from "console";
import * as THREE from "three";
import { Assets } from "./assets";
import { Debug } from "./debug";
import { InWorldItem } from "./inWorldItem";

export class Encode {
  static inWorldItem(o: InWorldItem): Object {
    const result = {};
    result['position'] = o.position;
    result['quaternion'] = o.quaternion;
    result['modelName'] = o.item.modelName;
    let mat = o.getMesh().material as THREE.Material;
    result['materialName'] = mat.userData['materialName'];
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
  //static object3D(o: Object): THREE.Object3D {
  static toInWorldItem(o: Object): InWorldItem {
    //const model = Assets.models.get(o['modelName']).clone();
    //Debug.assert(!!model, `No model for ${o['modelName']}`);

    //let mesh = model.clone();
    //mesh.position.set(
    //   o['position'].x, o['position'].y, o['position'].z);
    // const quaternion = new THREE.Quaternion();
    // Object.assign(quaternion, o['quaternion'])
    // mesh.applyQuaternion(quaternion);

    const material = Codec.findMaterialByName(o['materialName']);
    const quaternion = new THREE.Quaternion();
    Object.assign(quaternion, o['quaternion'])
    const position = new THREE.Vector3();
    Object.assign(position, o['position']);
    const inWorldItem = new InWorldItem(
      Assets.itemsByName.get(o['modelName']), position, quaternion);
    inWorldItem.replaceMaterial(material);
    return inWorldItem;
  }

  // static arrayOfObject3D(obs: Object[]): THREE.Object3D[] {
  //   const result: THREE.Object3D[] = [];
  //   for (const o of obs) {
  //     result.push(Decode.object3D(o));
  //   }
  //   return result;
  // }
  static arrayOfInWorldItem(obs: Object[]) {
    const result: InWorldItem[] = [];
    for (const o of obs) {
      result.push(Decode.toInWorldItem(o));
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