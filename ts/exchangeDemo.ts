import { BankAccount, BuyOrder, Exchange, SellOrder } from "./exchange";
import { Item } from "./assets";

var time = 0;
let item = Item.make("", "", 0, "");
var exchange = new Exchange(item);

class Buyer {
  private timeRemaining: number;
  private bankAccount: BankAccount = new BankAccount(1000);
  constructor(private buyIntervalS: number, private maxBid: number,
    private exchange: Exchange) {
    this.timeRemaining = buyIntervalS;
  }
  step(deltaS: number) {
    this.timeRemaining -= deltaS;
    if (this.timeRemaining < 0) {
      this.timeRemaining += this.buyIntervalS;
      const myBuyPrice = exchange.getHighestBuyPrice() + 1;
      exchange.placeBuyOrder(new BuyOrder(
        1, myBuyPrice, this.bankAccount));
    }
  }
}

var buyers: Buyer[] = [];

for (let i = 0; i < 100; ++i) {
  buyers.push(new Buyer(Math.random() * 10, Math.random() * 100, exchange));
}

const sellerAccount = new BankAccount(0);
let factoryCount = 1;
let inventory = 0;

for (let step = 0; step < 20000; ++step) {
  if (step % 10 === 0) {
    inventory += factoryCount;
  }
  const demand = exchange.getHighestBuyPrice();
  if (demand > 0) {
    const numSold = exchange.sellWithLimit(
      new SellOrder(inventory, 10, sellerAccount));
    inventory -= numSold;
  }
  for (const b of buyers) {
    b.step(0.1);
  }
  if (sellerAccount.getBalance() > 4000) {
    ++factoryCount;
    sellerAccount.removeFunds(4000);
  }
  if (step % 100 === 0) {
    console.log(`Price: ${demand} balance: ${sellerAccount.getBalance()} inventory: ${inventory} factories: ${factoryCount}`);
  }
}



