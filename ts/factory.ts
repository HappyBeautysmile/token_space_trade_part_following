import * as THREE from "three";

import { Item } from "./assets";
import { Construction } from "./construction";
import { InWorldItem } from "./inWorldItem";
import { Tick, Ticker } from "./tick";

export type Specification = Map<Item, number>;

type FactoryState = 'searching' | 'building';

class Counter {
  private m = new Map<Item, InWorldItem[]>();
  public get(k: Item): number {
    if (this.m.has(k)) {
      return this.m.get(k).length;
    }
    return 0;
  }
  public getItems(k: Item) {
    return this.m.get(k);
  }

  public increment(i: InWorldItem) {
    if (!this.m.has(i.item)) {
      this.m.set(i.item, []);
    }
    this.m.get(i.item).push(i);
  }
}

export class Factory implements Ticker {
  private state: FactoryState = 'searching';
  // Time left to complete the task.
  private timeRemaining: number = 0;
  private construction: Construction = undefined;
  private position: THREE.Vector3 = new THREE.Vector3();
  private outDriection: THREE.Vector3 = new THREE.Vector3();
  constructor(private inputSpec: Specification,
    private outputType: Item,
    private outputQty: number,
    private searchTimeS: number,
    private buildTimeS: number) { }

  public setHome(construction: Construction,
    position: THREE.Vector3, outDirection: THREE.Vector3) {
    this.construction = construction;
    this.position.copy(position);
    this.outDriection.copy(outDirection);
  }

  private search(): boolean {
    // TODO: There might be some low-hanging performance fruit here.
    // Caching the arrays that are used for these items might save
    // a lot of garbage collection.
    const itemsFound = new Counter();
    for (const inWorldItem of this.construction.cubes()) {
      if (this.inputSpec.has(inWorldItem.item)) {
        itemsFound.increment(inWorldItem);
      }
    }
    for (const [k, v] of this.inputSpec) {
      if (itemsFound.get(k) < v) {
        return false;
      }
    }
    // Mine the furthest items.
    const aPos = new THREE.Vector3();
    const bPos = new THREE.Vector3();
    for (const [k, v] of this.inputSpec) {
      const allItems = itemsFound.getItems(k);
      allItems.sort((a, b) => {
        aPos.copy(a.position);
        aPos.sub(this.position);
        bPos.copy(b.position);
        bPos.sub(this.position);
        return bPos.lengthSq() - aPos.lengthSq();
      });
      for (let i = 0; i < v; ++i) {
        console.log('Factory mining');
        this.construction.removeCube(allItems[i].position);
      }
    }
    return true;
  }

  private unitDirections = [
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(-1, 0, 0)
  ]

  private addOrthogonal(cursor: THREE.Vector3) {
    while (true) {
      const i = Math.trunc(Math.random() * this.unitDirections.length);
      if (this.unitDirections[i].dot(this.outDriection) == 0) {
        cursor.add(this.unitDirections[i]);
        return;
      }
    }
  }

  private dump() {
    const cursor = new THREE.Vector3();
    cursor.copy(this.position);
    cursor.add(this.outDriection);
    for (let i = 0; i < this.outputQty; ++i) {
      while (this.construction.cubeAt(cursor)) {
        if (Math.random() < 0.3) {
          cursor.add(this.outDriection);
        } else {
          this.addOrthogonal(cursor);
        }
      }
      this.construction.addCube(
        new InWorldItem(this.outputType, cursor, new THREE.Quaternion()));
    }
  }

  public tick(tick: Tick) {
    this.timeRemaining -= tick.deltaS;
    if (this.timeRemaining > 0) {
      return;
    }
    switch (this.state) {
      case 'searching':
        if (this.construction) {
          if (this.search()) {
            this.state = 'building';
            this.timeRemaining += this.buildTimeS;
            return;
          }
        }
        this.timeRemaining += this.searchTimeS;
        break;
      case 'building':
        this.dump();
        this.state = 'searching';
        this.timeRemaining += this.searchTimeS;
    }
  }
}