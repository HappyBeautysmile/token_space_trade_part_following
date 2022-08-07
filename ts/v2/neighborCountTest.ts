import * as THREE from "three";

import { Grid } from "./grid";
import { IsoTransform } from "./isoTransform";
import { NeighborCount } from "./neighborCount";

const nc = new NeighborCount();

for (let i = -10; i <= 10; ++i) {
  for (let j = -10; j <= 10; ++j) {
    for (let k = -10; k <= 10; ++k) {
      const tx = new IsoTransform(
        new THREE.Vector3(i, j, k), Grid.notRotated);
      nc.set(tx, `${[i, j, k]}`);
    }
  }
}

let total = 0;
for (const e of nc.allElements()) {
  ++total;
}
console.log(`Total: ${total} == ${21 * 21 * 21}`);

let surface = 0;
for (const e of nc.externalElements()) {
  ++surface;
}
console.log(`Surface: ${surface} == ${8 + 21 * 19 * 6}`);

