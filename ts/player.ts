import { BankAccount, Exchange } from "./exchange";
import * as THREE from "three";
import { Assets, Item } from "./assets";
import { Debug } from "./debug";
import { S } from "./settings";

// this class has one instance per item type.
// Probably don't want to keep it in player.ts, 
//    or maybe this file contains more that just player classes.

export class Inventory {
  private itemQtyMap = new Map<Item, number>();
  private index = 0;

  constructor() {
    if (S.float('cr') > 0) {
      for (const item of Assets.items) {
        this.itemQtyMap.set(item, S.float('cr'));
      }
    }
  }

  addItem(input: Item) {
    Debug.log("adding " + JSON.stringify(input));
    if (this.itemQtyMap.has(input)) {
      this.itemQtyMap.set(input, this.itemQtyMap.get(input) + 1);
    } else {
      this.itemQtyMap.set(input, 1);
    }
  }

  removeItem(input: Item) {
    Debug.log("removing " + JSON.stringify(input));
    if (this.itemQtyMap.has(input)) {
      this.itemQtyMap.set(input, this.itemQtyMap.get(input) - 1);
      if (this.itemQtyMap.get(input) < 1) {
        this.itemQtyMap.delete(input);
      }
    }

  }

  nextItem() {
    const num_elements = this.itemQtyMap.size;
    if (num_elements < 1) {
      return null;
    }
    this.index = (this.index + 1) % num_elements;
    return Array.from(this.itemQtyMap)[this.index][0];
  }

  getItemQtyMap() {
    return this.itemQtyMap;
  }
  qtyOfItem(i: Item) {
    return this.itemQtyMap.get(i);
  }
}


export class Player {
  name: string;
  bankacount: BankAccount;
  inventory: Inventory;
  location: THREE.Vector3;
  constructor(name: string) {
    this.name = name;
    this.bankacount = new BankAccount(1000);
    this.location = new THREE.Vector3();
    this.inventory = new Inventory();
  }
}

export class Station {
  name: string;
  owner: Player;
  inventory: Inventory;
  exchange: Exchange;
  location: THREE.Vector3;
}