import { Store } from "./store";

// Measures a dependency on a specific store for a specific process.
export class Source {
  // `unitsRequired` is the number of units required by the process.
  constructor(private unitsRequired: number, private store: Store) {
  }

  isReady(): boolean {
    return this.store.getNumberOfUnits() > this.unitsRequired;
  }

  consume() {
    this.store.removeUnits(this.unitsRequired);
  }
}