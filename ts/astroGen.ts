import * as THREE from "three";
import { Matrix3, Matrix4 } from "three";
import { Assets, Item } from "./assets";
import { Construction } from "./construction";
import { Debug } from "./debug";
import { InWorldItem } from "./inWorldItem";
import { Zoom } from "./zoom";
import { FileIO } from "./fileIO";
import { Decode } from "./codec";

export class AstroGen {
  constructor(private construction: Construction) { }

  private buildCone() {
    for (let x = -20; x < 20; x++) {
      for (let y = -20; y < 20; y++) {
        for (let z = 0; z < 20; z++) {
          if (Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) < z / 2) {
            const baseItem = Assets.items[0];
            const position = new THREE.Vector3(x, y, -z * 2 - 10);
            const quaternion = new THREE.Quaternion();
            this.construction.addCube(
              new InWorldItem(baseItem, position, quaternion));
          }
        }
      }
    }
  }

  private buildDisk(r: number,
    xOffset: number, yOffset: number, zOffset: number) {
    for (let x = -r; x < r; x++) {
      for (let z = -r; z < r; z++) {
        if (Math.sqrt(Math.pow(x, 2) + Math.pow(z, 2)) < r) {
          const baseItem = Assets.items[0];
          const position = new THREE.Vector3(x + xOffset, yOffset, -z + zOffset * 2 - 10);
          const quaternion = new THREE.Quaternion();
          const inWorldItem = new InWorldItem(
            Assets.itemsByName.get('cube'),
            new THREE.Vector3(x + xOffset, yOffset, z + zOffset),
            quaternion);
          this.construction.addCube(inWorldItem);
        }
      }
    }
  }

  buildSpacePort(xOffset: number, yOffset: number, zOffset: number, height: number) {
    let r = 1;
    for (let y = 0; y < height; y++) {
      if (y % 3 == 0) {
        r = Math.pow(Math.random(), 2) * 10 + 1;
      }
      this.buildDisk(r, xOffset, y + yOffset, zOffset);
    }
  }

  private changeColor(mesh: THREE.Mesh) {
    Debug.assert(mesh.type === "Mesh");
    const material = new THREE.MeshStandardMaterial();
    Object.assign(material, mesh.material);
    let r = material.color.r;
    let g = material.color.g;
    let b = material.color.b;
    r += (Math.random() - 0.5) * .1;
    g += (Math.random() - 0.5) * .1;
    b += (Math.random() - 0.5) * .1;
    material.color = new THREE.Color(r, g, b);
    material.needsUpdate = true;
    mesh.material = material;
  }

  private itemFromLocation(x: number, y: number, z: number) {
    if (Math.random() < 0.9) {
      return Assets.itemsByName.get('cube-tweek');
    }
    else {
      return Assets.itemsByName.get('cube-rock');
    }
  }

  private addAt(x: number, y: number, z: number) {
    const rotation = new Matrix4();
    rotation.makeRotationFromEuler(new THREE.Euler(
      Math.round(Math.random() * 4) * Math.PI / 2,
      Math.round(Math.random() * 4) * Math.PI / 2,
      Math.round(Math.random() * 4) * Math.PI / 2
    ));
    const quaternion = new THREE.Quaternion();
    quaternion.setFromRotationMatrix(rotation);
    const inWorldItem = new InWorldItem(
      this.itemFromLocation(x, y, z),
      new THREE.Vector3(x, y, z),
      quaternion);
    this.construction.addCube(inWorldItem);
  }

  buildPlatform(xDim: number, yDim: number, zDim: number,
    xOffset: number, yOffset: number, zOffset: number) {
    for (let x = -xDim; x < xDim; x++) {
      for (let y = -yDim; y < 0; y++) {
        for (let z = -zDim; z < zDim; z++) {
          let xProb = (xDim - Math.abs(x)) / xDim;
          let yProb = (yDim - Math.abs(y)) / yDim;
          let zProb = (zDim - Math.abs(z)) / zDim;

          if (xProb * yProb * zProb > (Math.random() / 10) + 0.5) {
            this.addAt(x + xOffset, y + yOffset, z + zOffset);
          }
        }
      }
    }
  }

  buildAsteroid(r: number,
    xOffset: number, yOffset: number, zOffset: number) {
    for (let x = -r; x < r; x++) {
      for (let y = -r; y < r; y++) {
        for (let z = -r; z < r; z++) {
          if (Math.sqrt(x * x + y * y + z * z) < r + Math.random() - 0.5) {
            this.addAt(x + xOffset, y + yOffset, z + zOffset);
          }
        }
      }
    }
  }

  async loadJason(filename: string, xOffset: number, yOffset: number, zOffset: number) {
    Debug.log('loading test.json...')
    const loadedObject = await FileIO.httpGetAsync("./" + filename + ".json");
    const loaded = Decode.arrayOfInWorldItem(loadedObject);
    for (const inWorldItem of loaded) {
      inWorldItem.position.add(new THREE.Vector3(xOffset, yOffset, zOffset))
      this.construction.addCube(inWorldItem);
    }
  }
}