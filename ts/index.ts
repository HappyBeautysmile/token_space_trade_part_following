import { BlockBuild } from "./blockBuild";
import { Debug } from "./debug";
import { Game } from "./game";
import { S } from "./settings";

Debug.log(`Start home: ${S.float('sh')}`);

if (S.float('sh') < 2 || !S.float('sh')) {
  new BlockBuild();
} else {
  new Game();
}
