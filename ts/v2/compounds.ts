


export class Compounds {
  constructor() {
    // Legacy (delete)
    this.add("clay", "clay", "wedge");
    this.add("wedge", "wedge", "cube");

    // Class-S
    this.addUpgrade(['lithium-silicate', 'lithium', 'doping']);
    this.add('lithium-silicate', 'borosilicate', 'silicon');
    this.add('borosilicate', 'borosilicate', 'glass-rod');
    this.addUpgrade(['silicon', 'refined-silicon']);
    this.add('doping', 'refined-silicon', 'doped-silicon');
    this.addUpgrade(['glass-rod', 'glass-cone']);

    // Class-M
    this.addUpgrade(['chromium-ore', 'chromium', 'chrome-corner',
      'chrome-wedge', 'chrome-cube']);

    // Class-C
    this.add('iron-chondrite', 'iron-chondrite', 'iron');
    this.addUpgrade(['carbon-chondrite', 'organics', 'carbon-fiber',
      'carbon-fiber-wedge', 'carbon-fiber-cube']);
    this.addUpgrade(['ice', 'fuel']);

    this.add('iron', 'organics', 'steel-corner');
    this.add('steel-corner', 'steel-corner', 'steel-wedge');
    this.add('steel-wedge', 'steel-wedge', 'steel-cylinder');
    this.add('ice', 'organics', 'food');

    this.add('carbon-fiber-wedge', 'steel-wedge', 'cluster-jet');
    this.add('chrome-wedge', 'carbon-fiber-cube', 'fuel-tank');

    this.add('steel-cylinder', 'chromium', 'ht-steel-cylinder');

    // Cross-Class
    this.add('ht-steel-cylinder', 'glass-cone', 'thruster-jet');
    this.add('steel-cylinder', 'computer', 'habitat');
    this.add('doped-silicon', 'steel-wedge', 'computer');
    this.add('computer', 'ht-steel-cylinder', 'factory');
    this.add('solar-panel', 'steel-wedge', 'conveyer');
    this.add('silicon', 'steel-wedge', 'solar-panel');
  }


  private combinations = new Map<string, string>();
  private breaks = new Map<string, string[]>();

  private comboKey(a: string, b: string): string {
    if (a < b) {
      return a + '+' + b;
    } else {
      return b + '+' + a;
    }
  }

  addUpgrade(sequence: string[]) {
    for (let i = 0; i < sequence.length - 1; ++i) {
      this.add(sequence[i], sequence[i], sequence[i + 1]);
    }
  }

  add(a: string, b: string, combined: string) {
    this.combinations.set(this.comboKey(a, b), combined);
    this.breaks.set(combined, [a, b]);
  }

  combine(a: string, b: string): string {
    const key = this.comboKey(a, b);
    if (this.combinations.has(key)) {
      return this.combinations.get(key);
    } else {
      return undefined;
    }
  }

  break(a: string): string[] {
    if (this.breaks.has(a)) {
      return this.breaks.get(a);
    } else {
      return undefined;
    }
  }
}