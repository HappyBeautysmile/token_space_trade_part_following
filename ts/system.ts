import * as THREE from "three";
import { Item } from "./assets";
import { Exchange } from "./exchange";

export class System {
    name: string;
    bodies: Map<string, Body>
}

type BodyType = 'Asteroid' | 'Station';

export class Body {
    name: string;
    exchanges: Map<Item, Exchange>
    position: THREE.Vector3
    bodyType: BodyType
}