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
  topButtonCallbacks = [];
  bottomButtonLabels = [];
  private listener = new THREE.AudioListener();
  private sound: THREE.Audio;
  private audioLoader = new THREE.AudioLoader();


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

  labels() {
    this.rowText = [];
    for (let i = 0; i < 15; i++) {
      this.rowText.push("row " + String(i));
    }
    this.rowText[0] = "         1         2         3         4         5         6         7         8"
    this.rowText[1] = "12345678901234567890123456789012345678901234567890123456789012345678901234567890"

    this.topButtonLabels = ["INV", "NAV", "", "", "", "", "", ""];
    this.topButtonCallbacks = [this.showInventory, this.showNavigation]
    this.bottomButtonLabels = [];
    for (let i = 0; i < 8; i++) {
      let label = "T" + i.toFixed(0);
      //this.topButtonLabels.push(label);
      let m = this.findChildByName(label, this.model);
      ButtonDispatcher.registerButton(this, m.position,
        0.015, () => {
          this.playRandomSound("key-press", 5);
          this.topButtonCallbacks[i];
        });


      label = "B" + i.toFixed(0);
      this.bottomButtonLabels.push(label);
      m = this.findChildByName(label, this.model);
      ButtonDispatcher.registerButton(this, m.position,
        0.015, () => {
          this.playRandomSound("key-press", 5);
        });

      label = "L" + i.toFixed(0);
      m = this.findChildByName(label, this.model);
      ButtonDispatcher.registerButton(this, m.position,
        0.005, () => {
          this.playRandomSound("key-press", 5);
        });
      if (i < 7) {
        label = "R" + i.toFixed(0);
        m = this.findChildByName(label, this.model);
        ButtonDispatcher.registerButton(this, m.position,
          0.005, () => {
            this.playRandomSound("key-press", 5);
          });
      }
    }
  }

  playRandomSound(name: string, max: number) {
    const num = Math.ceil(Math.random() * max).toFixed(0);
    const soundname = `sounds/${name}${num}.ogg`;
    this.audioLoader.load(soundname, (buffer) => {
      this.sound.setBuffer(buffer);
      this.sound.setLoop(false);
      this.sound.setVolume(0.5);
      this.sound.play();
    });
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

  showNavigation() {
    for (let r = 0; r < 8; r++) {
      this.rowText[r] = "";
    }
    this.rowText[0] = "You are somewhere."

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

  }
}