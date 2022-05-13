import { BankAccount, Exchange } from "./exchange";
import * as THREE from "three";
import { Assets, Item } from "./assets";
import { Debug } from "./debug";

// this class has one instance per item type.
// Probably don't want to keep it in player.ts, 
//    or maybe this file contains more that just player classes.

export class Inventory {
  private itemQty = new Map<Item, number>();
  private index = 0;

  addItem(input: Item) {
    Debug.log("adding " + JSON.stringify(input));
    if (this.itemQty.has(input)) {
      this.itemQty.set(input, this.itemQty.get(input) + 1);
    } else {
      this.itemQty.set(input, 1);
    }
  }

  removeItem(input: Item) {
    Debug.log("removing " + JSON.stringify(input));
    if (this.itemQty.has(input)) {
      this.itemQty.set(input, this.itemQty.get(input) - 1);
    } else {
      //this.itemQty.set(input, -1);
      this.itemQty.delete(input);
    }
  }

  nextItem() {
    const num_elements = this.itemQty.size;
    this.index = (this.index + 1) % num_elements;
    return Array.from(this.itemQty)[this.index][0];
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