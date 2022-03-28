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

export class Order {
  constructor(readonly item: string,
    readonly quantity: number, readonly priceEach: number,
    readonly bankAccount: BankAccount) { }
}

type OrderType = 'buy' | 'sell';

class OrderList {
  private orders: Order[] = [];
  constructor(private type: OrderType) { }
  addOrder(order: Order) {
    // Otherwise put order on stack
    this.orders.push(order);
    this.orders.sort((a: Order, b: Order) => {
      return a.priceEach - b.priceEach;
    });
  }

  popBestOrder(): Order {
    if (this.type === 'buy') {
      for (let i = this.orders.length - 1; i >= 0; --i) {
        const order = this.orders[i];
        const value = order.priceEach * order.quantity;
        if (value <= order.bankAccount.getBalance()) {
          return this.orders.splice(i, 1)[0];
        }
      }
    } else {
      return this.orders.splice(0, 1)[0];
    }
    return null;
  }

  peekBestOrder(): Order {
    if (this.type === 'buy') {
      return this.orders[this.orders.length - 1];
    } else {
      return this.orders[0];
    }
  }

  // Fills and order and returns the number of units sold
  fill(order: Order): number {
    const bestOrder = this.popBestOrder();
    const itemCount = Math.min(order.quantity, bestOrder.quantity);
    const value = itemCount * bestOrder.priceEach;
    try {
      if (this.type === 'buy') {
        bestOrder.bankAccount.removeFunds(value);
        order.bankAccount.addFunds(value);
      } else {
        order.bankAccount.removeFunds(value);
        bestOrder.bankAccount.addFunds(value);
      }
      if (itemCount < bestOrder.quantity) {
        this.addOrder(new Order(
          bestOrder.item, bestOrder.quantity - itemCount,
          bestOrder.priceEach, bestOrder.bankAccount));
      }
      return itemCount;
    } catch (e) {
      // Transaction failed.  Put the order back into the stack.
      this.addOrder(bestOrder);
    }
    return 0;
  }
}

export class Exchange {
  private sellOrders: Map<string, OrderList> = new Map<string, OrderList>();
  private buyOrders: Map<string, OrderList> = new Map<string, OrderList>();

  private addOrInsert(order: Order, type: OrderType, m: Map<string, OrderList>) {
    if (!m.has(order.item)) {
      m.set(order.item, new OrderList(type));
    }
    m.get(order.item).addOrder(order);
  }

  addBuyOrder(buyOrder: Order) {
    // Fill the order if there is something less than or equal to buy price
    const list = this.sellOrders.get(buyOrder.item);
    if (list) {
      const best = list.peekBestOrder();
      if (best && list.peekBestOrder().priceEach <= buyOrder.priceEach) {
        list.fill(buyOrder);
        return;
      } // Otherwise put order on stack
    }
    this.addOrInsert(buyOrder, 'buy', this.buyOrders);
  }

  addSellOrder(sellOrder: Order) {
    // Fill the order if there is something greater than or equal to sell price

    // Otherwise put order on stack
    this.addOrInsert(sellOrder, 'sell', this.sellOrders);
  }

  getBestBuyOrder(item: string) {
    if (!this.buyOrders.has(item)) {
      return null;
    }
    return this.buyOrders.get(item).peekBestOrder();
  }
}