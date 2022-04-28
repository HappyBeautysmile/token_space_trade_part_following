import * as THREE from "three";

import { AABB, PointSetLinear, PointSetOctoTree } from "./pointSet";


const aabb = new AABB(new THREE.Vector3(0.5, 0.5, 0.5), 0.5);
for (let i = 0; i < 100; ++i) {
  console.assert(aabb.contains(new THREE.Vector3(
    Math.random(), Math.random(), Math.random())));
}

for (let i = 0; i < 100; ++i) {
  console.assert(!aabb.contains(new THREE.Vector3(
    Math.random() + 1, Math.random(), Math.random())));
  console.assert(!aabb.contains(new THREE.Vector3(
    Math.random() - 1, Math.random() + 1, Math.random())));
  console.assert(!aabb.contains(new THREE.Vector3(
    Math.random(), Math.random(), Math.random() - 1)));
}

const children = aabb.split();
console.assert(children.length === 8,
  `Wrong children: ${JSON.stringify(children)}`)

for (let i = 0; i < 1000; ++i) {
  let numMatching = 0;
  const p = new THREE.Vector3(
    Math.random(), Math.random(), Math.random());
  for (const c of children) {
    if (c.contains(p)) {
      ++numMatching;
    }
  }
  console.assert(numMatching === 1,
    `Match count: ${numMatching}; p = ${JSON.stringify(p)}`);
}

{
  const pso = new PointSetOctoTree(new THREE.Vector3(0, 0, 0), 1.0);
  pso.add(new THREE.Vector3(0.1, 0.1, 0.1));
  pso.add(new THREE.Vector3(-0.5, 0.5, -0.5));
  pso.add(new THREE.Vector3(1, 1, 1));
  let n = 0;
  for (const pp of pso.getAllWithinRadius(new THREE.Vector3(), 1.0)) {
    ++n;
  }
  console.assert(n === 2, `n=${n}`);
}



const psl = new PointSetLinear();

function bigRandom() {
  return (Math.random() - 0.5) * 1e10;
}

const pslSize = 100;
for (let i = 0; i < pslSize; ++i) {
  psl.add(new THREE.Vector3(bigRandom(), bigRandom(), bigRandom()));
}
{
  const pso = new PointSetOctoTree(new THREE.Vector3(0, 0, 0), 1e10);

  for (let i = 0; i < 100000; ++i) {
    pso.add(new THREE.Vector3(bigRandom(), bigRandom(), bigRandom()));
  }

  let n = 0;
  const startTime = process.uptime();
  for (const p of psl.elements()) {
    for (const pp of pso.getAllWithinRadius(p, 1e9)) {
      ++n;
    }
  }
  const elapsedS = process.uptime() - startTime;
  console.log(`Elapsed: ${elapsedS} seconds`);
  console.log(`FPS: ${pslSize / elapsedS} fps`);
  console.log(`Total found: ${n}`);
}
{
  const pso = new PointSetLinear();
  for (let i = 0; i < 100000; ++i) {
    pso.add(new THREE.Vector3(bigRandom(), bigRandom(), bigRandom()));
  }

  let n = 0;
  const startTime = process.uptime();
  for (const p of psl.elements()) {
    for (const pp of pso.getAllWithinRadius(p, 1e9)) {
      ++n;
    }
  }
  const elapsedS = process.uptime() - startTime;
  console.log(`Elapsed: ${elapsedS} seconds`);
  console.log(`FPS: ${pslSize / elapsedS} fps`);
  console.log(`Total found: ${n}`);
}
