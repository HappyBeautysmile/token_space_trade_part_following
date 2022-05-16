import * as THREE from "three";
import { Assets, ModelLoader, Item } from "./assets";
import { Player } from "./player";
import { Ticker, Tick } from "./tick";

export class Computer extends THREE.Object3D implements Ticker {
    private canvas = document.createElement('canvas');
    private ctx = this.canvas.getContext('2d');
    texture = new THREE.CanvasTexture(this.canvas);
    material = new THREE.MeshBasicMaterial();
    rowText = [];
    topButtonLabels = [];
    bottomButtonLabels = [];


    private constructor(model: THREE.Object3D, private player: Player) {
        super();
        this.add(model);
        this.canvas.width = 1056;
        this.canvas.height = 544;
        this.material.map = this.texture;
        this.labels();
        this.updateDisplay();
        model.children.forEach(o => {
            const m = o as THREE.Mesh;
            if (m.name == "display") {
                m.material = this.material;
            }
        })
        this.showInventory();
        setInterval(() => { }, 5000);
    }

    public tick(t: Tick) {
        // TODO every 10 frames
        this.showInventory();
    }

    public static async make(player: Player) {
        const model = await ModelLoader.loadModel(`Model/flight computer.glb`);
        return new Computer(model, player);
    }

    labels() {
        this.rowText = [];
        for (let i = 0; i < 15; i++) {
            this.rowText.push("row " + String(i));
        }
        this.rowText[0] = "         1         2         3         4         5         6         7         8"
        this.rowText[1] = "12345678901234567890123456789012345678901234567890123456789012345678901234567890"

        this.topButtonLabels = [];
        this.bottomButtonLabels = [];
        for (let i = 0; i < 8; i++) {
            this.topButtonLabels.push("T" + String(i));
            this.bottomButtonLabels.push("B" + String(i));
        }
    }

    public updateDisplay() {
        // clear display and add green bars
        this.createGreenBars();
        // update rows
        const middleOfRow = this.canvas.height / 17 / 2;
        for (let i = 0; i < this.rowText.length; i++) {
            this.ctx.fillStyle = 'green';
            this.ctx.font = '24px monospace';
            this.ctx.textBaseline = 'middle'
            this.ctx.textAlign = 'left'
            this.ctx.fillText(this.rowText[i], 0, (i * this.canvas.height / 17) + 3 * middleOfRow);
        }
        //update buttons
        const gridUnit = (this.canvas.width / 33)
        const middleOfColumn = gridUnit * 2.5;
        const columnSpacing = gridUnit * 4;
        for (let i = 0; i < 8; i++) {
            this.ctx.fillStyle = 'green';
            this.ctx.font = '24px monospace';
            this.ctx.textBaseline = 'middle'
            this.ctx.textAlign = 'center'
            this.ctx.fillText(this.topButtonLabels[i], columnSpacing * i + middleOfColumn, middleOfRow);
            this.ctx.fillText(this.bottomButtonLabels[i], columnSpacing * i + middleOfColumn, this.canvas.height - middleOfRow);
        }
        this.texture.needsUpdate = true;
    }

    showInventory() {
        const inv = this.player.inventory.getItemQty();
        this.rowText = [];
        let i = 0;
        for (const [item, qty] of inv.entries()) {
            this.rowText[i] = item.name + ' ' + qty.toFixed(0);
            i++;
            if (i > 15) {
                break;
            }
        }
        this.updateDisplay();
    }

    createGreenBars() {
        this.ctx.fillStyle = '#003300';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'black';
        for (let y = 0; y < this.canvas.height; y += this.canvas.height / 8.5) {
            this.ctx.fillRect(0, y, this.canvas.width, this.canvas.height / 17);
        }
    }
}