// import * as THREE from "three";

import { Index } from ".";
import { LocationMap } from "./locationMap";
import { Log } from "./log";
import { AllRuleBuilder } from "./ruleBuilder";
import { WfcBuild } from "./wfcBuild";

class WFC2D {
  private static readonly kInputSize = 32;
  private static readonly kPixelSize = 16;
  private static readonly kBackgroundColor = 'Black';

  private drawCanvas: HTMLCanvasElement;
  private currentColor: string = 'White';
  private genCanvas: HTMLCanvasElement;

  private colorIndex = new Index<string>();
  private exampleData = new Int32Array(WFC2D.kInputSize * WFC2D.kInputSize);
  private tileData = new Int32Array(WFC2D.kInputSize * WFC2D.kInputSize);

  constructor() {
    document.body.innerHTML = '';
    this.colorIndex.getIndex(WFC2D.kBackgroundColor);
    this.addDrawCanvas();
    this.addColorButtons();
    this.addRenderButton();
    this.addGenCanvas();
  }

  private setPixel(i: number, j: number) {
    const c = this.colorIndex.getIndex(this.currentColor);
    this.exampleData[j * WFC2D.kInputSize + i] = c;
    this.updatePixel(i, j);
  }

  private updatePixel(i: number, j: number) {
    const ctx = this.drawCanvas.getContext('2d');
    const c = this.exampleData[j * WFC2D.kInputSize + i];
    ctx.fillStyle = this.colorIndex.getValue(c);
    ctx.fillRect(i * WFC2D.kPixelSize, j * WFC2D.kPixelSize, WFC2D.kPixelSize, WFC2D.kPixelSize);
  }

  private getPixel(i: number, j: number): number {
    if (i < 0 || j < 0 || i >= WFC2D.kInputSize || j >= WFC2D.kInputSize) {
      return this.colorIndex.getIndex(WFC2D.kBackgroundColor);
    }
    return this.exampleData[j * WFC2D.kInputSize + i];
  }

  private addDrawCanvas() {
    this.drawCanvas = document.createElement('canvas');
    this.drawCanvas.width = WFC2D.kPixelSize * WFC2D.kInputSize;
    this.drawCanvas.height = WFC2D.kPixelSize * WFC2D.kInputSize;
    this.drawCanvas.style.cursor = 'crosshair';
    document.body.appendChild(this.drawCanvas);

    let drawing = false;
    const setPix = (me: MouseEvent) => {
      var rect = this.drawCanvas.getBoundingClientRect();
      const i = Math.floor((me.clientX - rect.left) / WFC2D.kPixelSize);
      const j = Math.floor((me.clientY - rect.top) / WFC2D.kPixelSize);
      this.setPixel(i, j);
    }

    this.drawCanvas.addEventListener('mousedown', (me: MouseEvent) => {
      drawing = true;
      setPix(me);
    });
    this.drawCanvas.addEventListener('mouseup', () => {
      drawing = false;
    });
    this.drawCanvas.addEventListener('mousemove', (me: MouseEvent) => {
      if (drawing) {
        setPix(me);
      }
    });
  }

  private addGenCanvas() {
    this.genCanvas = document.createElement('canvas');
    this.genCanvas.width = WFC2D.kPixelSize * WFC2D.kInputSize;
    this.genCanvas.height = WFC2D.kPixelSize * WFC2D.kInputSize;
    this.genCanvas.style.cursor = 'crosshair';
    document.body.appendChild(this.genCanvas);
  }

  private addColorButtons() {
    for (const c of
      [WFC2D.kBackgroundColor, 'PaleTurquoise', 'SaddleBrown', 'Gray', 'White', 'DarkGreen']) {
      const sp = document.createElement('span');
      sp.innerText = 'O';
      sp.style.background = c;
      sp.addEventListener('click', () => {
        console.log(`Color selected: ${c}`);
        this.currentColor = c;
      });
      document.body.appendChild(sp);
    }
  }

  private addRenderButton() {
    const button = document.createElement('span');
    button.innerText = 'Render';
    button.style.background = '#ddf';
    button.style.color = '#000';
    document.body.appendChild(button);

    button.addEventListener('click', () => {
      this.generateRules();
    });
  }

