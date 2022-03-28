// A homogeneous collection of units.
export class Store {
  private numberOfUnits = 0;
  constructor(readonly itemName: string, private tonsPerUnit: number,
    initialUnits: number) {
    this.numberOfUnits = initialUnits;
  }

  getNumberOfUnits() {
    return this.numberOfUnits;
  }

  addUnit() {
    ++this.numberOfUnits;
  }

  removeUnits(n: number) {
    this.numberOfUnits -= n;
  }
}