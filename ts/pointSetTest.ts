import * as THREE from "three";

import { PointSetLinear, PointSetOctoTree } from "./pointSet";

const psl = new PointSetLinear(1e10);

function bigRandom() {
  return (Math.random() - 0.5) * 1e10;
}

for (let i = 0; i < 1; ++i) {
  psl.add(new THREE.Vector3(bigRandom(), bigRandom(), bigRandom()));
}

const pso = new PointSetOctoTree(new THREE.Vector3(0, 0, 0), 1e10);

for (let i = 0; i < 1000; ++i) {
  pso.add(new THREE.Vector3(bigRandom(), bigRandom(), bigRandom()));
}

const startTime = process.uptime();

for (const p of psl.elements()) {
  pso.getClosest(p);
}

console.log(`Elapsed: ${process.uptime() - startTime} seconds`);