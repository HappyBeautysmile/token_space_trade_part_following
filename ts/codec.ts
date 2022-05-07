import { assert } from "console";
import * as THREE from "three";
import { Assets } from "./assets";
import { Debug } from "./debug";

export class Encode {
  static object3D(o: THREE.Object3D): Object {
    const result = {};
    result['position'] = o.position;
    result['quarternion'] = o.quaternion;
    result['modelName'] = o.userData["modelName"];
    let mesh = o.children[0] as THREE.Mesh;
    let mat = mesh.material as THREE.Material;
    if (mat.userData["materialName"]) {
      this['materialName'] = mat.userData["materialName"];
    }
    return result;
  }
  static arrayOfObject3D(cubes: Iterable<THREE.Object3D>): Object[] {
    const result = [];
    for (const cube of cubes) {
      result.push(Encode.object3D(cube));
    }
    return result;
  }
}

export class Decode {
  static object3D(o: Object): THREE.Object3D {
    const model = Codec.findModelByName(o['modelName']);
    console.assert(!!model, `No model for ${o['modelName']}`);
    // TODO: Material loading isn't working.
    // const material = Codec.findMaterialByName(o['materialName']);
    // console.assert(!!material, `No material for ${o['materialName']}`)
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
  public static findModelByName(name: string): THREE.Mesh {
    for (const mesh of Assets.blocks) {
      if (mesh.userData["modelName"] == name) {
        console.assert(mesh.type === 'Mesh');
        return mesh as THREE.Mesh;
      }
    };
    return null;
  }

  public static findMaterialByName(name: string) {
    for (const material of Assets.materials) {
      if (material.userData["materialName"] == name) {
        console.assert(material.type === "Material");
        return material;
      }
    };
    return null;
  }

}