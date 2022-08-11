import * as THREE from "three";

import { Content, OctoMass } from "./octoMass";

const om = new OctoMass(new THREE.Vector3(), 1 << 20, new Content(100));

for (const o of om.elementsNear(new THREE.Vector3())) {
  console.log(`Radius: ${o.radius}, ${o.content.mass}`);
}