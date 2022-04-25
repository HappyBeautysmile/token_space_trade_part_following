import * as THREE from "three";
import { Debug } from "./debug";

export class Assets extends THREE.Object3D {

    public replaceMaterial(source: THREE.Object3D, mat: THREE.Material) {
        console.log(`${source.name} (${source.type})`);
        for (let i = 0; i < source.children.length; i++) {
            let mesh = source.children[i] as THREE.Mesh;
            mesh.material = mat;
        }
    }
}