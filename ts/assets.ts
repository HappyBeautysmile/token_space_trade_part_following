import * as THREE from "three";
import { Debug } from "./debug";

export class Assets extends THREE.Object3D {

    public replaceMaterial(source: THREE.Object3D, mat: THREE.Material) {
        console.log(`${source.name} (${source.type})`);
        if (source instanceof THREE.Mesh) {
            source.material = mat;
        }
        else {
            Debug.log("not a mesh.");
        }
        if (source instanceof THREE.Group) {
            Debug.log("is a group");
            for (let i = 0; i < source.children.length; i++) {
                this.replaceMaterial(source.children[i], mat);
            }
        }
    }
}