  private *allInputIJs(): Iterable<[number, number]> {
    for (let j = 0; j < WFC2D.kInputSize; ++j) {
      for (let i = 0; i < WFC2D.kInputSize; ++i) {
        yield [i, j];
      }
    }
  }

  private addRule(i: number, j: number, di: number, dj: number, builder: AllRuleBuilder) {
    if (i + di < 0 || j + dj < 0 ||
      i + di >= WFC2D.kInputSize || j + dj >= WFC2D.kInputSize) {
      return;
    }
    const thisTile = this.tileData[j * WFC2D.kInputSize + i];
    // if (thisTile == 0) {
    //   return;
    // }
    const thatTile = this.tileData[(j + dj) * WFC2D.kInputSize + i + di];
    builder.add3(thisTile, di, dj, 0, thatTile);
  }

  private generateRules() {
    Log.clear();
    Log.info('Generating tiles');
    const tileIndex = new Index<string>();

    const ctx = this.drawCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height);
    for (const [i, j] of this.allInputIJs()) {
      this.updatePixel(i, j);
    }
    ctx.fillStyle = 'blue';

    for (const [i, j] of this.allInputIJs()) {
      const tile = tileIndex.getIndex(this.makeTile5(i, j));
      ctx.fillText(tile.toFixed(0), i * WFC2D.kPixelSize, (j + 0.6) * WFC2D.kPixelSize);
      this.tileData[j * WFC2D.kInputSize + i] = tile;
    }
    Log.info(`Found ${tileIndex.getSize()} tiles.`);
    const allRules = new AllRuleBuilder();
    for (const [i, j] of this.allInputIJs()) {
      this.addRule(i, j, -1, 0, allRules);
      this.addRule(i, j, 1, 0, allRules);
      this.addRule(i, j, 0, -1, allRules);
      this.addRule(i, j, 0, 1, allRules);
    }

    const wfc = new WfcBuild(allRules, 5); // WFC2D.kInputSize / 2 + 1);
    this.paintGenCanvas(wfc.build(), tileIndex);
  }

  private paintGenCanvas(state: LocationMap<number>,
    tileIndex: Index<string>) {
    const ctx = this.genCanvas.getContext('2d');
    ctx.clearRect(0, 0, this.genCanvas.width, this.genCanvas.height);

    for (let x = 0; x < this.genCanvas.width; x += 11) {
      for (let y = 0; y < this.genCanvas.height; y += 11) {
        ctx.fillStyle = ((x + y) & 0x1) === 0x1 ? '#777' : '#888';
        ctx.fillRect(x, y, 11, 11);
      }
    }

    for (const [pos, n] of state.entries()) {
      if (pos.z != 0) {
        continue;
      }
      const i = Math.round(pos.x + WFC2D.kInputSize / 2);
      const j = Math.round(pos.y + WFC2D.kInputSize / 2);
      ctx.fillStyle = this.getTileColor(tileIndex.getValue(n));
      ctx.fillRect(i * WFC2D.kPixelSize, j * WFC2D.kPixelSize, WFC2D.kPixelSize, WFC2D.kPixelSize);
      ctx.fillStyle = 'blue';
      ctx.fillText(n.toFixed(0), i * WFC2D.kPixelSize, (j + 0.6) * WFC2D.kPixelSize);

      const c = this.colorIndex.getIndex(this.currentColor);
    }
  }

  private makeTile5(i: number, j: number): string {
    let tileChars: string[] = [];
    tileChars.push(String.fromCharCode(65 + this.getPixel(i, j)));
    tileChars.push(String.fromCharCode(65 + this.getPixel(i, j - 1)));
    tileChars.push(String.fromCharCode(65 + this.getPixel(i - 1, j)));
    tileChars.push(String.fromCharCode(65 + this.getPixel(i + 1, j)));
    tileChars.push(String.fromCharCode(65 + this.getPixel(i, j + 1)));
    return tileChars.join('');
  }

  private makeTile1(i: number, j: number): string {
    return String.fromCharCode(65 + this.getPixel(i, j));
  }

  private getTileColor(tile: string): string {
    const colorNumber = tile.charCodeAt(0) - 65;
    const color = this.colorIndex.getValue(colorNumber);
    // Log.info(`${tile} = ${color}`);
    return color;
  }
}

console.log('Starting...');
new WFC2D();

