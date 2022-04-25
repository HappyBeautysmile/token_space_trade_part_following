import * as THREE from "three";
import { Debug } from "./debug";

export class Assets extends THREE.Object3D {

    public replaceMaterial(source: THREE.Object3D, mat: THREE.Material) {
        console.log(`${source.name} (${source.type})`);
        if (source instanceof THREE.Mesh) {
            source.material = mat;
        }
        else {
            Debug.log("could not add material.");

        }
    }
}