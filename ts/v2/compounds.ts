


export class Compounds {
  constructor() {
    this.add("clay", "clay", "wedge");
    this.add("wedge", "wedge", "cube");
  }

  private combinations = new Map<string, string>();

  private comboKey(a: string, b: string): string {
    if (a < b) {
      return a + '+' + b;
    } else {
      return b + '+' + a;
    }
  }

  add(a: string, b: string, combined: string) {
    this.combinations.set(this.comboKey(a, b), combined);
  }

  combine(a: string, b: string): string {
    const key = this.comboKey(a, b);
    if (this.combinations.has(key)) {
      return this.combinations.get(key);
    } else {
      return undefined;
    }
  }
}