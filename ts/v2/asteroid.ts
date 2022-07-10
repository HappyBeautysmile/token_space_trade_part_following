import * as THREE from "three";
import { S } from "../settings";
import { Assets } from "./assets";
import { AstroGen } from "./astroGen";

import { Codeable } from "./file";
import { MeshCollection } from "./meshCollection";

export class Asteroid extends MeshCollection implements Codeable {
  constructor(assets: Assets) {
    super(assets);
  }
  fallback(p: THREE.Vector3) {
    const gen = new AstroGen(this);
    gen.buildAsteroid(S.float('as'), 0, 0, 0);
    this.buildGeometry();
    return this;
  }
}