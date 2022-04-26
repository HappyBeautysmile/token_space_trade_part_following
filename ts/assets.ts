import * as THREE from "three";
import { Debug } from "./debug";
import { Palette } from "./palette";

export class Assets extends THREE.Object3D {

    static init() {
        Palette.init();
    }

    // sets the color of the passed object to the next color in the palette.
    static nextColor(source: THREE.Object3D) {
        const newMat = new THREE.MeshPhongMaterial({ color: Palette.nextColor() });
        this.replaceMaterial(source, newMat);
    }

    static replaceMaterial(source: THREE.Object3D, mat: THREE.Material) {
        console.log(`${source.name} (${source.type})`);
        for (let i = 0; i < source.children.length; i++) {
            let mesh = source.children[i] as THREE.Mesh;
            mesh.material = mat;
        }
    }
}