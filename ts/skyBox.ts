import * as THREE from "three";

export class SkyBox extends THREE.Object3D {
  constructor() {
    super();
    const num = Math.ceil(Math.random() * 5).toFixed(0);
    const materialArray = this.createMaterialArray(num);
    // We make the skybox 10% larger than the VLU radius
    const skyboxGeo = new THREE.BoxGeometry(1.1e3, 1.1e3, 1.1e3);

    const skybox = new THREE.Mesh(skyboxGeo, materialArray);
    this.add(skybox);
  }

  private createPathStrings(filename): string[] {
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

  private createMaterialArray(filename): THREE.Material[] {
    const skyboxImagepaths = this.createPathStrings(filename);
    const color = new THREE.Color(Math.random(), Math.random(), Math.random());
    const materialArray = skyboxImagepaths.map(image => {
      let texture = new THREE.TextureLoader().load(image);
      return new THREE.MeshBasicMaterial({
        map: texture, side: THREE.BackSide, color: color,
        blending: THREE.AdditiveBlending,
        depthTest: true,
        depthWrite: false
      });
    });
    return materialArray;
  }
}