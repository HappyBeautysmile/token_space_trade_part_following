import * as THREE from "three";
import { JournalingLocationMap } from "./journalingLocationMap";
import { LocationMap } from "./locationMap";
import { Log } from "./log";
import { Possibilities } from "./possibilities";
import { SimpleLocationMap } from "./simpleLocationMap";

export class WFCGen {
  is: JournalingLocationMap<number> = new JournalingLocationMap<number>();
  canBe = new JournalingLocationMap<Possibilities>();
  rules = new Map<number, LocationMap<Possibilities>>();
  example: LocationMap<number> = new SimpleLocationMap<number>();

  constructor(private maxRadius: number) {
  }

  private randomItemFromExample() {
    return 1;
  }

  public build() {
    // start with one block at the origin
    let item: number = this.randomItemFromExample();
    let pos = new THREE.Vector3(0, 0, 0);
    this.addAndUpdateRules(pos, item);
    this.buildOne();
  }

  private remainingPositions(): string {
    const ps: string[] = [];
    for (const [pos, possibilities] of this.canBe.entries()) {
      const pps: string[] = [];
      for (const p of possibilities.allItemsInRandomOrder()) {
        pps.push(p.toFixed(0));
      }
      ps.push(`(${[pos.x, pos.y]}: ${pps.join(':')})`);
    }
    return ps.join(' ');
  }

  private state(): string {
    const ps: string[] = [];
    for (const [pos, item] of this.is.entries()) {
      ps.push(`(${[pos.x, pos.y]})=${item}`);
    }
    return ps.join(' ');
  }

  private buildOne(): boolean {
    this.is.setMark();
    this.canBe.setMark();
    // find the lowest entropy
    let minPos: THREE.Vector3;
    let minItems: Possibilities;
    let minEntropy = Infinity;
    let done = false;
    Log.info(`State: ${this.state()}`);
    Log.info(`Remaining: ${this.remainingPositions()}`);
    while (!done) {
      done = true;
      minEntropy = Infinity;
      minItems = undefined;
      for (const [pos, items] of this.canBe.entries()) {
        const entropy = items.entropy();
        const obvious = items.obvious();
        if (obvious != undefined) {
          Log.info(`Obvious ${obvious} at ${[pos.x, pos.y]}`);
          done = false;
          if (!this.addAndUpdateRules(pos, obvious)) {
            this.is.undoToMark();
            this.canBe.undoToMark();
            Log.info(`Failed obvious change.`);
            return false;
          }
        } else if (entropy < minEntropy) {
          minPos = pos;
          minItems = items;
          minEntropy = entropy;
        }
      }
    }
    if (!!minItems) {
      // Log.info(`Trying ${minItems.getSize()} things at ${[minPos.x, minPos.y]}`);
      for (const item of minItems.allItemsInRandomOrder()) {
        Log.info(`State: ${this.state()}`);
        Log.info(`Remaining: ${this.remainingPositions()}`);
        Log.info(`Trying ${item} at ${[minPos.x, minPos.y]}`);
        if (this.addAndUpdateRules(minPos, item)) {
          if (this.canBe.getSize() === 0) {
            Log.info('DONE!');
            return true;
          } else {
            if (this.buildOne()) {
              return true;
            }
          }
        }
        if (this.is.has(minPos)) {
          Log.info(`*** Unsuccessful unroll at ${[minPos.x, minPos.y]}`);
          throw new Error(`Unsuccessful unroll.`);
        }
      }
      Log.info(`All ${minItems.getSize()} things failed at ${[minPos.x, minPos.y]}`);
      this.is.undoToMark();
      this.canBe.undoToMark();
      return false;
    } else {
      Log.info("*** Impossible?");
      throw new Error("Impossible state?!");
    }
  }

  private addAndUpdateRules(pos: THREE.Vector3, item: number): boolean {
    if (!this.rules.has(item)) {
      throw new Error(`No rules for ${item}`);
    }
    this.is.setMark();
    this.canBe.setMark();

    this.is.set(pos, item);
    this.canBe.delete(pos);
    let success = true;
    for (let [offset, cellCanBe] of this.rules.get(item).entries()) {
      const setPos = new THREE.Vector3();
      setPos.copy(pos);
      setPos.add(offset);
      if (Math.max(
        Math.abs(setPos.x), Math.abs(setPos.y), Math.abs(setPos.z)) <=
        this.maxRadius &&
        !this.is.has(setPos)) {
        if (!this.canBe.has(setPos)) {
          this.canBe.set(setPos, cellCanBe.clone());
        } else {
          const canBe = this.canBe.get(setPos).clone();
          canBe.intersectWith(cellCanBe);
          this.canBe.set(setPos, canBe);
          if (canBe.impossible()) {
            Log.info(`Tried ${item} at ${[pos.x, pos.y]}, but impossible at ${[setPos.x, setPos.y]}`);
            success = false;
            break;
          }
        }
      }
    }
    if (!success) {
      this.is.undoToMark();
      this.canBe.undoToMark();
    } else {
      this.is.clearLastMark();
      this.canBe.clearLastMark();
    }
    return success;
  }
}