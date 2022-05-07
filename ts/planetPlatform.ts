import * as THREE from "three";
import { AstroGen } from "./astroGen";
import { Construction } from "./construction";
import { Place } from "./place";

export class PlanetPlatform extends THREE.Group {
  constructor(pos: THREE.Vector3, private camera: THREE.Camera) {
    super();

    const construction = new Construction();
    const astroGen = new AstroGen(this, construction);
    astroGen.buildPlatform(30, 30, 30, 0, 0, 0);
  }

}