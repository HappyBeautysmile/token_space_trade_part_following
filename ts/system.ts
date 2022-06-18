import * as THREE from "three";
import { Item } from "./assets";
import { Exchange } from "./exchange";

export class System {
    public bodies: Map<string, Body>

    constructor(private name: string) {
        this.bodies = new Map<string, Body>();
    }
    getName() {
        return this.name;
    }
    public addBody(body: Body) {
        this.bodies.set(body.name, body);
    }
}

type BodyType = 'Asteroid' | 'Station';

export class Body {
    name: string;
    exchanges: Map<Item, Exchange>
    position: THREE.Vector3
    bodyType: BodyType
}