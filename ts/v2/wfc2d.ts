// import * as THREE from "three";

import { Index } from ".";
import { AstroGenWFC } from "./astroGenWFC";
import { AllRuleBuilder, RuleBuilder } from "./ruleBuilder";

class WFC2D {
  private static readonly kInputSize = 32;
  private static readonly kPixelSize = 16;
  private static readonly kBackgroundColor = 'Black';

  private drawCanvas: HTMLCanvasElement;
  private currentColor: string = 'White';

  private colorIndex = new Index<string>();
  private exampleData = new Int32Array(WFC2D.kInputSize * WFC2D.kInputSize);
  private tileData = new Int32Array(WFC2D.kInputSize * WFC2D.kInputSize);

  constructor() {
    document.body.innerHTML = '';
    this.colorIndex.getIndex(WFC2D.kBackgroundColor);
    this.addDrawCanvas();
    this.addColorButtons();
    this.addRenderButton();
  }

  private setPixel(i: number, j: number) {
    const ctx = this.drawCanvas.getContext('2d');
    ctx.fillStyle = this.currentColor;
    ctx.fillRect(i * WFC2D.kPixelSize, j * WFC2D.kPixelSize, WFC2D.kPixelSize, WFC2D.kPixelSize);
    const c = this.colorIndex.getIndex(this.currentColor);
    this.exampleData[j * WFC2D.kInputSize + i] = c;
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
    const thisTile = this.tileData[j * WFC2D.kInputSize + i];
    const thatTile = this.tileData[(j + dj) * WFC2D.kInputSize + i + di];
    builder.add3(thisTile, di, dj, 0, thatTile);
  }

  private generateRules() {
    console.log('Generating tiles');
    const tileIndex = new Index<string>();
    for (const [i, j] of this.allInputIJs()) {
      const tile = tileIndex.getIndex(this.makeTile(i, j));
      this.tileData[j * WFC2D.kInputSize + i] = tile;
    }
    console.log(`Found ${tileIndex.getSize()} tiles.`);
    const allRules = new AllRuleBuilder();
    for (const [i, j] of this.allInputIJs()) {
      this.addRule(i, j, -1, 0, allRules);
      this.addRule(i, j, 1, 0, allRules);
      this.addRule(i, j, 0, -1, allRules);
      this.addRule(i, j, 0, 1, allRules);
    }

    const wfc = new AstroGenWFC();
    let numRules = 0;
    for (const [center, possibilities] of allRules.buildRules()) {
      wfc.addRule(center, possibilities);
      numRules += possibilities.getSize();
    }
    console.log(`Number of rules: ${numRules}`);
    wfc.build();
    console.log(`Generated: ${wfc.is.getSize()}`);
  }

  private makeTile(i: number, j: number): string {
    let tileChars: string[] = [];
    tileChars.push(String.fromCharCode(65 + this.getPixel(i, j)));
    tileChars.push(String.fromCharCode(65 + this.getPixel(i, j - 1)));
    tileChars.push(String.fromCharCode(65 + this.getPixel(i - 1, j)));
    tileChars.push(String.fromCharCode(65 + this.getPixel(i + 1, j)));
    tileChars.push(String.fromCharCode(65 + this.getPixel(i, j + 1)));
    return tileChars.join('');
  }
}

console.log('Starting...');
new WFC2D();
