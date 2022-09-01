import { Compounds } from "./compounds";

const compounds = new Compounds();
for (const name of compounds.allCompoundNames()) {
  console.log(name);
}

console.log(`${compounds.combine('iron-chondrite', 'iron-chondrite')} = iron`);
console.log(`${compounds.combine('iron-chondrite', 'carbon-chondrite')} = chromium-ore`);
console.log(`${compounds.combine('carbon-chondrite', 'iron-chondrite')} = chromium-ore`);

console.log(`${compounds.combine('steel-corner', 'steel-corner')} = steel-wedge`);

console.log(`${compounds.combine('steel-wedge', 'carbon-fiber-wedge')} = cluster-jet`);
