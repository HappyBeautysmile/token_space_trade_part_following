import * as THREE from "three";

class Format {
    public position: THREE.Vector3;
    public quarternion: THREE.Quaternion;
    public modelName: string;

    constructor(o: THREE.Object3D) {
        this.position = o.position;
        this.quarternion = o.quaternion;
        this.modelName = o.userData["modelName"];
    }
}

export class Codec {

    public toSaveFormat(input: Map<string, THREE.Object3D>) {
        let output = [];
        input.forEach((value: THREE.Object3D, key: string) => {
            output.push(new Format(value));
        });

        return output;
    }

    public fromSaveFormat() {

    }

}