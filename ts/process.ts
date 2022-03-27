import { Source } from "./source";
import { Store } from "./store";

// A process uses resources to produce another resource.
export class Process {
  // Tracks progress toward completion of one unit.
  private progress = 0;

  // Set to true if this process has consumed the required resources.
  private supplied = false;
  constructor(private sources: Source[], private target: Store, private processTimeS: number) { }


  // Advances time in this process which consumes resources and advances
  // production.
  advance(deltaS: number) {
    if (!this.supplied) {
      for (const source of this.sources) {
        if (!source.isReady()) {
          return;
        }
      }
      // All sources are ready.
      for (const source of this.sources) {
        source.consume();
      }
      this.supplied = true;
    }
    // Note: this is not an `else` case.  `supplied` may be modified in the
    // branch above.
    if (this.supplied) {
      this.progress += deltaS / this.processTimeS;
    }
    if (this.progress >= 1) {
      this.target.addUnit();
      this.supplied = false;
      const surpluss = this.progress - 1;
      if (surpluss > 0) {
        const remainingTime = surpluss * this.processTimeS;
        // Schedule more work to use the surpluss time.  We use setTimeout
        // instead of making the call directly for two reasons: 1) this way
        // we don't make the call stack any deeper which could be a problem if 
        // we are trying to process hours of work, and 2) it allows all other
        // processes to take a step before this one takes another.
        // At some point in the near future, we will very likely want to make
        // this a work queue which is passed as an argument to `advance`.
        setTimeout(() => { this.advance(remainingTime) }, 0);
      }
      this.progress = 0.0;
    }
  }
}