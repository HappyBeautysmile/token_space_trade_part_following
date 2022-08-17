import * as THREE from "three";
import { LocationMap } from "./locationMap";
import { Possibilities } from "./possibilities";
import { SimpleLocationMap } from "./simpleLocationMap";

export class WFCGen {
  is: LocationMap<number> = new SimpleLocationMap<number>();
  canBe = new SimpleLocationMap<Possibilities>();
  rules = new Map<number, LocationMap<Possibilities>>();
  example: LocationMap<number> = new SimpleLocationMap<number>();

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