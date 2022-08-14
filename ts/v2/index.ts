

export class Index<T> {
  private indexToValue = new Map<number, T>();
  private valueToIndex = new Map<T, number>();

  constructor() { }

  getIndex(value: T): number {
    if (!this.valueToIndex.has(value)) {
      const index = this.valueToIndex.size;
      this.valueToIndex.set(value, index);
      this.indexToValue.set(index, value);
    }
    return this.valueToIndex.get(value);
  }

  getValue(index: number): T {
    return this.indexToValue.get(index);
  }

  getSize(): number {
    return this.indexToValue.size;
  }
}