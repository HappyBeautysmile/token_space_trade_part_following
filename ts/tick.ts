
export class Tick {
  constructor(
    readonly elapsedS: number, readonly deltaS: number,
    readonly frameCount: number) { }
}

export interface Ticker {
  tick(t: Tick): void;
}
