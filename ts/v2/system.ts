import * as THREE from "three";
import { S } from "../settings";
import { Assets } from "./assets";
import { Asteroid } from "./asteroid";
import { Controls } from "./controls";

import { Codeable, File } from "./file";
import { Grid } from "./grid";
import { PointCloud } from "./pointCloud";
import { PointCloudUnion, PointSet } from "./pointSet";
import { Star } from "./star";

export class System extends THREE.Object3D implements Codeable, PointSet {
  private asteroids = new PointCloud(false);
  private planets = new PointCloud(false);
  private star: THREE.Object3D;
  private activeAsteroids = new Map<THREE.Vector3, Asteroid>();

  constructor(private assets: Assets, private controls: Controls) {
    super();
    this.star = new Star();
    this.add(this.star);
    this.add(this.asteroids);
    this.add(this.planets);
  }

  private tmpV = new THREE.Vector3();
  getClosestDistance(p: THREE.Vector3): number {
    this.tmpV.copy(p);
    this.tmpV.sub(this.position);
    let closestDistance = Infinity;
    for (const ps of [this.planets.starPositions, this.asteroids.starPositions]) {
      const distance = ps.getClosestDistance(this.tmpV);
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
    this.tmpV.sub(this.position);
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
      this.remove(oldAsteroid);
      // allPoints.delete(oldAsteroid);
      this.activeAsteroids.delete(k);
      this.asteroids.setStarAlpha(k, 1.0);
      allPoints.delete(oldAsteroid);
    }
    for (const k of this.tmpSet) {
      if (!this.activeAsteroids.has(k)) {
        console.log(`Asteroid ${k.x}; Universe: ${universe.position.x}; v: ${this.tmpV.x}`);
        console.log('Pop asteroid.');
        const asteroid = new Asteroid(this.assets, this.controls);
        const name = `Asteroid:${Math.round(k.x)},${Math.round(k.y)},${Math.round(k.z)}`;
        File.load(asteroid, name, k);
        this.activeAsteroids.set(k, asteroid);
        asteroid.position.copy(k);
        this.add(asteroid);
        this.asteroids.setStarAlpha(k, 0.1);
        allPoints.add(asteroid);
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
    /*initialIntensity=*/500);

    this.planets.starPositions.clear();
    for (const p of o['planetPositions']) {
      const v = new THREE.Vector3(p.x, p.y, p.z);
      this.planets.starPositions.add(v, v);
    }
    this.planets.addStars(new THREE.Color('#0ff'), S.float('as'),
    /*initialIntensity=*/500);

    return this;
  }

  fallback(p: THREE.Vector3): this {
    this.asteroids.starPositions.clear();
    this.asteroids.build(Grid.zero,
      S.float('ar'), S.float('ar') / 10.0, S.float('ar') / 30.0,
      S.float('na'), new THREE.Color('#44f'), S.float('as'),
      /*includeOrigin=*/false, /*initialIntensity=*/500);

    this.planets.starPositions.clear();
    this.planets.build(Grid.zero,
      S.float('ar') * 2, S.float('ar'), S.float('ar') / 50.0,
      10/*planets*/, new THREE.Color('#0ff'), S.float('as'),
        /*includeOrigin=*/false, /*initialIntensity=*/500);

    return this;
  }

}