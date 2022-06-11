"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Computer = void 0;
const THREE = __importStar(require("three"));
const assets_1 = require("../assets");
const buttonDispatcher_1 = require("../buttonDispatcher");
const debug_1 = require("../debug");
class RowText {
    rowText = [];
    dirty;
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
    get() {
        this.dirty = false;
        return this.rowText;
    }
    set(i, value) {
        this.dirty = true;
        this.rowText[i] = value;
    }
    isDirty() {
        return this.dirty;
    }
}
class Computer extends THREE.Object3D {
    model;
    player;
    canvas = document.createElement('canvas');
    ctx = this.canvas.getContext('2d');
    rowText = new RowText();
    texture = new THREE.CanvasTexture(this.canvas);
    material = new THREE.MeshBasicMaterial();
    buttonCallbacks = new Map();
    topButtonLabels = [];
    bottomButtonLabels = [];
    listener = new THREE.AudioListener();
    sound;
    audioLoader = new THREE.AudioLoader();
    currentDisplay = this.showInventory;
    currentParameters = "";
    selectedItemIndex = 0;
    constructor(model, player) {
        super();
        this.model = model;
        this.player = player;
        this.add(model);
        this.canvas.width = 1056;
        this.canvas.height = 544;
        this.material.map = this.texture;
        this.add(this.listener);
        this.sound = new THREE.Audio(this.listener);
        this.labels();
        this.updateDisplay();
        model.children.forEach(o => {
            const m = o;
            if (m.name == "display") {
                m.material = this.material;
            }
        });
        this.showInventory();
    }
    tick(t) {
        if (t.frameCount % 10 === 0) {
            if (this.currentDisplay) {
                this.currentDisplay();
            }
            else {
                this.show404();
            }
        }
    }
    static async make(player) {
        const model = await assets_1.ModelLoader.loadModel(`Model/flight computer.glb`);
        return new Computer(model, player);
    }
    findChildByName(name, model) {
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
            buttonDispatcher_1.ButtonDispatcher.registerButton(m, m.position, 0.015, () => {
                this.playRandomSound("key-press", 4);
                this.currentDisplay = this.buttonCallbacks.get(label);
            });
        }
        for (let i = 0; i < 8; i++) {
            let label = "B" + i.toFixed(0);
            let m = this.findChildByName(label, this.model);
            buttonDispatcher_1.ButtonDispatcher.registerButton(m, m.position, 0.015, () => {
                this.playRandomSound("key-press", 4);
                this.currentDisplay = this.buttonCallbacks.get(label);
            });
        }
        for (let i = 0; i < 15; i++) {
            let label = "R" + i.toFixed(0);
            let m = this.findChildByName(label, this.model);
            buttonDispatcher_1.ButtonDispatcher.registerButton(this, m.position, 0.005, () => {
                this.playRandomSound("key-press", 4);
                this.currentDisplay = this.buttonCallbacks.get(label);
            });
        }
    }
    playRandomSound(name, max) {
        const num = Math.floor(Math.random() * max + 1).toFixed(0);
        const soundname = `sounds/${name}${num}.ogg`;
        debug_1.Debug.log(`playing ${soundname}`);
        this.audioLoader.load(soundname, (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setLoop(false);
            this.sound.setVolume(0.5);
            this.sound.play();
        });
    }
    updateDisplay() {
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
            this.ctx.textBaseline = 'middle';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(rowText[i], 0, (i * this.canvas.height / 17) + 3 * middleOfRow);
        }
        //update buttons
        const gridUnit = (this.canvas.width / 33);
        const middleOfColumn = gridUnit * 2.5;
        const columnSpacing = gridUnit * 4;
        for (let i = 0; i < 8; i++) {
            this.ctx.fillStyle = 'green';
            this.ctx.font = '24px monospace';
            this.ctx.textBaseline = 'middle';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.topButtonLabels[i], columnSpacing * i + middleOfColumn, middleOfRow);
            this.ctx.fillText(this.bottomButtonLabels[i], columnSpacing * i + middleOfColumn, this.canvas.height - middleOfRow);
        }
        this.texture.needsUpdate = true;
    }
    startRow = 0;
    showInventory() {
        const inv = this.player.inventory.getItemQty();
        const qtys = Array.from(inv.values());
        const items = Array.from(inv.keys());
        this.rowText.empty();
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
                debug_1.Debug.log("Back Pressed.");
                this.startRow -= 15;
                this.currentDisplay = this.showInventory;
            });
        }
        if (this.startRow + 14 < items.length) {
            this.bottomButtonLabels[7] = "next";
            this.buttonCallbacks.set("B7", () => {
                debug_1.Debug.log("Next Pressed.");
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
    showItemDetails(item, qty) {
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
exports.Computer = Computer;
//# sourceMappingURL=computer.js.map