import * as THREE from "three";
import { Assets } from "./assets";
import { Debug } from "./debug";

class Encode {
    public position: THREE.Vector3;
    public quarternion: THREE.Quaternion;
    public modelName: string;
    public materialName: string;

    constructor(o: THREE.Object3D) {

        this.position = o.position;
        this.quarternion = o.quaternion;
        this.modelName = o.userData["modelName"];
        let mesh = o.children[0] as THREE.Mesh;
        let mat = mesh.material as THREE.Material;
        if (mat.userData["materialName"]) {
            this.materialName = mat.userData["materialName"];
        }
    }
}

export class Codec {

    public toSaveFormat(input: Map<string, THREE.Object3D>) {
        let output = [];
        input.forEach((value: THREE.Object3D, key: string) => {
            output.push(new Encode(value));
        });

        return output;
    }

    public fromSaveFormat(input: [Encode]) {
        let output: THREE.Mesh[] = [];
        input.forEach((value: Encode) => {
            let o = new THREE.Mesh(
                this.findModelByName(value.modelName),
                this.findMaterialByName(value.materialName)
            );
            o.position.set(value.position.x, value.position.y, value.position.z);
            o.applyQuaternion(value.quarternion);
            output.push(o);
        });
    }

    public findModelByName(name: string) {
        Assets.blocks.forEach((mesh: THREE.Mesh) => {
            if (mesh.userData["modelName"] == name) {
                return mesh;
            }
        });
        return null;
    }

    public findMaterialByName(name: string) {
        Assets.materials.forEach((material: THREE.Material) => {
            if (material.userData["materialName"] == name) {
                return material;
            }
        });
        return null;
    }

}