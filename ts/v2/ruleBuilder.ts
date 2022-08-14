import { LocationMap } from "./locationMap";

export class RuleBuilder {
  private possibilities = new LocationMap<number[]>();
  constructor(private base: number) { }

  add3(dx: number, dy: number, dz: number, possibility: number) {
    if (!this.possibilities.has3(dx, dy, dz)) {
      this.possibilities.set3(dx, dy, dz, []);
    }
    this.possibilities.get3(dx, dy, dz).push(possibility);
  }

  build(): [number, LocationMap<number[]>] {
    return [this.base, this.possibilities];
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