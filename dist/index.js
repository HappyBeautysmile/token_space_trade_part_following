/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 253:
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Exchange = exports.SellOrder = exports.BuyOrder = exports.BankAccount = void 0;
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
// These two types are identical now.  We keep them like this so that
// the compiler will do type checking and make sure we're not doing
// something insane.
class BuyOrder {
    quantity;
    priceEach;
    bankAccount;
    constructor(quantity, priceEach, bankAccount) {
        this.quantity = quantity;
        this.priceEach = priceEach;
        this.bankAccount = bankAccount;
    }
}
exports.BuyOrder = BuyOrder;
class SellOrder {
    quantity;
    priceEach;
    bankAccount;
    constructor(quantity, priceEach, bankAccount) {
        this.quantity = quantity;
        this.priceEach = priceEach;
        this.bankAccount = bankAccount;
    }
}
exports.SellOrder = SellOrder;
class Exchange {
    item;
    constructor(item) {
        this.item = item;
    }
    buyOrders = [];
    // If `update` is set to true, cancel the existing order and
    // replace it with this one.
    placeBuyOrder(buyOrder, update = true) {
        if (update) {
            for (let i = 0; i < this.buyOrders.length;) {
                if (this.buyOrders[i].bankAccount === buyOrder.bankAccount) {
                    this.buyOrders.splice(i, 1);
                }
                else {
                    ++i;
                }
            }
        }
        this.buyOrders.push(buyOrder);
    }
    // Removes any orders which cannot be filled because the
    // buyer has insufficient funds.
    cleanOrders() {
        for (let i = 0; i < this.buyOrders.length;) {
            const buyOrder = this.buyOrders[i];
            if (buyOrder.priceEach * buyOrder.quantity > buyOrder.bankAccount.getBalance()) {
                this.buyOrders.splice(i, 1);
            }
            else {
                ++i;
            }
        }
    }
    fillOrders(buy, sell) {
        const numItems = Math.min(buy.quantity, sell.quantity);
        const value = numItems * sell.priceEach;
        buy.bankAccount.removeFunds(value);
        sell.bankAccount.addFunds(value);
        return numItems;
    }
    // Returns the highest price someone is currently bidding.
    // Returns zero if there are no bids.
    getHighestBuyPrice() {
        let highest = 0;
        for (const o of this.buyOrders) {
            highest = Math.max(o.priceEach, highest);
        }
        return highest;
    }
    sellWithLimit(sell) {
        if (this.buyOrders.length === 0) {
            return 0;
        }
        this.cleanOrders();
        // Sort buy orders with most expensive at the top.
        this.buyOrders.sort((a, b) => {
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
                    this.buyOrders.unshift(new BuyOrder(buy.quantity - numSold, buy.priceEach, buy.bankAccount));
                }
                if (numberForSale > numSold) {
                    numberForSale -= numSold;
                    if (numberForSale < 0) {
                        throw new Error('Oversold!!!');
                    }
                    sell = new SellOrder(numberForSale, sell.priceEach, sell.bankAccount);
                }
                else {
                    // Everything is sold.
                    break;
                }
                if (numberForSale < 0) {
                    throw new Error('Oversold!!!');
                }
            }
            else {
                // The highest bidding buyer won't pay the lowest sale price.
                // So, there are no more possible matches.
                break;
            }
        }
        return totalSold;
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
var exchange = new exchange_1.Exchange('iron');
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
            const myBuyPrice = exchange.getHighestBuyPrice() + 1;
            exchange.placeBuyOrder(new exchange_1.BuyOrder(1, myBuyPrice, this.bankAccount));
        }
    }
}
var buyers = [];
for (let i = 0; i < 100; ++i) {
    buyers.push(new Buyer(Math.random() * 10, Math.random() * 100, exchange));
}
const sellerAccount = new exchange_1.BankAccount(0);
let factoryCount = 1;
let inventory = 0;
for (let step = 0; step < 20000; ++step) {
    if (step % 10 === 0) {
        inventory += factoryCount;
    }
    const demand = exchange.getHighestBuyPrice();
    if (demand > 0) {
        const numSold = exchange.sellWithLimit(new exchange_1.SellOrder(inventory, 10, sellerAccount));
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
//# sourceMappingURL=index.js.map
})();

/******/ })()
;
//# sourceMappingURL=index.js.map