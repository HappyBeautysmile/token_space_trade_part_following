import { LocationMap } from "./locationMap";

export class RuleBuilder {
  private possibilities = new LocationMap<Set<number>>();
  constructor(private base: number) { }

  add3(dx: number, dy: number, dz: number, possibility: number) {
    if (possibility == undefined) {
      throw new Error('Undefined!');
    }
    if (!this.possibilities.has3(dx, dy, dz)) {
      this.possibilities.set3(dx, dy, dz, new Set<number>());
    }
    this.possibilities.get3(dx, dy, dz).add(possibility);
  }

  build(): [number, LocationMap<number[]>] {
    const lm = new LocationMap<number[]>();
    for (const [k, v] of this.possibilities.entries()) {
      const a: number[] = [];
      for (const n of v.values()) {
        a.push(n);
      }
      lm.set(k, a);
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

  *buildRules(): Iterable<[number, LocationMap<number[]>]> {
    for (const [k, v] of this.allRules.entries()) {
      yield v.build();
    }
  }
}