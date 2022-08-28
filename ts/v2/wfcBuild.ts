import * as THREE from "three";

import { JournalingLocationMap } from "./journalingLocationMap";
import { LocationMap } from "./locationMap";
import { Log } from "./log";
import { Possibilities } from "./possibilities";
import { AllRuleBuilder, RuleBuilder } from "./ruleBuilder";
import { SimpleLocationMap } from "./simpleLocationMap";

export class WfcBuild {
  private rules = new Map<number, LocationMap<Possibilities>>();
  private state = new JournalingLocationMap<Possibilities>();

  constructor(rules: AllRuleBuilder, private radius: number) {
    for (const [tile, rule] of rules.buildRules()) {
      this.rules.set(tile, rule);
    }
  }

  public build(): LocationMap<number> {
    this.state = new JournalingLocationMap<Possibilities>();

    if (!this.solveWith(new THREE.Vector3(), 1)) {
      Log.info('Impossible.')
      throw new Error("Impossible.");
    }
    const result = new SimpleLocationMap<number>();
    for (const [pos, possibilities] of this.state.entries()) {
      const value = possibilities.obvious();
      if (value === undefined) {
        Log.info('Did not finish.')
        throw new Error("Did not finish.");
      }
      result.set(pos, value);
    }
    return result;
  }

  private solveSteps = 0;

  // Attempts to solve by setting `value` at `pos`.
  private solveWith(pos: THREE.Vector3, value: number): boolean {
    if (++this.solveSteps > 10000) {
      Log.info('Aborting.');
      return false;
    }
    Log.info(`Attempting ${value} at (${[pos.x, pos.y]})`);
    this.state.setMark();
    this.state.set(pos, Possibilities.makeSinglePossibility(value));
    const rule = this.rules.get(value);
    for (const [dp, constraints] of rule.entries()) {
      const targetPosition = new THREE.Vector3();
      targetPosition.copy(pos);
      targetPosition.add(dp);
      if (targetPosition.length() > this.radius) {
        continue;
      }

      let existingConstraints: Possibilities;
      if (this.state.has(targetPosition)) {
        existingConstraints = this.state.get(targetPosition).clone();
        existingConstraints.intersectWith(constraints);
      } else {
        existingConstraints = constraints.clone();
      }
      if (existingConstraints.impossible()) {
        this.state.undoToMark();
        Log.info(`Impossible at ${[targetPosition.x, targetPosition.y]}`);
        return false;
      } else {
        // Log.info(`Constrained ${[targetPosition.x, targetPosition.y]}`);
        this.state.set(targetPosition, existingConstraints);
      }
    }

    if (!this.solve()) {
      this.state.undoToMark();
      return false;
    }
    this.state.clearLastMark();
    return true;
  }

  private solve(): boolean {
    if (++this.solveSteps > 10000) {
      Log.info('Aborting.');
      return false;
    }
    // Find cell with lowest entropy
    let minEntropy = Infinity;
    let minPosition = undefined;
    let doneCount = 0;
    let openCount = 0;
    for (const [pos, possibilities] of this.state.entries()) {
      const entropy = possibilities.entropy();
      if (entropy === 0) {
        ++doneCount;
        continue;
      }
      ++openCount;
      if (entropy < minEntropy) {
        minEntropy = entropy;
        minPosition = pos;
      }
    }
    Log.info(`Open: ${openCount}, done: ${doneCount}`);
    if (minPosition === undefined) {
      return true;  // DONE!
    }

    // Attempt to fill it in.
    this.state.setMark();
    let success = false;
    for (const value of this.state.get(minPosition).allItemsInRandomOrder()) {
      if (this.solveWith(minPosition, value)) {
        success = true;
        break;
      }
    }
    if (!success) {
      this.state.undoToMark();
      return false;
    } else {
      this.state.clearLastMark();
    }
    return success;
  }
}