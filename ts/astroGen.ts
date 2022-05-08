import * as THREE from "three";
import { Assets } from "./assets";
import { Construction } from "./construction";

export class AstroGen {
  constructor(private universeGroup: THREE.Object3D, private construction: Construction) {
  }

  private buildCone() {
    for (let x = -20; x < 20; x++) {
      for (let y = -20; y < 20; y++) {
        for (let z = 0; z < 20; z++) {
          if (Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) < z / 2) {
            let o = new THREE.Object3D();
            o = Assets.blocks[0].clone();
            o.translateX(x);
            o.translateY(y);
            o.translateZ(-z * 2 - 10);
            this.construction.addCube(o);
          }
        }
      }
    }
  }

  private changeColor(mesh: THREE.Mesh) {
    console.assert(mesh.type === "Mesh");
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

  private addAt(x: number, y: number, z: number) {
    let o: THREE.Mesh;
    if (Math.random() < 0.9) {
      o = Assets.models.get('cube-tweek').clone();
    } else {
      o = Assets.models.get('cube-glob').clone();
    }
    this.changeColor(o);
    o.position.set(x, y, z);
    o.rotateX(Math.round(Math.random() * 4) * Math.PI / 2);
    o.rotateY(Math.round(Math.random() * 4) * Math.PI / 2);
    o.rotateZ(Math.round(Math.random() * 4) * Math.PI / 2);
    this.construction.addCube(o);
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
}