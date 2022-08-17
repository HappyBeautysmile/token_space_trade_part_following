import * as THREE from "three";
import { Construction } from "./construction";
import { LocationMap } from "./locationMap";
import { SimpleLocationMap } from "./simpleLocationMap";

// class Rule {
//     cnt: number = 1;
//     constructor(public location: THREE.Vector3, public item: number) {
//     }
// }

export class AstroGenWFC {
  // is: Map<THREE.Vector3, number> = new Map();
  // canBe: Map<THREE.Vector3, number[]> = new Map();
  // rules: Map<number, Rule[]> = new Map();
  // example: Map<THREE.Vector3, number> = new Map();

  is: LocationMap<number> = new SimpleLocationMap<number>();
  canBe: LocationMap<number[]> = new SimpleLocationMap<number[]>();
  rules: Map<number, LocationMap<number[]>> = new Map();
  example: LocationMap<number> = new SimpleLocationMap<number>();
  private ruleOffset: THREE.Vector3[] = [];

  constructor(private maxRadius) {
    this.ruleOffset.push(new THREE.Vector3(0, 0, 1));
    this.ruleOffset.push(new THREE.Vector3(0, 0, -1));
    this.ruleOffset.push(new THREE.Vector3(0, 1, 0));
    this.ruleOffset.push(new THREE.Vector3(0, -1, 0));
    this.ruleOffset.push(new THREE.Vector3(1, 0, 0));
    this.ruleOffset.push(new THREE.Vector3(-1, 0, 0));
  }

  public makeExample() {
    this.example.set(new THREE.Vector3(0, 0, 0), 1);
    this.example.set(new THREE.Vector3(0, 1, 0), 1);
  }

  private getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }

  public makeRules() {
    for (const [pos, item] of this.example.entries()) {
      if (!this.rules.has(item)) {
        this.rules.set(item, new SimpleLocationMap<number[]>());
      }
      for (const offset of this.ruleOffset) {
        const checkPos = new THREE.Vector3()
        checkPos.add(pos)
        checkPos.add(offset)
        let ruleItem: number = 0;
        if (this.example.has(checkPos)) {
          ruleItem = this.example.get(checkPos) as number;
        }
        if (!this.rules.get(item).has(offset)) {
          this.rules.get(item).set(offset, [])
        }
        let items = this.rules.get(item).get(offset);
        if (!items.includes(ruleItem)) {
          items.push(ruleItem)
        }
        this.rules.get(item)?.set(offset, items);
      }
    }
  }

  private mergeItems(a: number[], b: number[]) {
    let newItems: number[] = [];
    for (const item of a) {
      if (b.includes(item)) {
        newItems.push(item);
      }
    }
    return newItems;
  }

  private randomItemFromExample() {
    return 1;
  }

  public build() {
    // start with one block at the origin
    let item: number = this.randomItemFromExample();
    let pos = new THREE.Vector3(0, 0, 0);
    this.addAndUpdateRules(pos, item);

    while (true) {
      // find the lowest entropy
      let minPos: THREE.Vector3;
      let minItems: number[];
      let minLength = 999;
      for (const [pos, items] of this.canBe.entries()) {
        if (items.length < minLength) {
          minPos = pos;
          minItems = items;
          minLength = items.length;
        }
      }
      if (!!minItems) {
        item = minItems[this.getRandomInt(minItems.length)]
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
          if (this.canBe.has(setPos)) {
            cellCanBe = this.mergeItems(this.canBe.get(setPos), cellCanBe);
          }
          this.canBe.set(setPos, cellCanBe);
        }
      }
    }
  }
}