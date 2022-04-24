import { Zoom } from "./zoom";
import * as THREE from "three";

{
  const l1 = new THREE.Vector3(0, 0, 0);
  const r1 = new THREE.Vector3(1, 0, 0);
  const p1 = Zoom.makePerpendicular(l1, r1);
  console.log('Expect: <0, 0, -1>, <0, 1, 0>')
  console.log(p1);
}

function logMatrix4(m: THREE.Matrix4) {
  console.log(`[ ${m.elements[0].toFixed(2)}, ${m.elements[1].toFixed(2)}, ${m.elements[2].toFixed(2)}, ${m.elements[3].toFixed(2)} ]`);
  console.log(`[ ${m.elements[4].toFixed(2)}, ${m.elements[5].toFixed(2)}, ${m.elements[6].toFixed(2)}, ${m.elements[7].toFixed(2)} ]`);
  console.log(`[ ${m.elements[8].toFixed(2)}, ${m.elements[9].toFixed(2)}, ${m.elements[10].toFixed(2)}, ${m.elements[11].toFixed(2)} ]`);
  console.log(`[ ${m.elements[12].toFixed(2)}, ${m.elements[13].toFixed(2)}, ${m.elements[14].toFixed(2)}, ${m.elements[15].toFixed(2)} ]`);
}

{
  const l1 = new THREE.Vector3(0, 5, 0);
  const r1 = new THREE.Vector3(1, 6, 0);
  const l2 = new THREE.Vector3(1, 7, 0);
  const r2 = new THREE.Vector3(2, 8, 0);

  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  console.log('Expect translate (1, 2, 0)');
  logMatrix4(transform);
}

{
  const l1 = new THREE.Vector3(0, 0, 5);
  const r1 = new THREE.Vector3(1, 0, 6);
  const l2 = new THREE.Vector3(1, 0, 7);
  const r2 = new THREE.Vector3(2, 0, 8);

  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  console.log('Expect translate (1, 0, 2)');
  logMatrix4(transform);
}


function testOne(c1: THREE.Vector3, c2: THREE.Vector3, transform: THREE.Matrix4) {
  const before = new THREE.Vector4(c1.x, c1.y, c1.z, 1);
  before.applyMatrix4(transform);
  console.log(before);
  console.log(c2)
  console.assert(Math.abs(before.x - c2.x) < 0.01);
  console.assert(Math.abs(before.y - c2.y) < 0.01);
  console.assert(Math.abs(before.z - c2.z) < 0.01);
}

function testInOut(l1: THREE.Vector3, r1: THREE.Vector3, l2: THREE.Vector3, r2: THREE.Vector3) {
  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  testOne(l1, l2, transform);
  testOne(r1, r2, transform);
}

{
  const l1 = new THREE.Vector3(1, 1, 1);
  const r1 = new THREE.Vector3(2, 2, 2);
  const l2 = new THREE.Vector3(0, 0, 0);
  const r2 = new THREE.Vector3(3, 3, 3);

  const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
  console.log('Expect zoom 3x, translate (-1, -1)');
  logMatrix4(transform);
  testInOut(l1, r1, l2, r2);
}

{
  for (let i = 0; i < 10; ++i) {
    const l1 = new THREE.Vector3(Math.random(), Math.random(), Math.random());
    const r1 = new THREE.Vector3(Math.random(), Math.random(), Math.random());
    const l2 = new THREE.Vector3(Math.random(), Math.random(), Math.random());
    const r2 = new THREE.Vector3(Math.random(), Math.random(), Math.random());

    const transform = Zoom.makeZoomMatrix(l1, r1, l2, r2);
    testInOut(l1, r1, l2, r2);
  }
}
