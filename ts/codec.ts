import * as THREE from "three";
import { Debug } from "./debug";

class Encode {
    public position: THREE.Vector3;
    public quarternion: THREE.Quaternion;
    public modelName: string;
    public textureName: string;

    constructor(o: THREE.Object3D) {

        this.position = o.position;
        this.quarternion = o.quaternion;
        this.modelName = o.userData["modelName"];
        let mesh = o.children[0] as THREE.Mesh;
        let mat = mesh.material as THREE.Material;
        if (mat.userData["textureName"]) {
            this.textureName = mat.userData["textureName"];
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

    public fromSaveFormat() {

    }

}