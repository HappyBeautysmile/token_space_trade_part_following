import { BankAccount, Exchange } from "./exchange";
import * as THREE from "three";
import { Assets, Item } from "./assets";
import { Debug } from "./debug";

// this class has one instance per item type.
// Probably don't want to keep it in player.ts, 
//    or maybe this file contains more that just player classes.

export class Inventory {
  items: [{ item: Item, color: THREE.Color, qty: number }];

  addItem(input) {
    Debug.log("adding " + JSON.stringify(input));
    if (typeof (input) == typeof (THREE.Object3D)) {

    }
    else if (typeof (input) == typeof (Item)) {
      const index = this.items.findIndex(e => e.item == input)
      if (index >= 0) {
        this.items[index].qty++;
      }
      else {
        this.items.push(input);
      }
    }
  }

  removeItem(input) {
    Debug.log("removing " + JSON.stringify(input));
    if (typeof (input) == typeof (THREE.Object3D)) {

    }
    else if (typeof (input) == typeof (Item)) {

    }
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