import { BankAccount, BuyOrder, Exchange, SellOrder } from "./exchange";
import { Item } from "./assets";

var time = 0;
let item = Item.make("", "", 0, "");
var exchange = new Exchange(item);

// for (let i = 0; i < 1000; i++){
//     exchange.
// }