/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 253:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Exchange = exports.Order = exports.BankAccount = void 0;
class BankAccount {
    initialBalance;
    balance;
    constructor(initialBalance) {
        this.initialBalance = initialBalance;
        this.balance = initialBalance;
    }
    removeFunds(ammount) {
        if (this.balance < ammount) {
            throw new Error("Insufficient funds.");
        }
        this.balance -= ammount;
    }
    addFunds(ammount) {
        this.balance += ammount;
    }
    getBalance() { return this.balance; }
}
exports.BankAccount = BankAccount;
class Order {
    item;
    quantity;
    priceEach;
    bankAccount;
    constructor(item, quantity, priceEach, bankAccount) {
        this.item = item;
        this.quantity = quantity;
        this.priceEach = priceEach;
        this.bankAccount = bankAccount;
    }
}
exports.Order = Order;
class OrderList {
    type;
    orders = [];
    constructor(type) {
        this.type = type;
    }
    addOrder(order) {
        // Otherwise put order on stack
        this.orders.push(order);
        this.orders.sort((a, b) => {
            return a.priceEach - b.priceEach;
        });
    }
    popBestOrder() {
        if (this.type === 'buy') {
            for (let i = this.orders.length - 1; i >= 0; --i) {
                const order = this.orders[i];
                const value = order.priceEach * order.quantity;
                if (value <= order.bankAccount.getBalance()) {
                    return this.orders.splice(i, 1)[0];
                }
            }
        }
        else {
            return this.orders.splice(0, 1)[0];
        }
        return null;
    }
    peekBestOrder() {
        if (this.type === 'buy') {
            return this.orders[this.orders.length - 1];
        }
        else {
            return this.orders[0];
        }
    }
    // Fills and order and returns the number of units sold
    fill(order) {
        const bestOrder = this.popBestOrder();
        const itemCount = Math.min(order.quantity, bestOrder.quantity);
        const value = itemCount * bestOrder.priceEach;
        try {
            if (this.type === 'buy') {
                bestOrder.bankAccount.removeFunds(value);
                order.bankAccount.addFunds(value);
            }
            else {
                order.bankAccount.removeFunds(value);
                bestOrder.bankAccount.addFunds(value);
            }
            if (itemCount < bestOrder.quantity) {
                this.addOrder(new Order(bestOrder.item, bestOrder.quantity - itemCount, bestOrder.priceEach, bestOrder.bankAccount));
            }
            return itemCount;
        }
        catch (e) {
            // Transaction failed.  Put the order back into the stack.
            this.addOrder(bestOrder);
        }
        return 0;
    }
}
class Exchange {
    sellOrders = new Map();
    buyOrders = new Map();
    addOrInsert(order, type, m) {
        if (!m.has(order.item)) {
            m.set(order.item, new OrderList(type));
        }
        m.get(order.item).addOrder(order);
    }
    addBuyOrder(buyOrder) {
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
    addSellOrder(sellOrder) {
        // Fill the order if there is something greater than or equal to sell price
        // Otherwise put order on stack
        this.addOrInsert(sellOrder, 'sell', this.sellOrders);
    }
    getBestBuyOrder(item) {
        if (!this.buyOrders.has(item)) {
            return null;
        }
        return this.buyOrders.get(item).peekBestOrder();
    }
}
exports.Exchange = Exchange;
//# sourceMappingURL=exchange.js.map

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
var __webpack_unused_export__;

__webpack_unused_export__ = ({ value: true });
const exchange_1 = __webpack_require__(253);
var time = 0;
var exchange = new exchange_1.Exchange();
class Buyer {
    buyIntervalS;
    maxBid;
    exchange;
    timeRemaining;
    bankAccount = new exchange_1.BankAccount(1000);
    constructor(buyIntervalS, maxBid, exchange) {
        this.buyIntervalS = buyIntervalS;
        this.maxBid = maxBid;
        this.exchange = exchange;
        this.timeRemaining = buyIntervalS;
    }
    step(deltaS) {
        this.timeRemaining -= deltaS;
        if (this.timeRemaining < 0) {
            this.timeRemaining += this.buyIntervalS;
            const order = exchange.getBestBuyOrder('iron');
            let bid = 1;
            if (order !== null) {
                bid = order.priceEach + 1;
            }
            if (bid <= this.maxBid) {
                exchange.addBuyOrder(new exchange_1.Order('iron', 1, bid, this.bankAccount));
            }
        }
    }
}
var buyers = [];
for (let i = 0; i < 100; ++i) {
    buyers.push(new Buyer(Math.random() * 10, Math.random() * 100, exchange));
}
const sellerAccount = new exchange_1.BankAccount(0);
let factoryCount = 1;
for (let step = 0; step < 5000; ++step) {
    const demand = exchange.getBestBuyOrder('iron');
    if (demand === null) {
        exchange.addSellOrder(new exchange_1.Order('iron', factoryCount, 1, sellerAccount));
    }
    else {
        exchange.addSellOrder(new exchange_1.Order('iron', factoryCount, demand.priceEach, sellerAccount));
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
//# sourceMappingURL=index.js.map
})();

/******/ })()
;
//# sourceMappingURL=index.js.map