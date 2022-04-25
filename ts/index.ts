import { BlockBuild } from "./blockBuild";
import { Debug } from "./debug";
import { Game } from "./game";
import { S } from "./settings";

Debug.log(`Start home: ${S.float('sh')}`);

switch (S.float('sh')) {
  case 1: default: new BlockBuild(); break;
  case 2: new Game(); break;
}
