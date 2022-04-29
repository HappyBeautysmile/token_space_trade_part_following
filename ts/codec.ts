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
        Debug.log("before ... as mesh");
        let mesh = o as THREE.Mesh;
        Debug.log("mesh as o worked. before ... as material");
        let mat = mesh.material as THREE.Material;
        Debug.log(" ... as material worked.  before asigning texture name.");
        this.textureName = mat.userData["textureName"];
        Debug.log("asigning texture name worked.");
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