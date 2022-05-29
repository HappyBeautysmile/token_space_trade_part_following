import * as THREE from "three";

export class SkyBox extends THREE.Object3D {
    constructor() {
        super();
        const num = Math.ceil(Math.random() * 5).toFixed(0);
        const materialArray = this.createMaterialArray(num);
        const skyboxGeo = new THREE.BoxGeometry(1000, 1000, 1000);

        const skybox = new THREE.Mesh(skyboxGeo, materialArray);
        this.add(skybox);
    }

    createPathStrings(filename): string[] {
        const basePath = "skyboxes/";
        const baseFilename = basePath + filename;
        const fileType = ".png";
        // for sky boxes from https://tools.wwwtyro.net/space-3d
        const sides = ["right", "left", "top", "bottom", "front", "back"];
        const pathStings = sides.map(side => {
            return baseFilename + "-" + side + fileType;
        });
        return pathStings;
    }

    createMaterialArray(filename): THREE.Material[] {
        const skyboxImagepaths = this.createPathStrings(filename);
        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        const materialArray = skyboxImagepaths.map(image => {
            let texture = new THREE.TextureLoader().load(image);
            return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, color: color });
        });
        return materialArray;
    }
}