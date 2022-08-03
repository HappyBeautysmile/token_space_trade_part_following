import * as THREE from "three";
import { S } from "../settings";
import { Assets } from "./assets";
import { AstroGen } from "./astroGen";
import { Controls, StartStopEvent, StartStopEventHandler } from "./controls";
import { Cursor } from "./cursor";

import { Codeable } from "./file";
import { Grid } from "./grid";
import { MeshCollection } from "./meshCollection";

export class Asteroid extends MeshCollection implements Codeable {
  constructor(assets: Assets, controls: Controls,
    cursors: Map<THREE.XRHandedness, Cursor>) {
    super(assets, S.float('as') * 1.2);

    controls.setStartStopCallback((ev: StartStopEvent) => {
      if (ev.state == 'start') {
        const pos = new THREE.Vector3();
        pos.copy(ev.worldPosition);
        this.worldToLocal(pos);
        Grid.round(pos);

        const cursor = cursors.get(ev.handedness);
        if (cursor.isHolding()) {
          if (!this.cubeAt(pos)) {
            this.addCube(cursor.getHold(), pos, Grid.randomRotation());
            cursor.setHold(null);
          }
        } else {
          const removed = this.removeCube(pos);
          cursor.setHold(removed);
        }
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