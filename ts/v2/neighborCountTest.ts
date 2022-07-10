import { Grid } from "./grid";
import { NeighborCount } from "./neighborCount";

const nc = new NeighborCount<number>();

for (let i = -10; i <= 10; ++i) {
  for (let j = -10; j <= 10; ++j) {
    for (let k = -10; k <= 10; ++k) {
      nc.set(Grid.makeTranslation(i, j, k), i + j + k);
    }
  }
}

let total = 0;
for (const e of nc.allElements()) {
  ++total;
}
console.log(`Total: ${total} == ${21 * 21 * 21}`);

let surface = 0;
for (const e of nc.externalElements()) {
  ++surface;
}
console.log(`Surface: ${surface} == ${8 + 21 * 19 * 6}`);

