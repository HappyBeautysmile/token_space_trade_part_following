import * as THREE from "three";

import { Content, OctoMass } from "./octoMass";

const om = new OctoMass(new THREE.Vector3(), 1 << 12, new Content(10000));

let farthestDistance = 0;
const farthestPos = new THREE.Vector3();
for (const o of om.elementsNear(new THREE.Vector3())) {
  const distance = o.center.length();
  if (distance > farthestDistance) {
    farthestDistance = distance;
    farthestPos.copy(o.center);
  }
}

const d = new THREE.Vector3();
console.log(`Near: ${[farthestPos.x, farthestPos.y, farthestPos.z]}`)
for (const o of om.elementsNear(farthestPos)) {
  d.copy(o.center);
  d.sub(farthestPos);
  const distance = d.length();
  console.log(`R = ${o.radius}; M = ${o.content.mass}; Ratio: ${distance / o.radius}`);
}
