import * as THREE from "three";
import { inverseLerp } from "three/src/math/MathUtils";
import { Assets, ModelLoader, Item } from "../assets";
import { Player } from "../player";
import { Ticker, Tick } from "../tick";
import { ButtonDispatcher } from "../buttonDispatcher";
import { Debug } from "../debug";

class RowText {
  private rowText: string[] = [];
  private dirty: boolean;

  constructor() { }
  clear() {
    this.dirty = true;
    for (let i = 0; i < 15; i++) {
      this.rowText[i] = "";
    }
  }

  empty() {
    this.dirty = true;
    this.rowText.length = 0;
  }

  length() {
    return this.rowText.length;
  }

  get(): string[] {
    this.dirty = false;
    return this.rowText;
  }

  set(i: number, value: string) {
    this.dirty = true;
    this.rowText[i] = value;
  }

  isDirty() {
    return this.dirty;
  }
}

export class Computer extends THREE.Object3D implements Ticker {
  private canvas = document.createElement('canvas');
  private ctx = this.canvas.getContext('2d');
  private rowText = new RowText();
  texture = new THREE.CanvasTexture(this.canvas);
  material = new THREE.MeshBasicMaterial();
  buttonCallbacks = new Map();
  topButtonLabels = [];
  bottomButtonLabels = [];
  private listener = new THREE.AudioListener();
  private sound: THREE.Audio;
  private audioLoader = new THREE.AudioLoader();
  private currentDisplay = this.showInventory;
  private currentParameters = "";
  private selectedItemIndex = 0;

  private constructor(private model: THREE.Object3D, private player: Player) {
    super();
    this.add(model);
    this.canvas.width = 1056;
    this.canvas.height = 544;
    this.material.map = this.texture;

    this.add(this.listener);
    this.sound = new THREE.Audio(this.listener);

    this.labels();
    this.updateDisplay();
    model.children.forEach(o => {
      const m = o as THREE.Mesh;
      if (m.name == "display") {
        m.material = this.material;
      }
    })
    this.showInventory();
  }

  public tick(t: Tick) {
    if (t.frameCount % 10 === 0) {
      if (this.currentDisplay) {
        this.currentDisplay();
      }
      else {
        this.show404();
      }
    }
  }

  public static async make(player: Player) {
    const model = await ModelLoader.loadModel(`Model/flight computer.glb`);
    return new Computer(model, player);
  }

  findChildByName(name: string, model: THREE.Object3D): THREE.Object3D {
    let retvalue = new THREE.Object3D();
    for (const m of model.children) {
      if (m.name == name) {
        retvalue = m;
        break;
      }
    }
    return retvalue;
  }

  clearRowText() {
    this.rowText.clear();
  }

  labels() {
    this.clearRowText();
    this.topButtonLabels = ["", "", "", "", "", "", "", ""];
    this.bottomButtonLabels = ["INV", "NAV", "", "", "", "", "", ""];
    this.buttonCallbacks.set("B0", this.showInventory);
    this.buttonCallbacks.set("B1", this.showNavigation);
    for (let i = 0; i < 8; i++) {
      let label = "T" + i.toFixed(0);
      let m = this.findChildByName(label, this.model);
      ButtonDispatcher.registerButton(m, m.position,
        0.015, () => {
          this.playRandomSound("key-press", 4);
          this.currentDisplay = this.buttonCallbacks.get(label);
        });
    }
    for (let i = 0; i < 8; i++) {
      let label = "B" + i.toFixed(0);
      let m = this.findChildByName(label, this.model);
      ButtonDispatcher.registerButton(m, m.position,
        0.015, () => {
          this.playRandomSound("key-press", 4);
          this.currentDisplay = this.buttonCallbacks.get(label);
        });
    }
    for (let i = 0; i < 15; i++) {
      let label = "R" + i.toFixed(0);
      let m = this.findChildByName(label, this.model);
      ButtonDispatcher.registerButton(this, m.position,
        0.005, () => {
          this.playRandomSound("key-press", 4);
          this.currentDisplay = this.buttonCallbacks.get(label);
        });
    }
  }

  playRandomSound(name: string, max: number) {
    const num = Math.floor(Math.random() * max + 1).toFixed(0);
    const soundname = `sounds/${name}${num}.ogg`;
    Debug.log(`playing ${soundname}`);
    this.audioLoader.load(soundname, (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setLoop(false);
      this.sound.setVolume(0.5);
      this.sound.play();
    });
  }

  public updateDisplay() {
    if (!this.rowText.isDirty()) {
      return;
    }
    // clear display and add green bars
    this.createGreenBars();
    // update rows
    const middleOfRow = this.canvas.height / 17 / 2;
    const rowText = this.rowText.get();
    for (let i = 0; i < this.rowText.length(); i++) {
      this.ctx.fillStyle = 'green';
      this.ctx.font = '24px monospace';
      this.ctx.textBaseline = 'middle'
      this.ctx.textAlign = 'left'
      this.ctx.fillText(rowText[i], 0, (i * this.canvas.height / 17) + 3 * middleOfRow);
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
    this.rowText.empty()
    let i = 0;
    for (let i = 0; i < 15; i++) {
      if (this.startRow + i >= items.length) {
        break;
      }
      else {
        let item = items[i + this.startRow];
        let qty = qtys[i + this.startRow];
        this.rowText.set(i, `${item.name} ${qty}`);
        this.buttonCallbacks.set(`R${i.toFixed(0)}`, () => {
          this.showItemDetails(item, qty);
          //Debug.log(`Item.name=${item.name}, qty=${qty}`);
        });
      }
    }
    // this.topButtonLabels[0] = "v ^";
    // this.buttonCallbacks.set("T0", () => { this.player.inventory.sortByName});
    // this.topButtonLabels[1] = "v ^";


    if (this.startRow > 0) {
      this.bottomButtonLabels[6] = "back";
      this.buttonCallbacks.set("B6", () => {
        Debug.log("Back Pressed.");
        this.startRow -= 15;
        this.currentDisplay = this.showInventory;
      });
    }
    if (this.startRow + 14 < items.length) {
      this.bottomButtonLabels[7] = "next";
      this.buttonCallbacks.set("B7", () => {
        Debug.log("Next Pressed.");
        this.startRow += 15;
        this.currentDisplay = this.showInventory;
      });
    }
    this.updateDisplay();
  }

  showNavigation() {
    this.clearRowText();
    this.rowText.set(0, "You are somewhere.");

    this.updateDisplay();
  }

  showItemDetails(item: Item, qty: number) {
    this.clearRowText();
    this.rowText.set(0, item.name);
    this.rowText.set(1, item.description);
    this.rowText.set(2, item.baseValue.toFixed(0));
    this.rowText.set(3, qty.toFixed(0));
    if (item.paintable) {
      this.rowText.set(4, "Can be painted.");
    }
    else {
      this.rowText.set(4, "not paintable.");
    }
    this.updateDisplay();
  }

  show404() {
    this.clearRowText();
    this.rowText.set(0, "Page not found (404)");
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