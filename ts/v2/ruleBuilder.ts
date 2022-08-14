import { LocationMap } from "./locationMap";
import { Possibilities } from "./wfcGen";

export class RuleBuilder {
  private possibilities = new LocationMap<Map<number, number>>();
  constructor(private base: number) { }

  add3(dx: number, dy: number, dz: number, possibility: number) {
    if (possibility == undefined) {
      throw new Error('Undefined!');
    }
    let m: Map<number, number>;
    if (!this.possibilities.has3(dx, dy, dz)) {
      m = new Map<number, number>();
      this.possibilities.set3(dx, dy, dz, m);
    } else {
      m = this.possibilities.get3(dx, dy, dz);
    }
    if (!m.has(possibility)) {
      m.set(possibility, 1);
    } else {
      m.set(possibility, m.get(possibility) + 1);
    }
  }

  build(): [number, LocationMap<Possibilities>] {
    const lm = new LocationMap<Possibilities>();
    for (const [k, v] of this.possibilities.entries()) {
      const p = new Possibilities(v);
      lm.set(k, p);
    }
    return [this.base, lm];
  }
}

export class AllRuleBuilder {
  readonly allRules = new Map<number, RuleBuilder>();
  constructor() { }

  add3(center: number,
    dx: number, dy: number, dz: number, possibility: number) {
    if (!this.allRules.has(center)) {
      this.allRules.set(center, new RuleBuilder(center));
    }
    this.allRules.get(center).add3(dx, dy, dz, possibility);
  }

  *buildRules(): Iterable<[number, LocationMap<Possibilities>]> {
    for (const [k, v] of this.allRules.entries()) {
      yield v.build();
    }
  }
}