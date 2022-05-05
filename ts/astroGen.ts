import * as THREE from "three";
import { Assets } from "./assets";
import { Construction } from "./construction";
import { Place } from "./place";

export class AstroGen {
    place: Place
    construction: Construction;

    constructor(place: Place, construction: Construction) {
        this.place = place;
        this.construction = construction;
    }

    buildCone() {

        for (let x = -20; x < 20; x++) {
            for (let y = -20; y < 20; y++) {
                for (let z = 0; z < 20; z++) {
                    if (Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)) < z / 2) {
                        let o = new THREE.Object3D();
                        o = Assets.blocks[0].clone();
                        o.translateX(x);
                        o.translateY(y);
                        o.translateZ(-z * 2 - 10);
                        this.place.universeGroup.add(o);
                        this.construction.addCube(o);
                    }
                }
            }
        }
    }

    private addAt(x, y, z) {
        let o = new THREE.Object3D();
        if (Math.random() < 0.9) {
            o = Assets.models['cube-tweek'].clone();
        }
        else {
            o = Assets.models['cube-glob'].clone();
        }
        // // TODO: color change not working.  It seems that clone isn't deep.
        // let mesh = o.children[0].clone() as THREE.Mesh;
        // let material = mesh.material as THREE.MeshStandardMaterial;
        // let rgb = { r: 0, g: 0, b: 0 }
        // if (material) {
        //     if (material.color) {
        //         material.color.getRGB(rgb);
        //         rgb.r = rgb.r + (Math.random() - 0.5) * .1;
        //         rgb.g = rgb.g + (Math.random() - 0.5) * .1;
        //         rgb.b = rgb.b + (Math.random() - 0.5) * .1;

        //         let newMaterial = material.clone();
        //         newMaterial.color.setRGB(rgb.r, rgb.g, rgb.b);
        //         mesh.material = newMaterial;
        //     }
        // }
        // o.children[0] = mesh;
        o.translateX(x);
        o.translateY(y);
        o.translateZ(z);
        o.rotateX(Math.round(Math.random() * 4) * Math.PI / 2);
        o.rotateY(Math.round(Math.random() * 4) * Math.PI / 2);
        o.rotateZ(Math.round(Math.random() * 4) * Math.PI / 2);
        this.place.universeGroup.add(o);
        this.construction.addCube(o);
    }

    buildPlatform(xDim: number, yDim: number, zDim: number, xOffset: number, yOffset: number, zOffset: number) {
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

    buildAsteroid(r: number = 20, xOffset: number, yOffset: number, zOffset: number) {
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