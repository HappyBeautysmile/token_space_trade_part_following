import * as THREE from "three";
import { AstroGen } from "./astroGen";
import { Construction, ObjectConstruction } from "./construction";
import { Place } from "./place";

export class PlanetPlatform extends THREE.Group {
  constructor(pos: THREE.Vector3, private camera: THREE.Camera) {
    super();
    const construction: Construction = new ObjectConstruction(this);
    const astroGen = new AstroGen(construction);
    astroGen.buildPlatform(10, 10, 3, 0, 0, 0);
    // We scale the planet up because otherwise it's really slow.
    this.scale.set(200, 200, 200);

    // const cube = new THREE.Mesh(
    //   new THREE.BoxBufferGeometry(1e2, 1e3, 1e2),
    //   new THREE.MeshBasicMaterial({ color: 'red' })
    // );
    // this.add(cube);
  }

}