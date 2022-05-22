import * as THREE from "three";
import { Matrix3, Matrix4 } from "three";
import { Assets, Item } from "./assets";
import { Construction } from "./construction";
import { Debug } from "./debug";
import { InWorldItem } from "./inWorldItem";
import { Zoom } from "./zoom";
import { FileIO } from "./fileIO";
import { Decode } from "./codec";

class rarity {
  // pattern repeats every n meters
  // phase from 0 to 2 Pi
  // 1-100 where 1 is scarce and 100 is common.
  // offset is added to the sine before magnitude is appled.  1 = 0 to 2x magnitude.  more means there is always a chance.  less means sometimes there is no chance of occurance.
  public constructor(public modelName, public period, public phase, public magnitude, public offset) {

  }

  private trans(n: number) {
    let retvalue = this.magnitude * (Math.sin(2 * Math.PI * (1 / this.period) * n + this.phase) + this.offset);
    return retvalue;
  }

  concentration(x: number, y: number, z: number) {
    return Math.cbrt(this.trans(x) * this.trans(y) * this.trans(z));
  }
}

// 'clay', 'ice', 
// 'metal-common', 'metal-rare','salt-common', 'salt-rare', 'silicate-rock',
// 'silicon-crystalized', ]

export class AstroGen {
  rarities: rarity[] = [];
  constructor(private construction: Construction) {
    this.rarities.push(new rarity("clay", 100, Math.PI / 2, 100, 1.1));
    this.rarities.push(new rarity("ice", 100, -Math.PI / 2, 100, 0.9));
    this.rarities.push(new rarity("metal-common", 500, 0, 10, 0.8));
    this.rarities.push(new rarity("metal-rare", 5000, Math.PI / 2, 1, 0));
    this.rarities.push(new rarity("salt-common", 50, 0, 50, 0.5));
    this.rarities.push(new rarity("salt-rare", 50, 0, 50, -0.5));
    this.rarities.push(new rarity("silicate-rock", 100, -Math.PI / 2, 100, 0.5));
    this.rarities.push(new rarity("silicon-crystalized", 1, -Math.PI, 1, -0.5));
  }

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
    let hat = [];  // the hat we will draw a random name from
    for (let r of this.rarities) {
      const chance = r.concentration(x, y, z);
      for (let i = 0; i < chance; i++) {
        hat.push(r.modelName);
      }
    }
    let index = Math.floor(Math.random() * hat.length);
    return Assets.itemsByName.get(hat[index]);
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

  buildOriginMarker(size: number) {
    for (let x = 0; x < size; x++) {
      for (let z = 0; z < size; z++) {
        const quaternion = new THREE.Quaternion();
        const inWorldItem = new InWorldItem(
          Assets.itemsByName.get('cube'),
          new THREE.Vector3(x, 0, z),
          quaternion);
        this.construction.addCube(inWorldItem);
      }
    }
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

  buildDiamond(r: number,
    xOffset: number, yOffset: number, zOffset: number) {
    for (let x = -r; x < r; x++) {
      for (let y = -r; y < r; y++) {
        for (let z = -r; z < r; z++) {
          if ((Math.abs(x) + Math.abs(y) + Math.abs(z)) < r + Math.random() - 0.5) {
            this.addAt(x + xOffset, y + yOffset, z + zOffset);
          }
        }
      }
    }
  }

  buildCuboid(r: number,
    xOffset: number, yOffset: number, zOffset: number) {
    for (let x = -r; x < r; x++) {
      for (let y = -r; y < r; y++) {
        for (let z = -r; z < r; z++) {
          if (Math.min(Math.abs(x), Math.abs(y), Math.abs(z)) < r + Math.random() - 0.5) {
            this.addAt(x + xOffset, y + yOffset, z + zOffset);
          }
        }
      }
    }
  }

  getRandomInt(min, max) {
    return Math.floor(Math.pow(Math.random(), 2) * (max - min)) + min;
  }

  buildRandomItems(n: number, r: number) {
    const item = Assets.items[this.getRandomInt(0, Assets.items.length)];
    Debug.log(`Congrationations!  You have been awarded ${n.toFixed(0)} ${item.name}(s) for loging in today.`);
    Debug.log(`Hunt for them ${r.toFixed(0)} meters from your current location.  Enjoy!`);
    const maxTries = n * 10;
    for (let i = 0; i < maxTries; i++) {
      if (n < 1) {
        break;
      }
      const x = this.getRandomInt(-r, r);
      const y = this.getRandomInt(-r, r);
      const z = this.getRandomInt(-r, r);
      const pos = new THREE.Vector3(x, y, z)
      const inWorldItem = new InWorldItem(
        item,
        pos,
        new THREE.Quaternion());
      if (!this.construction.cubeAt(pos)) {
        this.construction.addCube(inWorldItem);
        n--;
      }
    }
  }

  removeFar(dirty: InWorldItem[], r: number) {
    let clean = [];
    for (const item of dirty) {
      if (Math.abs(item.position.x) + Math.abs(item.position.y) + Math.abs(item.position.z) < r) {
        clean.push(item);
      }
    }
    return clean;
  }

  layer(input: InWorldItem[], layerNumber): InWorldItem[] {
    let output = [];
    for (let block of input) {
      let b = block.clone();
      if (b.position.y == layerNumber) {
        b.position.y = 0;
        output.push(b);
      }
    }
    return output;
  }

  mashUp(input: InWorldItem[]) {
    let mashed = [];
    let minY = input[0].position.y;
    let maxY = input[0].position.y;
    for (let block of input) {
      minY = Math.min(minY, block.position.y);
      maxY = Math.max(maxY, block.position.y);
    }
    let mashY = minY;
    for (let y = minY; y <= maxY;) {
      if (Math.random() < 0.2) {
        y++;
      }
      if (Math.random() < 0.2) {
        y++;
      }
      let slice = this.layer(input, y);
      for (let block of slice) {
        let b = new InWorldItem(block.item, block.position, block.quaternion);
        b.position.y = mashY;
        b.position.x = b.position.x + 10;
        mashed.push(b);
      }
      Debug.log(`mashY = ${mashY.toFixed(0)}`);
      mashY++;
    }
    return mashed
  }

  async loadJson(filename: string, xOffset: number, yOffset: number, zOffset: number) {
    Debug.log(`loading ${filename}.json...`);
    const loadedObject = await FileIO.httpGetAsync("./" + filename + ".json");
    const loaded = Decode.arrayOfInWorldItem(loadedObject);
    let cleaned = this.removeFar(loaded, 20)
    let mashed = this.mashUp(cleaned);
    for (const inWorldItem of mashed) {
      inWorldItem.position.add(new THREE.Vector3(xOffset, yOffset, zOffset))
      this.construction.addCube(inWorldItem);
    }
  }
}