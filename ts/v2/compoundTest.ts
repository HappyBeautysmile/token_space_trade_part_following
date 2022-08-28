import { Assets } from "./assets";
import { Compounds } from "./compounds";


async function test() {
  const compounds = new Compounds();
  const assets = await Assets.load();
  compounds.validate(assets);
}

test();

