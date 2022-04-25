import * as THREE from "three";
import { Debug } from "./debug";
import { Palette } from "./palette";

export class Assets extends THREE.Object3D {

    private palette = new Palette();

    // sets the color of the passed object to the next color in the palette.
    public nextColor(source: THREE.Object3D) {
        const newMat = new THREE.MeshPhongMaterial({ color: this.palette.nextColor() });
        this.replaceMaterial(source, newMat);
    }

    public replaceMaterial(source: THREE.Object3D, mat: THREE.Material) {
        console.log(`${source.name} (${source.type})`);
        for (let i = 0; i < source.children.length; i++) {
            let mesh = source.children[i] as THREE.Mesh;
            mesh.material = mat;
        }
    }
}