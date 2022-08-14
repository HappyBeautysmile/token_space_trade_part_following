import * as THREE from "three";
import { LocationMap } from "./locationMap";

export class Possibilities {
  private total = 0;
  constructor(private possibilities: Map<number, number>) {
    for (const count of possibilities.values()) {
      this.total += count;
    }
  }

  clone(): Possibilities {
    const result = new Possibilities(new Map<number, number>());
    for (const [possibility, count] of this.possibilities) {
      result.possibilities.set(possibility, count);
      result.total = this.total;
    }
    return result;
  }

  entropy(): number {
    let ent = 0;
    for (const num of this.possibilities.values()) {
      ent -= Math.log2(num / this.total);
    }
    return ent;
  }

  getRandomItem() {
    let randomIndex = Math.floor(Math.random() * this.total);
    for (const [possibility, count] of this.possibilities.entries()) {
      randomIndex -= count;
      if (randomIndex <= 0) {
        return possibility;
      }
    }
    throw new Error("Should never get here.");
  }

  intersectWith(other: Possibilities) {
    for (const [possibility, count] of other.possibilities.entries()) {
      if (!this.possibilities.has(possibility)) {
        this.possibilities.delete(possibility);
      } else {
        this.possibilities.set(possibility,
          Math.min(this.possibilities.get(possibility), count));
      }
    }
    // Recompute total. Sure it would be more efficient to do this in the loop
    // above. Maybe come back here to improve performance later.
    this.total = 0;
    for (const count of this.possibilities.values()) {
      this.total += count;
    }
  }
}

export class WFCGen {
  is: LocationMap<number> = new LocationMap<number>();
  canBe = new LocationMap<Possibilities>();
  rules = new Map<number, LocationMap<Possibilities>>();
  example: LocationMap<number> = new LocationMap<number>();

  constructor(private maxRadius: number) {
  }

  private randomItemFromExample() {
    return 1;
  }

  private getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  public build() {
    // start with one block at the origin
    let item: number = this.randomItemFromExample();
    let pos = new THREE.Vector3(0, 0, 0);
    this.addAndUpdateRules(pos, item);

    while (true) {
      // find the lowest entropy
      let minPos: THREE.Vector3;
      let minItems: Possibilities;
      let minEntropy = Infinity;
      for (const [pos, items] of this.canBe.entries()) {
        const entropy = items.entropy();
        if (entropy < minEntropy) {
          minPos = pos;
          minItems = items;
          minEntropy = entropy;
        }
      }
      if (!!minItems) {
        item = minItems.getRandomItem();
        this.addAndUpdateRules(minPos, item);
      }
      else {
        break;
      }
    }
  }

  private addAndUpdateRules(pos: THREE.Vector3, item: number) {
    this.is.set(pos, item);
    this.canBe.delete(pos);
    if (this.rules.has(item)) {
      for (let [offset, cellCanBe] of this.rules.get(item).entries()) {
        const setPos = new THREE.Vector3();
        setPos.add(pos);
        setPos.add(offset);
        if (setPos.manhattanLength() <= this.maxRadius &&
          !this.is.has(setPos)) {
          if (!this.canBe.has(setPos)) {
            this.canBe.set(setPos, cellCanBe.clone());
          } else {
            this.canBe.get(setPos).intersectWith(cellCanBe);
          }
        }
      }
    }
  }
}