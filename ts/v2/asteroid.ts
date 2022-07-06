import * as THREE from "three";
import { S } from "../settings";
import { Assets } from "./assets";

import { Codeable } from "./file";
import { Grid } from "./grid";
import { MeshCollection } from "./meshCollection";

export class Asteroid extends MeshCollection implements Codeable {
  constructor(assets: Assets) {
    super(assets);
  }

  private gridPosition() {
    return Math.round((Math.random() - 0.5) * 200);
  }

  fallback(p: THREE.Vector3) {
    for (let i = 0; i < S.float('ni'); ++i) {
      const pos = new THREE.Vector3(
        this.gridPosition(), this.gridPosition(), this.gridPosition());
      this.addCube('cube', pos, Grid.notRotated);
    }
    this.buildGeometry();
    return this;
  }
}