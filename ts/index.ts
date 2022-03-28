import { BankAccount, Exchange, Order } from "./exchange";

var time = 0;
var exchange = new Exchange();

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
      const order = exchange.getBestBuyOrder('iron');
      let bid = 1;
      if (order !== null) {
        bid = order.priceEach + 1;
      }
      if (bid <= this.maxBid) {
        exchange.addBuyOrder(new Order(
          'iron', 1, bid, this.bankAccount));
      }
    }
  }
}

var buyers: Buyer[] = [];

for (let i = 0; i < 100; ++i) {
  buyers.push(new Buyer(Math.random() * 10, Math.random() * 100, exchange));
}

const sellerAccount = new BankAccount(0);
let factoryCount = 1;

for (let step = 0; step < 5000; ++step) {
  const demand = exchange.getBestBuyOrder('iron');
  if (demand === null) {
    exchange.addSellOrder(new Order('iron', factoryCount, 1, sellerAccount));
  } else {
    exchange.addSellOrder(
      new Order('iron', factoryCount, demand.priceEach, sellerAccount));
  }
  for (const b of buyers) {
    b.step(0.1);
  }
  if (sellerAccount.getBalance() > 1000) {
    console.log('New Factory Purchased.');
    ++factoryCount;
    sellerAccount.removeFunds(1000);
  }
  if (step % 100 === 0) {
    console.log(`${demand ? demand.priceEach : 'None'} balance: ${sellerAccount.getBalance()}`);
  }
}



