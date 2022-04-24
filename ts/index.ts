import { BlockBuild } from "./blockBuild";
import { Game } from "./game";
import { S } from "./settings";

switch (S.float('sh')) {
  case 1: default: new BlockBuild(); break;
  case 2: new Game(); break;
}
