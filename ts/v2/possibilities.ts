export class Possibilities {
  private total = 0;
  constructor(private possibilities: Map<number, number>) {
    for (const count of possibilities.values()) {
      this.total += count;
    }
  }

  clone(): Possibilities {
    const result = new Possibilities(new Map<number, number>());
    for (const [possibility, count] of this.possibilities) {
      result.possibilities.set(possibility, count);
      result.total = this.total;
    }
    return result;
  }

  entropy(): number {
    let ent = 0;
    for (const num of this.possibilities.values()) {
      ent -= Math.log2(num / this.total);
    }
    return ent;
  }

  private static emptySet = new Set<number>();

  private getRandomItemNotInSet(exclude: Set<number>): number {
    let total = this.total;
    if (exclude.size > 0) {
      for (const [possibility, count] of this.possibilities.entries()) {
        if (exclude.has(possibility)) total -= count;
      }
    }

    let randomIndex = Math.floor(Math.random() * total);
    for (const [possibility, count] of this.possibilities.entries()) {
      if (exclude.has(possibility)) continue;
      randomIndex -= count;
      if (randomIndex <= 0) {
        return possibility;
      }
    }
    throw new Error("Should never get here.");
  }

  getRandomItem(): number {
    return this.getRandomItemNotInSet(Possibilities.emptySet);
  }


  *allItemsInRandomOrder() {
    const exclude = new Set<number>();
    while (exclude.size < this.possibilities.size) {
      const nextValue = this.getRandomItemNotInSet(exclude);
      exclude.add(nextValue);
      yield nextValue;
    }
  }

  intersectWith(other: Possibilities) {
    for (const [possibility, count] of this.possibilities.entries()) {
      if (!other.possibilities.has(possibility)) {
        this.possibilities.delete(possibility);
      } else {
        this.possibilities.set(possibility,
          Math.min(other.possibilities.get(possibility), count));
      }
    }
    // Recompute total. Sure it would be more efficient to do this in the loop
    // above. Maybe come back here to improve performance later.
    this.total = 0;
    for (const count of this.possibilities.values()) {
      this.total += count;
    }
  }

  impossible(): boolean {
    return this.total == 0;
  }
}