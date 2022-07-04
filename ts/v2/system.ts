import * as THREE from "three";
import { S } from "../settings";

import { Codeable } from "./file";
import { PointCloud } from "./pointCloud";
import { PointSet } from "./pointSet";

export class System extends THREE.Object3D implements Codeable, PointSet {
  private asteroids = new PointCloud();
  private planets = new PointCloud();
  private star: THREE.Mesh;
  constructor() {
    super();

    this.star = new THREE.Mesh(
      new THREE.IcosahedronBufferGeometry(S.float('sr'), 4),
      new THREE.MeshPhongMaterial(
        { color: 'yellow', shininess: 1.0, emissive: 0.8 }));
    this.add(this.star);
    this.add(this.asteroids);
    this.add(this.planets);
  }

  private tmpV = new THREE.Vector3();
  getClosestDistance(p: THREE.Vector3): number {
    let closestDistance = Infinity;
    let closestPoint: THREE.Vector3 = undefined;
    for (const ps of [this.planets.starPositions, this.asteroids.starPositions]) {
      const distance = ps.getClosestDistance(p);
      if (distance < closestDistance) {
        closestDistance = distance;
      }
    }
    return closestDistance;
  }

  serialize(): Object {
    const o = {};
    const asteroidPositions = [];
    for (const p of this.asteroids.starPositions.elements()) {
      asteroidPositions.push({ x: p.x, y: p.y, z: p.z });
    }
    o['asteroidPositions'] = asteroidPositions;

    const planetPositions = [];
    for (const p of this.planets.starPositions.elements()) {
      planetPositions.push({ x: p.x, y: p.y, z: p.z });
    }
    o['planetPositions'] = planetPositions;
    return o;
  }

  deserialize(o: Object): this {
    this.asteroids.starPositions.clear();
    for (const p of o['asteroidPositions']) {
      const v = new THREE.Vector3(p.x, p.y, p.z);
      this.asteroids.starPositions.add(v, v);
    }
    this.asteroids.addStars(new THREE.Color('#44f'), S.float('as'),
    /*initialIntensity=*/5);

    this.planets.starPositions.clear();
    for (const p of o['planetPositions']) {
      const v = new THREE.Vector3(p.x, p.y, p.z);
      this.planets.starPositions.add(v, v);
    }
    this.planets.addStars(new THREE.Color('#0ff'), S.float('as'),
    /*initialIntensity=*/5);

    return this;
  }

  fallback(p: THREE.Vector3) {
    this.asteroids.starPositions.clear();
    this.asteroids.build(
      S.float('ar'), S.float('ar') / 10.0, S.float('ar') / 30.0,
      S.float('na'), new THREE.Color('#44f'), S.float('as'),
      /*includeOrigin=*/false, /*initialIntensity=*/50);

    this.planets.starPositions.clear();
    this.planets.build(
      S.float('ar') * 2, S.float('ar'), S.float('ar') / 50.0,
      10/*planets*/, new THREE.Color('#0ff'), S.float('as'),
        /*includeOrigin=*/false, /*initialIntensity=*/50);

    return this;
  }

}