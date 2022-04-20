
export class Tick {
  constructor(readonly deltaS: number) { }
}

export interface Ticker {
  tick(t: Tick): void;
}
