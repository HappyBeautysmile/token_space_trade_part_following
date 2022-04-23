
export class Tick {
  constructor(readonly elapsedS: number, readonly deltaS: number) { }
}

export interface Ticker {
  tick(t: Tick): void;
}
