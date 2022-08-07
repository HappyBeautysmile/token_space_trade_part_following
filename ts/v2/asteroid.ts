import * as THREE from "three";
import { S } from "../settings";
import { Assets } from "./assets";
import { AstroGen } from "./astroGen";
import { Compounds } from "./compounds";
import { Controls, StartStopEvent, StartStopEventHandler } from "./controls";
import { Cursor } from "./cursor";

import { Codeable } from "./file";
import { Grid } from "./grid";
import { IsoTransform } from "./isoTransform";
import { MeshCollection } from "./meshCollection";

export class Asteroid extends MeshCollection implements Codeable {
  constructor(assets: Assets, controls: Controls,
    cursors: Map<THREE.XRHandedness, Cursor>) {
    super(assets, S.float('as') * 1.2);

    controls.setStartStopCallback((ev: StartStopEvent) => {
      if (ev.state == 'start') {
        const pos = new IsoTransform();
        pos.copy(ev.worldPosition);
        this.worldToLocal(pos.position);
        Grid.round(pos.position);

        const cursor = cursors.get(ev.handedness);
        if (cursor.isHolding()) {
          this.handleDrop(pos, cursor);
        } else {
          const removed = this.removeCube(pos.position);
          cursor.setHold(removed);
        }
      }
    });
  }

  private compounds = new Compounds();

  private handleDrop(pos: IsoTransform, cursor: Cursor) {
    if (!this.cubeAt(pos.position)) {
      this.addCube(cursor.getHold(), pos);
      cursor.setHold(null);
    } else {
      const existingCube = this.get(pos.position);
      const combo = this.compounds.combine(existingCube, cursor.getHold());
      if (!!combo) {
        this.removeCube(pos.position);
        this.addCube(combo, pos);
        cursor.setHold(null);
      }
    }
  }

  fallback(p: THREE.Vector3) {
    const gen = new AstroGen(this);
    gen.buildAsteroid(S.float('as'), 0, 0, 0);
    this.buildGeometry();
    return this;
  }
}