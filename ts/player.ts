import { BankAccount, Exchange } from "./exchange";
import * as THREE from "three";
import { Assets, Item } from "./assets";

// this class has one instance per item type.
// Probably don't want to keep it in player.ts, 
//    or maybe this file contains more that just player classes.

export class Inventory {
    items: [{ item: Item, color: THREE.Color, qty: Number }];
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
        this.inventory.items.push({ item: new Item(), color: new THREE.Color(), qty: 10 });
    }
}

export class Station {
    name: string;
    owner: Player;
    inventory: Inventory;
    exchange: Exchange;
    location: THREE.Vector3;
}