import { Compounds } from "./compounds";

async function test() {
  const compounds = new Compounds();
  for (const name of compounds.allCompoundNames()) {
    console.log(name);
  }
}

test();

