import * as THREE from "three";
import { S } from "../settings";
import { Assets } from "./assets";
import { AstroGen } from "./astroGen";
import { Controls, StartStopEvent, StartStopEventHandler } from "./controls";

import { Codeable } from "./file";
import { Grid } from "./grid";
import { MeshCollection } from "./meshCollection";

export class Asteroid extends MeshCollection implements Codeable {
  constructor(assets: Assets, private controls: Controls) {
    super(assets, S.float('as') * 1.2);

    controls.setStartStopCallback((ev: StartStopEvent) => {
      if (ev.state == 'start') {
        const pos = new THREE.Vector3();
        pos.copy(ev.worldPosition);

        this.worldToLocal(pos);
        Grid.round(pos);
        console.log(`Cube?: ${this.removeCube(pos)}`);
        const mesh = new THREE.Mesh(
          new THREE.IcosahedronBufferGeometry(0.4, 2),
          new THREE.MeshPhongMaterial({ color: '#ff0', shininess: 1.0 })
        );
        mesh.position.copy(pos);
        this.add(mesh);
      }
    });

  }
  fallback(p: THREE.Vector3) {
    const gen = new AstroGen(this);
    gen.buildAsteroid(S.float('as'), 0, 0, 0);
    this.buildGeometry();
    return this;
  }
}