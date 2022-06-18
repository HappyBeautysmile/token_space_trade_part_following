import { Item } from "./assets";

export class BankAccount {
  private balance: number;
  constructor(private initialBalance: number) {
    this.balance = initialBalance;
  }
  removeFunds(ammount: number) {
    if (this.balance < ammount) {
      throw new Error("Insufficient funds.");
    }
    this.balance -= ammount;
  }
  addFunds(ammount: number) {
    this.balance += ammount;
  }
  getBalance(): number { return this.balance; }
}

// These two types are identical now.  We keep them like this so that
// the compiler will do type checking and make sure we're not doing
// something insane.
export class BuyOrder {
  constructor(readonly quantity: number, readonly priceEach: number,
    readonly bankAccount: BankAccount) { }
}

export class SellOrder {
  constructor(readonly quantity: number, readonly priceEach: number,
    readonly bankAccount: BankAccount) { }
}


export class Exchange {
  constructor(readonly item: Item) { }

  public buyOrders: BuyOrder[] = [];
  public sellOrders: SellOrder[] = [];

  // If `update` is set to true, cancel the existing order and
  // replace it with this one.
  placeBuyOrder(buyOrder: BuyOrder, update = true) {
    if (update) {
      for (let i = 0; i < this.buyOrders.length;) {
        if (this.buyOrders[i].bankAccount === buyOrder.bankAccount) {
          this.buyOrders.splice(i, 1);
        } else {
          ++i;
        }
      }
    }
    this.buyOrders.push(buyOrder);
  }

  placeSellOrder(sellOrder: SellOrder, update = true) {
    this.sellOrders.push(sellOrder);
  }

  matchOrders() {
    for (let b of this.buyOrders) {
      for (let s of this.sellOrders) {
        if (b.priceEach >= s.priceEach) {

        }
      }
    }
  }

  // Removes any orders which cannot be filled because the
  // buyer has insufficient funds.
  private cleanOrders() {
    for (let i = 0; i < this.buyOrders.length;) {
      const buyOrder = this.buyOrders[i];
      if (buyOrder.priceEach * buyOrder.quantity > buyOrder.bankAccount.getBalance()) {
        this.buyOrders.splice(i, 1);
      } else {
        ++i;
      }
    }
  }

  private fillOrders(buy: BuyOrder, sell: SellOrder): number {
    const numItems = Math.min(buy.quantity, sell.quantity);
    const value = numItems * sell.priceEach;
    buy.bankAccount.removeFunds(value);
    sell.bankAccount.addFunds(value);

    return numItems;
  }

  // Returns the highest price someone is currently bidding.
  // Returns zero if there are no bids.
  getHighestBuyPrice(): number {
    let highest = 0;
    for (const o of this.buyOrders) {
      highest = Math.max(o.priceEach, highest);
    }
    return highest;
  }

  sellWithLimit(sell: SellOrder): number {
    if (this.buyOrders.length === 0) {
      return 0;
    }
    this.cleanOrders();

    // Sort buy orders with most expensive at the top.
    this.buyOrders.sort((a: BuyOrder, b: BuyOrder) => {
      return b.priceEach - a.priceEach;
    });

    if (this.buyOrders.length > 1) {
      if (this.buyOrders[0].priceEach < this.buyOrders[1].priceEach) {
        throw new Error("Bad sort!!!");
      }
    }

    let numberForSale = sell.quantity;
    let totalSold = 0;

    while (this.buyOrders.length > 0) {
      if (this.buyOrders[0].priceEach >= sell.priceEach) {
        const buy = this.buyOrders.shift();
        const numSold = this.fillOrders(buy, sell);
        totalSold += numSold;
        if (buy.quantity > numSold) {
          this.buyOrders.unshift(
            new BuyOrder(buy.quantity - numSold, buy.priceEach,
              buy.bankAccount));
        }
        if (numberForSale > numSold) {
          numberForSale -= numSold;
          if (numberForSale < 0) {
            throw new Error('Oversold!!!');
          }
          sell = new SellOrder(numberForSale, sell.priceEach, sell.bankAccount);
        } else {
          // Everything is sold.
          break;
        }
        if (numberForSale < 0) {
          throw new Error('Oversold!!!');
        }
      } else {
        // The highest bidding buyer won't pay the lowest sale price.
        // So, there are no more possible matches.
        break;
      }
    }
    return totalSold;
  }
}