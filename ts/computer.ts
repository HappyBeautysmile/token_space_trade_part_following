import * as THREE from "three";
import { Assets, ModelLoader } from "./assets";

export class Computer {
    private canvas = document.createElement('canvas');
    texture = new THREE.CanvasTexture(this.canvas);
    material = new THREE.MeshBasicMaterial();


    private constructor(public model: THREE.Object3D) {
        this.canvas.width = 1056;
        this.canvas.height = 544;
        this.material.map = this.texture;
        this.createGreenBars();
        Assets.replaceMaterial(this.model, this.material);
    }
    public static async make() {
        const model = await ModelLoader.loadModel(`Model/flight computer.glb`);
        return new Computer(model);
    }

    createGreenBars() {
        const ctx = this.canvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = 'green';
        for (let y = 0; y < this.canvas.height; y += this.canvas.height / 8) {
            ctx.fillRect(0, y, this.canvas.width, y + this.canvas.height / 16);
        }
    }
}