import * as THREE from "three";
import { AstroGen } from "./astroGen";
import { Construction, ObjectConstruction } from "./construction";
import { Place } from "./place";

export class PlanetPlatform extends THREE.Group {
  constructor(pos: THREE.Vector3, private camera: THREE.Camera) {
    super();

    // TODO: we scale the planet by a huge amount because
    // rendering this many cubes is too slow.  Once we have high
    // performance rendering, we can remove this scaling.
    const deleteMeScale = new THREE.Group();
    const construction: Construction = new ObjectConstruction(this);
    const astroGen = new AstroGen(deleteMeScale, construction);
    astroGen.buildPlatform(10, 10, 3, 0, 0, 0);
    deleteMeScale.scale.set(200, 200, 200);
    this.add(deleteMeScale);

    // const cube = new THREE.Mesh(
    //   new THREE.BoxBufferGeometry(1e2, 1e3, 1e2),
    //   new THREE.MeshBasicMaterial({ color: 'red' })
    // );
    // this.add(cube);
  }

}