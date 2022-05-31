import * as THREE from "three";
import { inverseLerp } from "three/src/math/MathUtils";
import { Assets, ModelLoader, Item } from "./assets";
import { Player } from "./player";
import { Ticker, Tick } from "./tick";
import { ButtonDispatcher } from "./buttonDispatcher";

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
    this.enableButtons();

    setInterval(() => { }, 5000);
  }

  public tick(t: Tick) {
    if (t.frameCount % 10 === 0) {
      this.showInventory();
    }
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

  private startRow = 0;
  showInventory() {
    const inv = this.player.inventory.getItemQty();
    const qtys = Array.from(inv.values());
    const items = Array.from(inv.keys())
    this.rowText = [];
    let i = 0;
    for (let i = 0; i < 15; i++) {
      if (this.startRow + i >= items.length) {
        break;
      }
      else {
        this.rowText[i] = `${items[i + this.startRow].name} ${qtys[i + this.startRow]}`;
      }
    }
    if (this.startRow > 0) {
      this.bottomButtonLabels[6] = "back";
    }
    if (this.startRow + 14 < items.length) {
      this.bottomButtonLabels[7] = "next";
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

  enableButtons() {
    ButtonDispatcher.registerButton(this, new THREE.Vector3(0, 0, 0),
      0.1, () => {
        if (this.scale.x > 2) {
          this.scale.set(1, 1, 1);
        } else {
          this.scale.set(10, 10, 10);
        }
      });
  }
}