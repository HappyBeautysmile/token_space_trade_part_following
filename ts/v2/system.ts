import * as THREE from "three";
import { S } from "../settings";
import { Asteroid } from "./asteroid";

import { Codeable, File } from "./file";
import { PointCloud } from "./pointCloud";
import { PointCloudUnion, PointSet } from "./pointSet";

export class System extends THREE.Object3D implements Codeable, PointSet {
  private asteroids = new PointCloud();
  private planets = new PointCloud();
  // private star: THREE.Mesh;
  private activeAsteroids = new Map<THREE.Vector3, Asteroid>();

  constructor() {
    super();

    // this.star = new THREE.Mesh(
    //   new THREE.IcosahedronBufferGeometry(S.float('sr'), 4),
    //   new THREE.MeshPhongMaterial(
    //     { color: 'yellow', shininess: 1.0, emissive: 0.8 }));
    // this.add(this.star);
    this.add(this.asteroids);
    this.add(this.planets);
  }

  private tmpV = new THREE.Vector3();
  getClosestDistance(p: THREE.Vector3): number {
    let closestDistance = Infinity;
    for (const ps of [this.planets.starPositions, this.asteroids.starPositions]) {
      const distance = ps.getClosestDistance(p);
      if (distance < closestDistance) {
        closestDistance = distance;
      }
    }
    return closestDistance;
  }

  private tmpSet = new Set<THREE.Vector3>();
  public handlePops(universe: THREE.Object3D, allPoints: PointCloudUnion) {
    this.tmpV.copy(universe.position);
    this.tmpV.multiplyScalar(-1);
    this.tmpSet.clear();
    for (const asteroid of this.asteroids.starPositions.getAllWithinRadius(
      this.tmpV, 10000)) {
      this.tmpSet.add(asteroid);
    }
    if (this.tmpSet.size === 0 && this.activeAsteroids.size === 0) {
      // Nothing to do.
      return;
    }
    const toRemove: THREE.Vector3[] = [];
    for (const k of this.activeAsteroids.keys()) {
      if (!this.tmpSet.has(k)) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) {
      const oldAsteroid = this.activeAsteroids.get(k);
      universe.remove(oldAsteroid);
      // allPoints.delete(oldAsteroid);
      this.activeAsteroids.delete(k);
    }
    for (const k of this.tmpSet) {
      if (!this.activeAsteroids.has(k)) {
        console.log('Pop asteroid.');
        const asteroid = new Asteroid();
        const name = `Asteroid:${Math.round(k.x), Math.round(k.y), Math.round(k.z)}`;
        File.load(asteroid, name, k);
        asteroid.position.copy(k);
        this.activeAsteroids.set(k, asteroid);
        universe.add(asteroid);
      }
    }
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
    /*initialIntensity=*/50);

    this.planets.starPositions.clear();
    for (const p of o['planetPositions']) {
      const v = new THREE.Vector3(p.x, p.y, p.z);
      this.planets.starPositions.add(v, v);
    }
    this.planets.addStars(new THREE.Color('#0ff'), S.float('as'),
    /*initialIntensity=*/50);

    return this;
  }

  fallback(p: THREE.Vector3) {
    this.asteroids.starPositions.clear();
    this.asteroids.build(
      S.float('ar'), S.float('ar') / 10.0, S.float('ar') / 30.0,
      S.float('na'), new THREE.Color('#44f'), S.float('as'),
      /*includeOrigin=*/false, /*initialIntensity=*/50);
    this.asteroids.position.copy(p);

    this.planets.starPositions.clear();
    this.planets.build(
      S.float('ar') * 2, S.float('ar'), S.float('ar') / 50.0,
      10/*planets*/, new THREE.Color('#0ff'), S.float('as'),
        /*includeOrigin=*/false, /*initialIntensity=*/50);
    this.planets.position.copy(p);

    return this;
  }

}